const express = require('express');
const router = express.Router();
const db = require('../config/db');

// โหลดแผนการเรียนรู้ + บทเรียนทุกบท + ประวัติการส่งงาน/ผลประเมินของ Trainee
async function loadLearning(traineeId) {
  let realTraineeId = Number(traineeId);
  const [tr] = await db.query('SELECT Trainee_ID, Name FROM Trainee WHERE Trainee_ID = ?', [traineeId]);
  if (!tr.length) {
    const [byUser] = await db.query('SELECT Trainee_ID, Name FROM Trainee WHERE User_ID = ?', [traineeId]);
    if (byUser.length) realTraineeId = byUser[0].Trainee_ID;
  }

  const [rm] = await db.query(
    `SELECT r.*, t.Name AS Trainer_Name
     FROM TrainingRoadmap r
     JOIN TrainerBA t ON t.Trainer_ID = r.Trainer_ID
     WHERE r.Trainee_ID = ?
     ORDER BY r.Roadmap_ID DESC LIMIT 1`,
    [realTraineeId]
  );
  const roadmap = rm[0] || null;
  if (!roadmap) return { roadmap: null, items: [] };

  // บทเรียนในแผน พร้อมเงื่อนไขปลดล็อก (Seq 1 ปลดล็อกเสมอ, บทถัดไปปลดเมื่อบทก่อนหน้า Completed - BR-3)
  const [items] = await db.query(
    `SELECT ri.Item_ID, ri.Seq_No, ri.Status AS ItemStatus, ri.Assignment_ID,
            a.Title, a.Description, a.Category, a.Difficulty_Level, a.Deadline,
            m.Material_ID, m.Title AS MaterialTitle, m.Type AS MaterialType,
            m.Description AS MaterialDescription, m.Material_URL
     FROM RoadmapItem ri
     JOIN Assignment a ON a.Assignment_ID = ri.Assignment_ID
     JOIN LearningMaterial m ON m.Material_ID = a.Material_ID
     WHERE ri.Roadmap_ID = ?
     ORDER BY ri.Seq_No`,
    [roadmap.Roadmap_ID]
  );

  // ดึงประวัติการส่งงาน
  const [subs] = await db.query(
    `SELECT s.Submission_ID, s.Assignment_ID, s.Version_No, s.Submitted_At,
            s.Status AS SubmissionStatus,
            e.Evaluation_ID, e.Development_Score, e.BusinessLogic_Score, e.Communication_Score,
            e.Status AS EvalStatus, f.Feedback_Note, tr.Name AS Trainer_Name
     FROM Submission s
     LEFT JOIN Evaluation e ON e.Submission_ID = s.Submission_ID
     LEFT JOIN Feedback f ON f.Evaluation_ID = e.Evaluation_ID
     LEFT JOIN TrainerBA tr ON tr.Trainer_ID = e.Trainer_ID
     WHERE s.Trainee_ID = ?
     ORDER BY s.Assignment_ID, s.Version_No`,
    [realTraineeId]
  );

  // ดึงไฟล์แนบทั้งหมดของ Trainee คนนี้
  const [allFiles] = await db.query(
    `SELECT sf.File_ID, sf.Submission_ID, sf.File_Name, sf.File_Type, sf.File_URL
     FROM SubmissionFile sf
     JOIN Submission s ON s.Submission_ID = sf.Submission_ID
     WHERE s.Trainee_ID = ?`,
    [realTraineeId]
  );

  // 1. ผูกข้อมูลการส่งงานและผลประเมินเข้ากับแต่ละบท
  for (const it of items) {
    const mine = subs
      .filter((s) => s.Assignment_ID === it.Assignment_ID)
      .map((s) => {
        const files = allFiles
          .filter((f) => f.Submission_ID === s.Submission_ID)
          .map((f) => ({ name: f.File_Name, type: f.File_Type, url: f.File_URL }));
        return { ...s, Files: files };
      });

    it.submissions = mine;
    it.latest = mine.length ? mine[mine.length - 1] : null;

    // ถ้างานตรวจแล้วและผลเป็น Passed ถือว่าบทนี้ Completed
    if (it.latest && it.latest.EvalStatus === 'Passed') {
      if (it.ItemStatus !== 'Completed') {
        it.ItemStatus = 'Completed';
        await db.query("UPDATE RoadmapItem SET Status = 'Completed' WHERE Item_ID = ?", [it.Item_ID]).catch(() => {});
      }
    } else if (it.latest && it.ItemStatus === 'Completed') {
      it.ItemStatus = 'In_Progress';
      await db.query("UPDATE RoadmapItem SET Status = 'In_Progress' WHERE Item_ID = ?", [it.Item_ID]);
    }
  }

  // 2. คำนวณ Unlocked ตามกฎ BR-3 (บทที่ 1 ปลดล็อกเสมอ, บทถัดไปปลดเมื่อบทก่อนหน้าผ่าน/Completed)
  for (let idx = 0; idx < items.length; idx++) {
    if (items[idx].Seq_No === 1) {
      items[idx].Unlocked = true;
    } else {
      const prev = items[idx - 1];
      const prevCompleted = prev && (prev.ItemStatus === 'Completed' || (prev.latest && prev.latest.EvalStatus === 'Passed'));
      items[idx].Unlocked = Boolean(prevCompleted);
    }
  }

  // 3. กำหนด submitMode และ blockReason
  const decorated = items.map((it) => {
    const unlocked = !!it.Unlocked;
    let submitMode = null;
    let blockReason = null;

    if (!unlocked) {
      blockReason = 'LOCKED';
    } else if (it.ItemStatus === 'Completed' || (it.latest && it.latest.EvalStatus === 'Passed')) {
      blockReason = 'COMPLETED';
      submitMode = null; // ผ่านแล้ว ไม่เปิดการส่งงานเพิ่ม
    } else if (it.latest && !it.latest.EvalStatus) {
      blockReason = 'WAITING';
      submitMode = null; // รอผลตรวจ ก่อนเปิดการส่งแก้ไข
    } else {
      submitMode = it.latest ? 'resubmit' : 'new';
    }

    return { ...it, submitMode, blockReason };
  });

  return { roadmap, items: decorated };
}

