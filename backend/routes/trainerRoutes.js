const express = require('express');
const router = express.Router();
const db = require('../config/db');

// แดชบอร์ดสรุปของ Trainer (ภาพรวม & สถิติ)
router.get('/dashboard', async (req, res) => {
  try {
    const [traineeCount] = await db.query('SELECT COUNT(*) as count FROM Trainee');
    const [pendingSubCount] = await db.query("SELECT COUNT(*) as count FROM Submission WHERE Status = 'Submitted'");
    const [gradedSubCount] = await db.query("SELECT COUNT(*) as count FROM Submission WHERE Status = 'Graded'");
    const [materialCount] = await db.query('SELECT COUNT(*) as count FROM LearningMaterial');
    const [assignmentCount] = await db.query('SELECT COUNT(*) as count FROM Assignment');

    const [avgScores] = await db.query(`
      SELECT AVG(Development_Score) as dev,
             AVG(BusinessLogic_Score) as biz,
             AVG(Communication_Score) as comm
      FROM Evaluation
    `);

    // รายการงานรอตรวจล่าสุด 5 รายการ
    const [recentPending] = await db.query(`
      SELECT s.Submission_ID, t.Name AS TraineeName, a.Title AS AssignmentTitle,
             s.Version_No, s.Submitted_At
      FROM Submission s
      JOIN Trainee t ON s.Trainee_ID = t.Trainee_ID
      JOIN Assignment a ON s.Assignment_ID = a.Assignment_ID
      WHERE s.Status = 'Submitted'
      ORDER BY s.Submitted_At DESC LIMIT 5
    `);

    res.json({
      success: true,
      stats: {
        traineeCount: traineeCount[0]?.count || 0,
        pendingCount: pendingSubCount[0]?.count || 0,
        gradedCount: gradedSubCount[0]?.count || 0,
        materialCount: materialCount[0]?.count || 0,
        assignmentCount: assignmentCount[0]?.count || 0,
        avgDev: avgScores[0]?.dev ? Number(avgScores[0].dev).toFixed(2) : null,
        avgBiz: avgScores[0]?.biz ? Number(avgScores[0].biz).toFixed(2) : null,
        avgComm: avgScores[0]?.comm ? Number(avgScores[0].comm).toFixed(2) : null
      },
      recentPending
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// รายชื่อ Trainee ทั้งหมด พร้อมความคืบหน้า Roadmap และคะแนนเฉลี่ย
router.get('/trainees', async (req, res) => {
  try {
    const [trainees] = await db.query(`
      SELECT t.Trainee_ID, t.User_ID, t.Name, t.Position, t.Start_Date, t.Skill_Level,
             r.Roadmap_ID, r.Title as RoadmapTitle, r.Status as RoadmapStatus,
             r.Start_Date as RoadmapStart, r.End_Date as RoadmapEnd
      FROM Trainee t
      LEFT JOIN TrainingRoadmap r ON r.Trainee_ID = t.Trainee_ID
      ORDER BY t.Trainee_ID
    `);

    // ดึงความคืบหน้าของแต่ละคน
    const [items] = await db.query(`
      SELECT ri.Roadmap_ID, ri.Status
      FROM RoadmapItem ri
    `);

    const [evals] = await db.query(`
      SELECT s.Trainee_ID,
             e.Development_Score, e.BusinessLogic_Score, e.Communication_Score
      FROM Evaluation e
      JOIN Submission s ON s.Submission_ID = e.Submission_ID
    `);

    const result = trainees.map(t => {
      const myItems = items.filter(i => i.Roadmap_ID === t.Roadmap_ID);
      const totalTasks = myItems.length;
      const completedTasks = myItems.filter(i => i.Status === 'Completed').length;
      
      const myEvals = evals.filter(e => e.Trainee_ID === t.Trainee_ID);
      const evalCount = myEvals.length;
      const avgDev = evalCount ? myEvals.reduce((sum, e) => sum + e.Development_Score, 0) / evalCount : null;
      const avgBiz = evalCount ? myEvals.reduce((sum, e) => sum + e.BusinessLogic_Score, 0) / evalCount : null;
      const avgComm = evalCount ? myEvals.reduce((sum, e) => sum + e.Communication_Score, 0) / evalCount : null;

      // BR-1: ทุกด้าน >= 2.00
      const isPassBR1 = evalCount > 0 && avgDev >= 2.0 && avgBiz >= 2.0 && avgComm >= 2.0;

      return {
        ...t,
        totalTasks,
        completedTasks,
        progressPct: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        evalCount,
        avgDev: avgDev !== null ? avgDev.toFixed(2) : '-',
        avgBiz: avgBiz !== null ? avgBiz.toFixed(2) : '-',
        avgComm: avgComm !== null ? avgComm.toFixed(2) : '-',
        isPassBR1
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// รายการงานรอตรวจทั้งหมด (Status = 'Submitted')
router.get('/submissions', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.Submission_ID,
             t.Trainee_ID,
             t.Name AS TraineeName,
             u.Username AS TraineeUsername,
             t.Position AS TraineePosition,
             a.Assignment_ID,
             a.Title AS AssignmentTitle,
             a.Category,
             s.Version_No,
             s.Submitted_At AS SubmittedAt,
             s.Status
      FROM Submission s
      JOIN Trainee t ON s.Trainee_ID = t.Trainee_ID
      LEFT JOIN User u ON u.User_ID = t.User_ID
      JOIN Assignment a ON s.Assignment_ID = a.Assignment_ID
      WHERE s.Status = 'Submitted'
      ORDER BY s.Submitted_At DESC, s.Submission_ID DESC
    `);

    // แนบไฟล์ที่ส่ง
    const [allFiles] = await db.query('SELECT * FROM SubmissionFile');

    const result = rows.map(r => ({
      ...r,
      files: allFiles
        .filter(f => f.Submission_ID === r.Submission_ID)
        .map(f => ({ id: f.File_ID, name: f.File_Name, type: f.File_Type, url: f.File_URL }))
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ประวัติการตรวจประเมินทั้งหมด (Graded History)
router.get('/history', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.Submission_ID,
             t.Name AS TraineeName,
             u.Username AS TraineeUsername,
             a.Title AS AssignmentTitle,
             s.Version_No,
             e.Development_Score, e.BusinessLogic_Score, e.Communication_Score,
             e.Status, f.Feedback_Note, f.Created_At as EvaluatedAt,
             tr.Name as TrainerName
      FROM Submission s
      JOIN Trainee t ON s.Trainee_ID = t.Trainee_ID
      LEFT JOIN User u ON u.User_ID = t.User_ID
      JOIN Assignment a ON s.Assignment_ID = a.Assignment_ID
      JOIN Evaluation e ON e.Submission_ID = s.Submission_ID
      LEFT JOIN Feedback f ON f.Evaluation_ID = e.Evaluation_ID
      LEFT JOIN TrainerBA tr ON tr.Trainer_ID = e.Trainer_ID
      ORDER BY e.Evaluation_ID DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// บันทึกผลประเมินตามเกณฑ์ Rubric 3 ด้าน (UC-10, BR-1)
router.post('/evaluate', async (req, res) => {
  const { submissionId, trainerId, feedbackNote } = req.body;
  const devScore = Number(req.body.devScore);
  const bizScore = Number(req.body.bizScore);
  const commScore = Number(req.body.commScore);

  const fail = (code, msg) => res.status(code).json({ success: false, message: msg });

  if (!submissionId || !trainerId) return fail(400, 'ข้อมูลไม่ครบถ้วน');
  if (isNaN(devScore) || devScore < 1 || devScore > 4 ||
      isNaN(bizScore) || bizScore < 1 || bizScore > 4 ||
      isNaN(commScore) || commScore < 1 || commScore > 4) {
    return fail(400, 'คะแนนแต่ละด้านต้องอยู่ระหว่าง 1.00 ถึง 4.00');
  }
  if (!feedbackNote || !String(feedbackNote).trim()) {
    return fail(400, 'กรุณาระบุ Feedback / ข้อเสนอแนะแก่นักศึกษาฝึกอบรม');
  }

  // คำนวณผลตามกฎทางธุรกิจ BR-1: ทุกด้านต้อง >= 2.00 ถึงจะ Passed มิฉะนั้น Need_Revision
  const passed = devScore >= 2.0 && bizScore >= 2.0 && commScore >= 2.0;
  const status = passed ? 'Passed' : 'Need_Revision';

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [subRows] = await conn.query(
      'SELECT Trainee_ID, Assignment_ID, Status FROM Submission WHERE Submission_ID = ?',
      [submissionId]
    );
    const sub = subRows[0];
    if (!sub) {
      await conn.rollback();
      return fail(404, 'ไม่พบการส่งงานนี้');
    }
    if (sub.Status === 'Graded') {
      await conn.rollback();
      return fail(409, 'การส่งงานนี้ถูกประเมินไปแล้ว');
    }

    const [evalResult] = await conn.query(
      `INSERT INTO Evaluation (Submission_ID, Trainer_ID, Development_Score, BusinessLogic_Score, Communication_Score, Status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [submissionId, trainerId, devScore, bizScore, commScore, status]
    );

    await conn.query(
      'INSERT INTO Feedback (Evaluation_ID, Feedback_Note) VALUES (?, ?)',
      [evalResult.insertId, String(feedbackNote).trim()]
    );

    await conn.query("UPDATE Submission SET Status = 'Graded' WHERE Submission_ID = ?", [submissionId]);

    // หากผ่านเกณฑ์ (Passed) ให้ปรับสถานะ RoadmapItem เป็น Completed และปลดล็อกบทถัดไป (BR-3)
    if (status === 'Passed') {
      const [itemRows] = await conn.query(
        `SELECT ri.Item_ID, ri.Roadmap_ID, ri.Seq_No
         FROM RoadmapItem ri
         JOIN TrainingRoadmap r ON r.Roadmap_ID = ri.Roadmap_ID
         WHERE r.Trainee_ID = ? AND ri.Assignment_ID = ?`,
        [sub.Trainee_ID, sub.Assignment_ID]
      );
      const item = itemRows[0];
      if (item) {
        await conn.query("UPDATE RoadmapItem SET Status = 'Completed' WHERE Item_ID = ?", [item.Item_ID]);
        
        // ปลดล็อกบทถัดไป (Seq_No + 1)
        await conn.query(
          "UPDATE RoadmapItem SET Status = 'In_Progress' WHERE Roadmap_ID = ? AND Seq_No = ? AND Status = 'Not_Started'",
          [item.Roadmap_ID, item.Seq_No + 1]
        );

        // ตรวจสอบว่าผ่านครบทุกบทหรือยัง
        const [left] = await conn.query(
          "SELECT COUNT(*) AS remaining FROM RoadmapItem WHERE Roadmap_ID = ? AND Status <> 'Completed'",
          [item.Roadmap_ID]
        );
        if (Number(left[0]?.remaining || 0) === 0) {
          await conn.query("UPDATE TrainingRoadmap SET Status = 'Completed' WHERE Roadmap_ID = ?", [item.Roadmap_ID]);
        }
      }
    }

    await conn.commit();
    res.json({
      success: true,
      status,
      message: `บันทึกผลการประเมินและ Feedback สำเร็จ (${status === 'Passed' ? 'ผ่านเกณฑ์ BR-1 ✓' : 'ต้องแก้ไขปรับปรุง ⚠️'})`
    });
  } catch (err) {
    try { await conn.rollback(); } catch { /* ignore */ }
    res.status(500).json({ success: false, error: err.message, message: err.message });
  } finally {
    conn.release();
  }
});

// ==========================================
// UC-7: จัดการคลังสื่อการเรียนรู้ (LearningMaterial CRUD)
// ==========================================
router.get('/materials', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*, COUNT(a.Assignment_ID) as usedInAssignments
      FROM LearningMaterial m
      LEFT JOIN Assignment a ON a.Material_ID = m.Material_ID
      GROUP BY m.Material_ID
      ORDER BY m.Material_ID
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/materials', async (req, res) => {
  const { title, type, description, materialUrl } = req.body;
  if (!title || !type || !materialUrl) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อสื่อ ประเภท และลิงก์สื่อการสอน' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO LearningMaterial (Title, Type, Description, Material_URL) VALUES (?, ?, ?, ?)',
      [title.trim(), type, description ? description.trim() : null, materialUrl.trim()]
    );
    res.status(201).json({ success: true, materialId: result.insertId, message: 'เพิ่มสื่อการสอนสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/materials/:id', async (req, res) => {
  const { id } = req.params;
  const { title, type, description, materialUrl } = req.body;
  if (!title || !type || !materialUrl) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }
  try {
    await db.query(
      'UPDATE LearningMaterial SET Title = ?, Type = ?, Description = ?, Material_URL = ? WHERE Material_ID = ?',
      [title.trim(), type, description ? description.trim() : null, materialUrl.trim(), id]
    );
    res.json({ success: true, message: 'แก้ไขสื่อการสอนเรียบร้อย' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/materials/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // ตรวจสอบว่าถูกนำไปผูกกับโจทย์หรือไม่
    const [assigned] = await db.query('SELECT COUNT(*) as count FROM Assignment WHERE Material_ID = ?', [id]);
    if (assigned[0]?.count > 0) {
      return res.status(400).json({ success: false, message: 'ไม่สามารถลบได้ เนื่องจากสื่อนี้ถูกใช้งานในโจทย์แบบฝึกหัดอยู่' });
    }
    await db.query('DELETE FROM LearningMaterial WHERE Material_ID = ?', [id]);
    res.json({ success: true, message: 'ลบสื่อการสอนเรียบร้อย' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// UC-8: จัดการคลังโจทย์แบบฝึกหัด (Assignment CRUD)
// ==========================================
router.get('/assignments', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, m.Title as MaterialTitle, m.Type as MaterialType, m.Material_URL
      FROM Assignment a
      JOIN LearningMaterial m ON a.Material_ID = m.Material_ID
      ORDER BY a.Assignment_ID
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/assignments', async (req, res) => {
  const { materialId, title, description, category, difficultyLevel, deadline } = req.body;
  if (!materialId || !title || !category || !difficultyLevel || !deadline) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลโจทย์และกำหนดส่งให้ครบถ้วน' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO Assignment (Material_ID, Title, Description, Category, Difficulty_Level, Deadline)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [materialId, title.trim(), description ? description.trim() : null, category, difficultyLevel, deadline]
    );
    res.status(201).json({ success: true, assignmentId: result.insertId, message: 'เพิ่มโจทย์แบบฝึกหัดสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/assignments/:id', async (req, res) => {
  const { id } = req.params;
  const { materialId, title, description, category, difficultyLevel, deadline } = req.body;
  try {
    await db.query(
      `UPDATE Assignment 
       SET Material_ID = ?, Title = ?, Description = ?, Category = ?, Difficulty_Level = ?, Deadline = ?
       WHERE Assignment_ID = ?`,
      [materialId, title.trim(), description ? description.trim() : null, category, difficultyLevel, deadline, id]
    );
    res.json({ success: true, message: 'แก้ไขโจทย์เรียบร้อย' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/assignments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [used] = await db.query('SELECT COUNT(*) as count FROM RoadmapItem WHERE Assignment_ID = ?', [id]);
    if (used[0]?.count > 0) {
      return res.status(400).json({ success: false, message: 'ไม่สามารถลบโจทย์นี้ได้ เนื่องจากอยู่ในแผนการเรียนรู้ของพนักงาน' });
    }
    await db.query('DELETE FROM Assignment WHERE Assignment_ID = ?', [id]);
    res.json({ success: true, message: 'ลบโจทย์แบบฝึกหัดเรียบร้อย' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// UC-9: กำหนดแผนการเรียนรู้และมอบหมายโจทย์ (Assign Roadmap)
// ==========================================
router.post('/assign-roadmap', async (req, res) => {
  const { traineeId, trainerId, title, description, startDate, endDate, assignmentIds } = req.body;
  if (!traineeId || !trainerId || !title || !startDate || !endDate || !Array.isArray(assignmentIds) || assignmentIds.length === 0) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลแผนและเลือกโจทย์อย่างน้อย 1 ข้อ' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // ลบ Roadmap เก่าของ Trainee (ถ้ามี)
    const [existing] = await conn.query('SELECT Roadmap_ID FROM TrainingRoadmap WHERE Trainee_ID = ?', [traineeId]);
    for (const ex of existing) {
      await conn.query('DELETE FROM RoadmapItem WHERE Roadmap_ID = ?', [ex.Roadmap_ID]);
      await conn.query('DELETE FROM TrainingRoadmap WHERE Roadmap_ID = ?', [ex.Roadmap_ID]);
    }

    // สร้าง Roadmap ใหม่
    const [r] = await conn.query(
      `INSERT INTO TrainingRoadmap (Trainee_ID, Trainer_ID, Title, Description, Start_Date, End_Date, Status)
       VALUES (?, ?, ?, ?, ?, ?, 'In_Progress')`,
      [traineeId, trainerId, title.trim(), description ? description.trim() : null, startDate, endDate]
    );

    const roadmapId = r.insertId;

    // ผูกโจทย์แต่ละข้อตามลำดับ Seq_No
    for (let i = 0; i < assignmentIds.length; i++) {
      const asgId = assignmentIds[i];
      const seqNo = i + 1;
      const initialStatus = seqNo === 1 ? 'In_Progress' : 'Not_Started';
      await conn.query(
        `INSERT INTO RoadmapItem (Roadmap_ID, Assignment_ID, Seq_No, Status)
         VALUES (?, ?, ?, ?)`,
        [roadmapId, asgId, seqNo, initialStatus]
      );
    }

    await conn.commit();
    res.json({ success: true, message: 'กำหนดและมอบหมายแผนการฝึกอบรมให้พนักงานใหม่เรียบร้อยแล้ว' });
  } catch (err) {
    try { await conn.rollback(); } catch { /* ignore */ }
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;