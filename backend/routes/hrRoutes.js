const express = require('express');
const router = express.Router();
const db = require('../config/db');

// แดชบอร์ดฝ่ายทรัพยากรบุคคล (HR Overview)
router.get('/dashboard', async (req, res) => {
  try {
    const [userCount] = await db.query('SELECT COUNT(*) as count FROM User');
    const [traineeCount] = await db.query('SELECT COUNT(*) as count FROM Trainee');
    const [trainerCount] = await db.query('SELECT COUNT(*) as count FROM TrainerBA');
    const [completedRoadmaps] = await db.query("SELECT COUNT(*) as count FROM TrainingRoadmap WHERE Status = 'Completed'");
    const [reportsCount] = await db.query('SELECT COUNT(*) as count FROM ProbationReport');
    
    const [avgScores] = await db.query(`
      SELECT AVG(Development_Score) as dev,
             AVG(BusinessLogic_Score) as biz,
             AVG(Communication_Score) as comm
      FROM Evaluation
    `);

    const [recentSubmissions] = await db.query(`
      SELECT s.Submission_ID,
             t.Trainee_ID,
             t.Name AS TraineeName,
             u.Username AS TraineeUsername,
             a.Title AS AssignmentTitle,
             s.Version_No,
             s.Submitted_At AS SubmittedAt,
             s.Status,
             e.Status AS EvalStatus,
             e.Development_Score, e.BusinessLogic_Score, e.Communication_Score,
             tr.Name AS TrainerName
      FROM Submission s
      JOIN Trainee t ON s.Trainee_ID = t.Trainee_ID
      LEFT JOIN User u ON u.User_ID = t.User_ID
      JOIN Assignment a ON s.Assignment_ID = a.Assignment_ID
      LEFT JOIN Evaluation e ON e.Submission_ID = s.Submission_ID
      LEFT JOIN TrainerBA tr ON tr.Trainer_ID = e.Trainer_ID
      ORDER BY s.Submitted_At DESC, s.Submission_ID DESC LIMIT 8
    `);

    res.json({
      success: true,
      stats: {
        totalUsers: userCount[0]?.count || 0,
        trainees: traineeCount[0]?.count || 0,
        trainers: trainerCount[0]?.count || 0,
        completedRoadmaps: completedRoadmaps[0]?.count || 0,
        probationReports: reportsCount[0]?.count || 0,
        avgDev: avgScores[0]?.dev ? Number(avgScores[0].dev).toFixed(2) : '-',
        avgBiz: avgScores[0]?.biz ? Number(avgScores[0].biz).toFixed(2) : '-',
        avgComm: avgScores[0]?.comm ? Number(avgScores[0].comm).toFixed(2) : '-'
      },
      recentSubmissions
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// รายการส่งงานทั้งหมดของ Trainee สำหรับ HR ตรวจสอบ
router.get('/submissions', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.Submission_ID,
             t.Trainee_ID,
             t.Name AS TraineeName,
             u.Username AS TraineeUsername,
             a.Title AS AssignmentTitle,
             s.Version_No,
             s.Submitted_At AS SubmittedAt,
             s.Status,
             e.Status AS EvalStatus,
             e.Development_Score, e.BusinessLogic_Score, e.Communication_Score,
             f.Feedback_Note,
             tr.Name AS TrainerName
      FROM Submission s
      JOIN Trainee t ON s.Trainee_ID = t.Trainee_ID
      LEFT JOIN User u ON u.User_ID = t.User_ID
      JOIN Assignment a ON s.Assignment_ID = a.Assignment_ID
      LEFT JOIN Evaluation e ON e.Submission_ID = s.Submission_ID
      LEFT JOIN Feedback f ON f.Evaluation_ID = e.Evaluation_ID
      LEFT JOIN TrainerBA tr ON tr.Trainer_ID = e.Trainer_ID
      ORDER BY s.Submitted_At DESC, s.Submission_ID DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// รายชื่อผู้ใช้ทั้งหมด (UC-14)
router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.User_ID, u.Username, u.User_Role as Role,
             COALESCE(t.Name, tr.Name, h.Name) AS Name,
             COALESCE(t.Position, tr.Position, h.Position) AS Position,
             COALESCE(tr.Department, h.Department, '-') AS Department,
             t.Trainee_ID, tr.Trainer_ID, h.Hr_ID
      FROM User u
      LEFT JOIN Trainee t ON u.User_ID = t.User_ID
      LEFT JOIN TrainerBA tr ON u.User_ID = tr.User_ID
      LEFT JOIN HR h ON u.User_ID = h.User_ID
      ORDER BY u.User_ID
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// เพิ่มผู้ใช้งานใหม่ (UC-14)
router.post('/users', async (req, res) => {
  const { username, password, name, role, position, department, skillLevel } = req.body;
  if (!username || !password || !name || !role) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูล Username, Password, ชื่อ และบทบาทให้ครบถ้วน' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [r] = await conn.query(
      'INSERT INTO User (Username, Password, User_Role) VALUES (?, ?, ?)',
      [username.trim(), password.trim(), role]
    );
    const userId = r.insertId;

    if (role === 'Trainee') {
      const [trResult] = await conn.query(
        `INSERT INTO Trainee (User_ID, Name, Position, Start_Date, Skill_Level)
         VALUES (?, ?, ?, CURDATE(), ?)`,
        [userId, name.trim(), position || 'Software Developer', skillLevel || 'Beginner']
      );
      
      // ผูก Roadmap เริ่มต้นให้กับ Trainee ใหม่
      const traineeId = trResult.insertId;
      const [firstTrainer] = await conn.query('SELECT Trainer_ID FROM TrainerBA LIMIT 1');
      const trainerId = firstTrainer[0]?.Trainer_ID || 1;

      const [rmResult] = await conn.query(
        `INSERT INTO TrainingRoadmap (Trainee_ID, Trainer_ID, Title, Description, Start_Date, End_Date, Status)
         VALUES (?, ?, 'Onboarding Roadmap - ' || ?, 'แผนฝึกอบรมเริ่มต้น 60 วัน', CURDATE(), DATE('now', '+60 days'), 'In_Progress')`,
        [traineeId, trainerId, name.trim()]
      );

      // ผูก Assignments ทั้งหมดเข้ากับ Roadmap
      const [assignments] = await conn.query('SELECT Assignment_ID FROM Assignment ORDER BY Assignment_ID');
      for (let i = 0; i < assignments.length; i++) {
        await conn.query(
          `INSERT INTO RoadmapItem (Roadmap_ID, Assignment_ID, Seq_No, Status)
           VALUES (?, ?, ?, ?)`,
          [rmResult.insertId, assignments[i].Assignment_ID, i + 1, i === 0 ? 'In_Progress' : 'Not_Started']
        );
      }

    } else if (role === 'Trainer') {
      await conn.query(
        `INSERT INTO TrainerBA (User_ID, Name, Position, Department)
         VALUES (?, ?, ?, ?)`,
        [userId, name.trim(), position || 'Senior Developer', department || 'IT Development']
      );
    } else if (role === 'HR') {
      await conn.query(
        `INSERT INTO HR (User_ID, Name, Position, Department)
         VALUES (?, ?, ?, ?)`,
        [userId, name.trim(), position || 'HR Specialist', department || 'Human Resources']
      );
    }

    await conn.commit();
    res.status(201).json({ success: true, userId, message: 'สร้างบัญชีผู้ใช้ใหม่เรียบร้อยแล้ว' });
  } catch (err) {
    try { await conn.rollback(); } catch { /* ignore */ }
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

// แก้ไขผู้ใช้
router.put('/users/:id', async (req, res) => {
  const { name, password, position, department } = req.body;
  const id = req.params.id;
  if (!name) return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อ' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    if (password && password.trim()) {
      await conn.query('UPDATE User SET Password = ? WHERE User_ID = ?', [password.trim(), id]);
    }

    await conn.query('UPDATE Trainee SET Name = ?, Position = ? WHERE User_ID = ?', [name.trim(), position, id]);
    await conn.query('UPDATE TrainerBA SET Name = ?, Position = ?, Department = ? WHERE User_ID = ?', [name.trim(), position, department, id]);
    await conn.query('UPDATE HR SET Name = ?, Position = ?, Department = ? WHERE User_ID = ?', [name.trim(), position, department, id]);

    await conn.commit();
    res.json({ success: true, message: 'แก้ไขข้อมูลผู้ใช้เรียบร้อย' });
  } catch (err) {
    try { await conn.rollback(); } catch { /* ignore */ }
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

// ลบผู้ใช้
router.delete('/users/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await db.query('DELETE FROM User WHERE User_ID = ?', [id]);
    res.json({ success: true, message: 'ลบผู้ใช้งานเรียบร้อย' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// UC-15 & UC-16: ระบบสนับสนุนการตัดสินใจ & รายงาน Probation (Decision Support & BR-2)
// ==========================================
router.get('/trainees-summary', async (req, res) => {
  try {
    const [trainees] = await db.query(`
      SELECT t.Trainee_ID, t.Name, t.Position, t.Start_Date, t.Skill_Level,
             r.Roadmap_ID, r.Title as RoadmapTitle, r.Status as RoadmapStatus,
             r.Start_Date as RoadmapStart, r.End_Date as RoadmapEnd,
             pr.Report_ID, pr.Status as ReportStatus, pr.Remark as ReportRemark,
             pr.Created_At as ReportDate
      FROM Trainee t
      LEFT JOIN TrainingRoadmap r ON r.Trainee_ID = t.Trainee_ID
      LEFT JOIN ProbationReport pr ON pr.Trainee_ID = t.Trainee_ID
      ORDER BY t.Trainee_ID
    `);

    const [items] = await db.query('SELECT Roadmap_ID, Status FROM RoadmapItem');
    const [evals] = await db.query(`
      SELECT s.Trainee_ID, e.Development_Score, e.BusinessLogic_Score, e.Communication_Score
      FROM Evaluation e
      JOIN Submission s ON s.Submission_ID = e.Submission_ID
    `);

    const summary = trainees.map(t => {
      const myItems = items.filter(i => i.Roadmap_ID === t.Roadmap_ID);
      const totalTasks = myItems.length;
      const completedTasks = myItems.filter(i => i.Status === 'Completed').length;

      const myEvals = evals.filter(e => e.Trainee_ID === t.Trainee_ID);
      const evalCount = myEvals.length;
      const avgDev = evalCount ? myEvals.reduce((s, e) => s + e.Development_Score, 0) / evalCount : null;
      const avgBiz = evalCount ? myEvals.reduce((s, e) => s + e.BusinessLogic_Score, 0) / evalCount : null;
      const avgComm = evalCount ? myEvals.reduce((s, e) => s + e.Communication_Score, 0) / evalCount : null;
      const avgTotal = evalCount ? (avgDev + avgBiz + avgComm) / 3 : null;

      // BR-1: แต่ละด้าน >= 2.00
      const passBR1 = evalCount > 0 && avgDev >= 2.0 && avgBiz >= 2.0 && avgComm >= 2.0;
      const isCompletedAll = totalTasks > 0 && completedTasks === totalTasks;

      // BR-2 Decision Support Recommendation:
      let recommendation = 'Pending';
      let recReason = '';
      if (isCompletedAll && passBR1) {
        recommendation = 'Passed';
        recReason = 'เรียนจบครบทุกบทและคะแนนทั้ง 3 ด้านผ่านเกณฑ์ ใช้ประกอบการพิจารณาทดลองงาน 4 เดือน';
      } else if (!passBR1 && evalCount > 0) {
        recommendation = 'Extended';
        recReason = 'มีคะแนนบางด้านต่ำกว่าเกณฑ์ 2.00 ควรให้ผู้ฝึกสอนทบทวนแผนพัฒนา';
      } else {
        recommendation = 'In_Progress';
        recReason = `ยังอยู่ระหว่างการฝึกอบรม (ส่งงานแล้ว ${completedTasks}/${totalTasks} บท)`;
      }

      return {
        ...t,
        totalTasks,
        completedTasks,
        evalCount,
        avgDev: avgDev !== null ? avgDev.toFixed(2) : null,
        avgBiz: avgBiz !== null ? avgBiz.toFixed(2) : null,
        avgComm: avgComm !== null ? avgComm.toFixed(2) : null,
        avgTotal: avgTotal !== null ? avgTotal.toFixed(2) : null,
        passBR1,
        isCompletedAll,
        recommendation,
        recReason
      };
    });

    res.json(summary);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// รายการ Probation Reports ที่เคยออกทั้งหมด
router.get('/probation-reports', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT pr.Report_ID, pr.Trainee_ID, pr.Hr_ID, pr.Status, pr.Remark, pr.Created_At,
             t.Name as TraineeName, t.Position as TraineePosition,
             h.Name as HrName
      FROM ProbationReport pr
      JOIN Trainee t ON t.Trainee_ID = pr.Trainee_ID
      JOIN HR h ON h.Hr_ID = pr.Hr_ID
      ORDER BY pr.Report_ID DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// บันทึกรายงาน Probation Report
router.post('/probation-report', async (req, res) => {
  const { traineeId, hrId, status, remark } = req.body;
  if (!traineeId || !hrId || !status) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  try {
    // ลบรายงานเดิมถ้ามี เพื่ออัปเดตเป็นรายงานฉบับล่าสุด
    await db.query('DELETE FROM ProbationReport WHERE Trainee_ID = ?', [traineeId]);
    
    const [r] = await db.query(
      'INSERT INTO ProbationReport (Trainee_ID, Hr_ID, Status, Remark) VALUES (?, ?, ?, ?)',
      [traineeId, hrId, status, remark ? remark.trim() : null]
    );
    res.json({ success: true, reportId: r.insertId, message: 'บันทึกรายงานผลการทดลองงาน (Probation Report) สำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ลบรายงาน Probation Report
router.delete('/probation-report/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM ProbationReport WHERE Report_ID = ?', [id]);
    res.json({ success: true, message: 'ลบรายงาน Probation สำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;