router.get('/dashboard/:traineeId', async (req, res) => {
  try {
    const id = req.params.traineeId;
    let [tr] = await db.query(
      'SELECT Trainee_ID, Name, Position, Start_Date, Skill_Level FROM Trainee WHERE Trainee_ID = ?', [id]
    );
    if (!tr.length) {
      [tr] = await db.query(
        'SELECT Trainee_ID, Name, Position, Start_Date, Skill_Level FROM Trainee WHERE User_ID = ?', [id]
      );
    }
    const realId = tr[0]?.Trainee_ID || id;
    const learning = await loadLearning(realId);
    const [avgRows] = await db.query(
      `SELECT COUNT(*) AS cnt,
              AVG(e.Development_Score) AS dev,
              AVG(e.BusinessLogic_Score) AS biz,
              AVG(e.Communication_Score) AS comm
       FROM Evaluation e
       JOIN Submission s ON s.Submission_ID = e.Submission_ID
       WHERE s.Trainee_ID = ?`,
      [realId]
    );
    const a = avgRows[0] || {};
    const averages = {
      count: Number(a.cnt || 0),
      dev: a.dev === null || a.dev === undefined ? null : Number(a.dev),
      biz: a.biz === null || a.biz === undefined ? null : Number(a.biz),
      comm: a.comm === null || a.comm === undefined ? null : Number(a.comm)
    };
    res.json({ trainee: tr[0] || null, ...learning, averages });
  } catch (err) {
    res.status(500).json({ error: err.message, message: err.message });
  }
});

router.get('/roadmap/:traineeId', async (req, res) => {
  try {
    res.json(await loadLearning(req.params.traineeId));
  } catch (err) {
    res.status(500).json({ error: err.message, message: err.message });
  }
});

router.get('/assignments/:traineeId', async (req, res) => {
  try {
    res.json(await loadLearning(req.params.traineeId));
  } catch (err) {
    res.status(500).json({ error: err.message, message: err.message });
  }
});

// ส่งงาน (UC-4, UC-6 Resubmit)
router.post('/submit', async (req, res) => {
  const { traineeId, assignmentId, notes } = req.body;
  let files = req.body.files;
  if (!files && req.body.fileUrl) files = [{ url: req.body.fileUrl, name: 'Work Submission', type: 'URL' }];
  if (typeof files === 'string' && files.trim()) files = [{ url: files.trim(), name: 'Work Submission', type: 'URL' }];

  if (!traineeId || !assignmentId || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ success: false, message: 'กรุณาแนบผลงาน ลิงก์ หรือไฟล์อย่างน้อย 1 รายการ' });
  }

  const conn = await db.getConnection();
  try {
    // ตรวจสอบ Trainee จากทั้ง Trainee_ID และ User_ID เพื่อความถูกต้อง
    let [traineeRows] = await conn.query('SELECT Trainee_ID, Name FROM Trainee WHERE Trainee_ID = ?', [traineeId]);
    if (!traineeRows.length) {
      [traineeRows] = await conn.query('SELECT Trainee_ID, Name FROM Trainee WHERE User_ID = ?', [traineeId]);
    }
    if (!traineeRows.length) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลนักศึกษาฝึกอบรมในระบบ' });
    }
    const realTraineeId = traineeRows[0].Trainee_ID;
    const traineeName = traineeRows[0].Name;

    const { roadmap, items } = await loadLearning(realTraineeId);
    const item = items.find((i) => i.Assignment_ID === Number(assignmentId));
    if (!roadmap || !item) {
      return res.status(403).json({ success: false, message: 'โจทย์นี้ไม่ได้อยู่ในแผนการเรียนรู้ของคุณ' });
    }
    if (!item.Unlocked) {
      return res.status(403).json({ success: false, message: 'บทนี้ยังไม่ปลดล็อก กรุณาทำบทก่อนหน้าให้ผ่านก่อน (BR-3)' });
    }

    if (item.blockReason === 'COMPLETED' || item.blockReason === 'WAITING') {
      return res.status(409).json({ success: false, message: item.blockReason === 'WAITING' ? 'งานนี้อยู่ระหว่างรอตรวจ' : 'บทนี้ผ่านการประเมินแล้ว' });
    }
    await conn.beginTransaction();
    const nextVersion = item.latest ? item.latest.Version_No + 1 : 1;

    const [r] = await conn.query(
      `INSERT INTO Submission (Trainee_ID, Assignment_ID, Version_No, Status)
       VALUES (?, ?, ?, 'Submitted')`,
      [realTraineeId, assignmentId, nextVersion]
    );

    const submissionId = r.insertId;

    for (const f of files) {
      let fUrl = String(f.url || f.name || f).trim();
      let fName = f.name ? String(f.name).slice(0, 255) : fUrl;
      if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(fUrl)) {
        fUrl = 'https://' + fUrl;
      }
      const fType = f.type || (/\.(zip|rar|tar)$/i.test(fUrl) ? 'zip' : /\.(pdf)$/i.test(fUrl) ? 'pdf' : /^https?:\/\//i.test(fUrl) ? 'URL' : 'Document');
      await conn.query(
        `INSERT INTO SubmissionFile (Submission_ID, File_Name, File_Type, File_URL)
         VALUES (?, ?, ?, ?)`,
        [submissionId, fName, fType, fUrl]
      );
    }

    if (notes && String(notes).trim()) {
      await conn.query(
        `INSERT INTO SubmissionFile (Submission_ID, File_Name, File_Type, File_URL)
         VALUES (?, ?, 'Note', ?)`,
        [submissionId, 'ข้อความเพิ่มเติมจากผู้ส่ง', String(notes).trim()]
      );
    }

    await conn.query("UPDATE RoadmapItem SET Status = 'In_Progress' WHERE Item_ID = ?", [item.Item_ID]);
    await conn.query(
      "UPDATE TrainingRoadmap SET Status = 'In_Progress' WHERE Roadmap_ID = ? AND Status = 'Not_Started'",
      [roadmap.Roadmap_ID]
    );
    await conn.commit();

    console.log(`✅ [Submit Success] Trainee "${traineeName}" (ID: ${realTraineeId}) submitted Assignment ${assignmentId} v${nextVersion}`);

    res.json({
      success: true,
      message: `ส่งงานในชื่อ "${traineeName}" เรียบร้อยแล้ว (ครั้งที่ ${nextVersion}) ส่งไปยัง Trainer & BA ให้ตรวจเรียบร้อย`
    });
  } catch (err) {
    try { await conn.rollback(); } catch { /* ignore */ }
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

// ผลประเมินและ Feedback ทั้งหมดของ Trainee
router.get('/evaluations/:traineeId', async (req, res) => {
  try {
    let realTraineeId = Number(req.params.traineeId);
    const [tr] = await db.query('SELECT Trainee_ID FROM Trainee WHERE Trainee_ID = ?', [realTraineeId]);
    if (!tr.length) {
      const [byUser] = await db.query('SELECT Trainee_ID FROM Trainee WHERE User_ID = ?', [realTraineeId]);
      if (byUser.length) realTraineeId = byUser[0].Trainee_ID;
    }

    const [rows] = await db.query(
      `SELECT s.Submission_ID, a.Assignment_ID, a.Title, a.Category, s.Version_No, s.Submitted_At,
              s.Status AS Submission_Status,
              e.Evaluation_ID, e.Development_Score, e.BusinessLogic_Score, e.Communication_Score,
              e.Status, f.Feedback_Note, f.Created_At AS Feedback_At, tr.Name AS Trainer_Name
       FROM Submission s
       JOIN Assignment a ON a.Assignment_ID = s.Assignment_ID
       LEFT JOIN Evaluation e ON e.Submission_ID = s.Submission_ID
       LEFT JOIN Feedback f ON f.Evaluation_ID = e.Evaluation_ID
       LEFT JOIN TrainerBA tr ON tr.Trainer_ID = e.Trainer_ID
       WHERE s.Trainee_ID = ?
       ORDER BY s.Submitted_At DESC, s.Submission_ID DESC`,
      [realTraineeId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message, message: err.message });
  }
});

module.exports = router;