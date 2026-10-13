const path = require('path');
const fs = require('fs');
require('dotenv').config();

// ตรวจสอบความพร้อมของ MySQL vs SQLite
let mysqlPool = null;
let sqliteDb = null;
let currentDriver = 'sqlite'; // 'mysql' หรือ 'sqlite'

// คำสั่งสร้างตารางและข้อมูลตั้งต้นสำหรับ SQLite
const SQLITE_SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS User (
  User_ID INTEGER PRIMARY KEY AUTOINCREMENT,
  Username TEXT NOT NULL UNIQUE,
  Password TEXT NOT NULL,
  User_Role TEXT NOT NULL CHECK(User_Role IN ('Trainee', 'Trainer', 'HR'))
);

CREATE TABLE IF NOT EXISTS Trainee (
  Trainee_ID INTEGER PRIMARY KEY AUTOINCREMENT,
  User_ID INTEGER NOT NULL UNIQUE,
  Name TEXT NOT NULL,
  Position TEXT,
  Start_Date TEXT NOT NULL,
  Skill_Level TEXT,
  FOREIGN KEY (User_ID) REFERENCES User(User_ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS TrainerBA (
  Trainer_ID INTEGER PRIMARY KEY AUTOINCREMENT,
  User_ID INTEGER NOT NULL UNIQUE,
  Name TEXT NOT NULL,
  Position TEXT,
  Department TEXT,
  FOREIGN KEY (User_ID) REFERENCES User(User_ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS HR (
  Hr_ID INTEGER PRIMARY KEY AUTOINCREMENT,
  User_ID INTEGER NOT NULL UNIQUE,
  Name TEXT NOT NULL,
  Position TEXT,
  Department TEXT,
  FOREIGN KEY (User_ID) REFERENCES User(User_ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS LearningMaterial (
  Material_ID INTEGER PRIMARY KEY AUTOINCREMENT,
  Title TEXT NOT NULL,
  Type TEXT NOT NULL,
  Description TEXT,
  Material_URL TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Assignment (
  Assignment_ID INTEGER PRIMARY KEY AUTOINCREMENT,
  Material_ID INTEGER NOT NULL,
  Title TEXT NOT NULL,
  Description TEXT,
  Category TEXT NOT NULL CHECK(Category IN ('Development', 'Business_Logic')),
  Difficulty_Level TEXT NOT NULL,
  Deadline TEXT NOT NULL,
  FOREIGN KEY (Material_ID) REFERENCES LearningMaterial(Material_ID) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS TrainingRoadmap (
  Roadmap_ID INTEGER PRIMARY KEY AUTOINCREMENT,
  Trainee_ID INTEGER NOT NULL,
  Trainer_ID INTEGER NOT NULL,
  Title TEXT NOT NULL,
  Description TEXT,
  Start_Date TEXT NOT NULL,
  End_Date TEXT NOT NULL,
  Status TEXT NOT NULL DEFAULT 'In_Progress' CHECK(Status IN ('Not_Started', 'In_Progress', 'Completed')),
  FOREIGN KEY (Trainee_ID) REFERENCES Trainee(Trainee_ID) ON DELETE CASCADE,
  FOREIGN KEY (Trainer_ID) REFERENCES TrainerBA(Trainer_ID) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS RoadmapItem (
  Item_ID INTEGER PRIMARY KEY AUTOINCREMENT,
  Roadmap_ID INTEGER NOT NULL,
  Assignment_ID INTEGER NOT NULL,
  Seq_No INTEGER NOT NULL,
  Status TEXT NOT NULL DEFAULT 'Not_Started' CHECK(Status IN ('Not_Started', 'In_Progress', 'Completed')),
  UNIQUE(Roadmap_ID, Seq_No),
  UNIQUE(Roadmap_ID, Assignment_ID),
  FOREIGN KEY (Roadmap_ID) REFERENCES TrainingRoadmap(Roadmap_ID) ON DELETE CASCADE,
  FOREIGN KEY (Assignment_ID) REFERENCES Assignment(Assignment_ID) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Submission (
  Submission_ID INTEGER PRIMARY KEY AUTOINCREMENT,
  Trainee_ID INTEGER NOT NULL,
  Assignment_ID INTEGER NOT NULL,
  Version_No INTEGER NOT NULL DEFAULT 1,
  Submitted_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Status TEXT NOT NULL DEFAULT 'Submitted' CHECK(Status IN ('Submitted', 'Graded')),
  UNIQUE(Trainee_ID, Assignment_ID, Version_No),
  FOREIGN KEY (Trainee_ID) REFERENCES Trainee(Trainee_ID) ON DELETE CASCADE,
  FOREIGN KEY (Assignment_ID) REFERENCES Assignment(Assignment_ID) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS SubmissionFile (
  File_ID INTEGER PRIMARY KEY AUTOINCREMENT,
  Submission_ID INTEGER NOT NULL,
  File_Name TEXT,
  File_Type TEXT NOT NULL,
  File_Size INTEGER,
  File_URL TEXT NOT NULL,
  FOREIGN KEY (Submission_ID) REFERENCES Submission(Submission_ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Evaluation (
  Evaluation_ID INTEGER PRIMARY KEY AUTOINCREMENT,
  Submission_ID INTEGER NOT NULL UNIQUE,
  Trainer_ID INTEGER NOT NULL,
  Development_Score REAL NOT NULL CHECK(Development_Score BETWEEN 1 AND 4),
  BusinessLogic_Score REAL NOT NULL CHECK(BusinessLogic_Score BETWEEN 1 AND 4),
  Communication_Score REAL NOT NULL CHECK(Communication_Score BETWEEN 1 AND 4),
  Status TEXT NOT NULL CHECK(Status IN ('Passed', 'Need_Revision')),
  FOREIGN KEY (Submission_ID) REFERENCES Submission(Submission_ID) ON DELETE CASCADE,
  FOREIGN KEY (Trainer_ID) REFERENCES TrainerBA(Trainer_ID) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Feedback (
  Feedback_ID INTEGER PRIMARY KEY AUTOINCREMENT,
  Evaluation_ID INTEGER NOT NULL,
  Feedback_Note TEXT NOT NULL,
  Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (Evaluation_ID) REFERENCES Evaluation(Evaluation_ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ProbationReport (
  Report_ID INTEGER PRIMARY KEY AUTOINCREMENT,
  Trainee_ID INTEGER NOT NULL,
  Hr_ID INTEGER NOT NULL,
  Status TEXT NOT NULL CHECK(Status IN ('Passed', 'Failed', 'Extended')),
  Remark TEXT,
  Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (Trainee_ID) REFERENCES Trainee(Trainee_ID) ON DELETE CASCADE,
  FOREIGN KEY (Hr_ID) REFERENCES HR(Hr_ID) ON DELETE RESTRICT
);
`;

const SQLITE_SEEDS = `
-- 1. Users (Trainee TN001-005, Trainer TR001-002, HR HR001)
INSERT INTO User (User_ID, Username, Password, User_Role) VALUES
(1, 'TN001', 'pass1234', 'Trainee'),
(2, 'TN002', 'pass1234', 'Trainee'),
(3, 'TN003', 'pass1234', 'Trainee'),
(4, 'TN004', 'pass1234', 'Trainee'),
(5, 'TN005', 'pass1234', 'Trainee'),
(6, 'TR001', 'train123', 'Trainer'),
(7, 'TR002', 'train123', 'Trainer'),
(8, 'HR001', 'hrpass12', 'HR');

-- 2. Trainee
INSERT INTO Trainee (Trainee_ID, User_ID, Name, Position, Start_Date, Skill_Level) VALUES
(1, 1, 'สมชาย สายโค้ด',       'Software Developer', '2026-09-01', 'Beginner'),
(2, 2, 'วิภาวี มีทักษะ',      'Software Developer', '2026-09-01', 'Intermediate'),
(3, 3, 'ณัฐพล ระบบดี',       'Software Developer', '2026-09-15', 'Beginner'),
(4, 4, 'กานดา พัฒนาไว',      'Software Developer', '2026-09-15', 'Intermediate'),
(5, 5, 'ธนกฤต คิดวิเคราะห์', 'Software Developer', '2026-10-01', 'Beginner');

-- 3. TrainerBA
INSERT INTO TrainerBA (Trainer_ID, User_ID, Name, Position, Department) VALUES
(1, 6, 'วิชัย สอนดี',         'Senior Software Developer', 'IT Development'),
(2, 7, 'ปรียา วิเคราะห์ธุรกิจ', 'Business Analyst',          'Business Analysis');

-- 4. HR
INSERT INTO HR (Hr_ID, User_ID, Name, Position, Department) VALUES
(1, 8, 'นภา ดูแลคน', 'HR Specialist', 'Human Resources');

-- 5. LearningMaterial
INSERT INTO LearningMaterial (Material_ID, Title, Type, Description, Material_URL) VALUES
(1, 'Business Logic & Flowchart Basics', 'Video', 'วิดีโอสอนโครงสร้าง Business Logic และกระบวนการเขียน Flowchart ระบบ', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
(2, 'API Design & Backend Integration', 'Document', 'เอกสารคู่มือการออกแบบ RESTful API และการเชื่อมต่อฐานข้อมูล', 'https://storage.company.com/materials/api-design-guide.pdf'),
(3, 'SQL & Database Design Fundamentals', 'Video', 'วิดีโอสอนการออกแบบฐานข้อมูลและการเขียน SQL เบื้องต้น', 'https://www.youtube.com/watch?v=HXV3zeQKqGY'),
(4, 'Order-to-Cash Business Flow', 'Document', 'เอกสารอธิบายกระบวนการธุรกิจตั้งแต่รับคำสั่งซื้อจนถึงรับชำระเงิน', 'https://storage.company.com/materials/order-to-cash-flow.pdf');

-- 6. Assignment
INSERT INTO Assignment (Assignment_ID, Material_ID, Title, Description, Category, Difficulty_Level, Deadline) VALUES
(1, 1, 'ออกแบบ Flowchart ระบบชำระเงิน', 'ให้ออกแบบ Diagram สรุป Process Flowchart ระบบชำระเงิน', 'Business_Logic', 'Beginner', '2026-10-15 17:00:00'),
(2, 2, 'พัฒนา RESTful API สำหรับระบบสมาชิก', 'ให้พัฒนา API ด้วย Node.js หรือ Java ตามข้อกำหนดที่ระบุ', 'Development', 'Intermediate', '2026-10-30 17:00:00'),
(3, 3, 'ออกแบบฐานข้อมูลและเขียน SQL เบื้องต้น', 'ให้ออกแบบ ER Diagram และเขียน SQL สร้างตารางตามโจทย์ระบบห้องสมุด', 'Development', 'Beginner', '2026-10-22 17:00:00'),
(4, 4, 'วิเคราะห์ Business Flow ระบบสั่งซื้อ (Order-to-Cash)', 'ให้วิเคราะห์และเขียน Flow ของกระบวนการสั่งซื้อจนถึงรับชำระเงิน', 'Business_Logic', 'Intermediate', '2026-10-30 17:00:00');

-- 7. TrainingRoadmap
INSERT INTO TrainingRoadmap (Roadmap_ID, Trainee_ID, Trainer_ID, Title, Description, Start_Date, End_Date, Status) VALUES
(1, 1, 1, 'Onboarding Dev - Batch 1', 'แผนฝึกอบรม 2 เดือนสำหรับพนักงานใหม่กลุ่มที่ 1', '2026-09-01', '2026-10-31', 'In_Progress'),
(2, 2, 1, 'Onboarding Dev - Batch 1', 'แผนฝึกอบรม 2 เดือนสำหรับพนักงานใหม่กลุ่มที่ 1', '2026-09-01', '2026-10-31', 'Completed'),
(3, 3, 2, 'Onboarding Dev - Batch 2', 'แผนฝึกอบรม 2 เดือนสำหรับพนักงานใหม่กลุ่มที่ 2', '2026-09-15', '2026-11-15', 'In_Progress'),
(4, 4, 2, 'Onboarding Dev - Batch 2', 'แผนฝึกอบรม 2 เดือนสำหรับพนักงานใหม่กลุ่มที่ 2', '2026-09-15', '2026-11-15', 'In_Progress'),
(5, 5, 1, 'Onboarding Dev - Batch 3', 'แผนฝึกอบรม 2 เดือนสำหรับพนักงานใหม่กลุ่มที่ 3', '2026-10-01', '2026-11-30', 'In_Progress');

-- 8. RoadmapItem (Seq 1-4 mapped to Assignment 1-4)
INSERT INTO RoadmapItem (Item_ID, Roadmap_ID, Assignment_ID, Seq_No, Status) VALUES
-- Trainee 1 (Somchai สายโค้ด): บทที่ 1 เปิดพร้อมส่งงานสดๆ บทที่ 2-4 รอปลดล็อกตามลำดับ
(1, 1, 1, 1, 'In_Progress'),
(2, 1, 2, 2, 'Not_Started'),
(3, 1, 3, 3, 'Not_Started'),
(4, 1, 4, 4, 'Not_Started'),

-- Trainee 2 (Wiphawee มีทักษะ): เรียนจบครบ 4 บท ผ่านการประเมินทุกบท
(5, 2, 1, 1, 'Completed'),
(6, 2, 2, 2, 'Completed'),
(7, 2, 3, 3, 'Completed'),
(8, 2, 4, 4, 'Completed'),

-- Trainee 3 (Nattapon ระบบดี): ส่งงานบทที่ 1 แล้ว รอตรวจ
(9, 3, 1, 1, 'In_Progress'),
(10, 3, 2, 2, 'Not_Started'),
(11, 3, 3, 3, 'Not_Started'),
(12, 3, 4, 4, 'Not_Started'),

-- Trainee 4 (Kanda พัฒนาไว): ผ่านบทที่ 1 กำลังเรียนบทที่ 2
(13, 4, 1, 1, 'Completed'),
(14, 4, 2, 2, 'In_Progress'),
(15, 4, 3, 3, 'Not_Started'),
(16, 4, 4, 4, 'Not_Started'),

-- Trainee 5 (Thanakrit คิดวิเคราะห์): เริ่มต้นบทที่ 1
(17, 5, 1, 1, 'In_Progress'),
(18, 5, 2, 2, 'Not_Started'),
(19, 5, 3, 3, 'Not_Started'),
(20, 5, 4, 4, 'Not_Started');

-- 9. Submission
-- Trainee 1 (Somchai): ยังไม่มีงานส่ง (พร้อมให้ส่งงานในระบบทันที)
-- Trainee 2 (Wiphawee): ส่งครบ 4 บท Graded ทั้งหมด
INSERT INTO Submission (Submission_ID, Trainee_ID, Assignment_ID, Version_No, Submitted_At, Status) VALUES
(1, 2, 1, 1, '2026-09-08 10:30:00', 'Graded'),
(2, 2, 2, 1, '2026-09-18 14:00:00', 'Graded'),
(3, 2, 3, 1, '2026-09-28 11:00:00', 'Graded'),
(4, 2, 4, 1, '2026-10-08 15:30:00', 'Graded'),
-- Trainee 3 (Nattapon): ส่งงานบทที่ 1 รอตรวจ
(5, 3, 1, 1, '2026-10-09 10:15:00', 'Submitted'),
-- Trainee 4 (Kanda): ส่งงานบทที่ 1 Graded
(6, 4, 1, 1, '2026-09-20 16:00:00', 'Graded');

-- 10. SubmissionFile
INSERT INTO SubmissionFile (File_ID, Submission_ID, File_Name, File_Type, File_Size, File_URL) VALUES
(1, 1, 'trainee2_flowchart.pdf', 'pdf', 245760, 'https://storage.company.com/submissions/trainee2_flowchart.pdf'),
(2, 2, 'trainee2_member_api.zip', 'zip', 2097152, 'https://storage.company.com/submissions/trainee2_member_api.zip'),
(3, 3, 'trainee2_database.sql', 'sql', 512000, 'https://storage.company.com/submissions/trainee2_database.sql'),
(4, 4, 'trainee2_order_flow.pdf', 'pdf', 398336, 'https://storage.company.com/submissions/trainee2_order_flow.pdf'),
(5, 5, 'trainee3_flowchart_payment.pdf', 'pdf', 224256, 'https://storage.company.com/submissions/trainee3_flowchart_payment.pdf'),
(6, 6, 'trainee4_flowchart.pdf', 'pdf', 198656, 'https://storage.company.com/submissions/trainee4_flowchart.pdf');

-- 11. Evaluation
INSERT INTO Evaluation (Evaluation_ID, Submission_ID, Trainer_ID, Development_Score, BusinessLogic_Score, Communication_Score, Status) VALUES
(1, 1, 1, 3.5, 3.0, 3.5, 'Passed'),
(2, 2, 1, 4.0, 3.5, 4.0, 'Passed'),
(3, 3, 1, 3.0, 3.5, 3.5, 'Passed'),
(4, 4, 2, 3.5, 4.0, 4.0, 'Passed'),
(5, 6, 1, 3.0, 3.0, 3.0, 'Passed');

-- 12. Feedback
INSERT INTO Feedback (Feedback_ID, Evaluation_ID, Feedback_Note) VALUES
(1, 1, 'ออกแบบ Flowchart ได้ชัดเจน ครอบคลุม Business Logic หลัก การเชื่อมโยงกระบวนการถูกต้อง'),
(2, 2, 'API ทำงานครบตามข้อกำหนด โครงสร้างโค้ดอ่านง่าย มีการจัดการ Error Handling ที่ดี'),
(3, 3, 'ออกแบบฐานข้อมูลได้ดี SQL ถูกต้องตามหลัก Normalization'),
(4, 4, 'วิเคราะห์ Business Flow ได้ครบถ้วนและถูกต้องทุกขั้นตอนตามที่โจทย์กำหนด'),
(5, 5, 'Flowchart สมบูรณ์ ครอบคลุมทุกกรณีของการชำระเงิน');

-- 13. ProbationReport
INSERT INTO ProbationReport (Report_ID, Trainee_ID, Hr_ID, Status, Remark) VALUES
(1, 2, 1, 'Passed', 'ผ่านเกณฑ์การประเมินทักษะทั้ง 3 ด้านช่วงฝึกอบรม 2 เดือนแรก คะแนนเฉลี่ย 3.63 สมควรให้ผ่านการทดลองงาน');
`;

function initSqlite() {
  if (sqliteDb) return sqliteDb;
  const { DatabaseSync } = require('node:sqlite');
  const dbFile = path.join(__dirname, '../database.sqlite');
  sqliteDb = new DatabaseSync(dbFile);
  sqliteDb.exec(SQLITE_SCHEMA);

  // ตรวจสอบว่ามีข้อมูลใน User หรือยัง ถ้ายังให้รัน seed
  const userCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM User').get();
  if (!userCount || userCount.count === 0) {
    sqliteDb.exec(SQLITE_SEEDS);
    console.log('🌱 [SQLite] ใส่ข้อมูลทดสอบ 13 ตารางเรียบร้อยแล้ว');
  }
  return sqliteDb;
}

// ฟังก์ชันแปลงคำสั่ง SQL ให้ทำงานกับ SQLite ได้อย่างถูกต้อง
function translateSqlForSqlite(sql) {
  let s = sql;
  // แปลงฟังก์ชันเวลา MySQL -> SQLite
  s = s.replace(/CURDATE\(\)/gi, "date('now')");
  s = s.replace(/CURRENT_TIMESTAMP\(\)/gi, "datetime('now')");
  s = s.replace(/FOR UPDATE/gi, ''); // SQLite เป็น file-level lock อยู่แล้ว
  return s;
}

// อะแดปเตอร์สำหรับรันคิวรี SQLite ให้รูปแบบส่งกลับเหมือน mysql2: [rows, fields]
function executeSqliteQuery(sql, params = []) {
  const sdb = initSqlite();
  const cleanSql = translateSqlForSqlite(sql).trim();
  const lower = cleanSql.toLowerCase();

  const flatParams = params.map(p => (p === undefined ? null : p));

  if (lower.startsWith('select') || lower.startsWith('pragma')) {
    const stmt = sdb.prepare(cleanSql);
    const rows = stmt.all(...flatParams);
    return [rows, []];
  } else {
    const stmt = sdb.prepare(cleanSql);
    const result = stmt.run(...flatParams);
    return [
      {
        insertId: Number(result.lastInsertRowid || 0),
        affectedRows: Number(result.changes || 0),
        changedRows: Number(result.changes || 0)
      },
      []
    ];
  }
}

// พยายามเชื่อมต่อ MySQL ถ้าคอนฟิกไว้
async function tryConnectMySQL() {
  if (!process.env.DB_HOST) return false;
  try {
    const mysql = require('mysql2/promise');
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME || 'training_management_db',
      charset: 'utf8mb4',
      dateStrings: true,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      waitForConnections: true,
      connectionLimit: 10,
      connectTimeout: 2000
    });
    await pool.query('SELECT 1');
    mysqlPool = pool;
    currentDriver = 'mysql';
    console.log(`✅ [Database] เชื่อมต่อ MySQL สำเร็จ (${process.env.DB_HOST})`);
    return true;
  } catch (err) {
    console.log(`⚠️ [Database] ไม่สามารถต่อ MySQL (${err.message}) -> เปลี่ยนไปใช้ SQLite อัตโนมัติ`);
    currentDriver = 'sqlite';
    initSqlite();
    return false;
  }
}

// เริ่มต้นฐานข้อมูล
initSqlite();
tryConnectMySQL();

module.exports = {
  getDriver: () => currentDriver,

  query: async function (sql, params = []) {
    if (currentDriver === 'mysql' && mysqlPool) {
      try {
        return await mysqlPool.query(sql, params);
      } catch (err) {
        // หากต่อ MySQL หลุด ให้ fallback เป็น SQLite
        console.error('MySQL query error, fallbacking to SQLite:', err.message);
      }
    }
    return executeSqliteQuery(sql, params);
  },

  getConnection: async function () {
    if (currentDriver === 'mysql' && mysqlPool) {
      try {
        return await mysqlPool.getConnection();
      } catch (err) {
        // fallback
      }
    }
    // Transaction connection mockup สำหรับ SQLite
    const sdb = initSqlite();
    return {
      beginTransaction: async () => { sdb.exec('BEGIN TRANSACTION;'); },
      commit: async () => { sdb.exec('COMMIT;'); },
      rollback: async () => {
        try { sdb.exec('ROLLBACK;'); } catch (e) { /* ignore */ }
      },
      query: async (sql, params = []) => executeSqliteQuery(sql, params),
      release: () => {}
    };
  },

  // รีเซ็ตข้อมูลกลับสู่ค่าเริ่มต้นทั้งหมด
  resetToDefault: function () {
    const sdb = initSqlite();
    sdb.exec(`
      PRAGMA foreign_keys = OFF;
      DROP TABLE IF EXISTS ProbationReport;
      DROP TABLE IF EXISTS Feedback;
      DROP TABLE IF EXISTS Evaluation;
      DROP TABLE IF EXISTS SubmissionFile;
      DROP TABLE IF EXISTS Submission;
      DROP TABLE IF EXISTS RoadmapItem;
      DROP TABLE IF EXISTS TrainingRoadmap;
      DROP TABLE IF EXISTS Assignment;
      DROP TABLE IF EXISTS LearningMaterial;
      DROP TABLE IF EXISTS HR;
      DROP TABLE IF EXISTS TrainerBA;
      DROP TABLE IF EXISTS Trainee;
      DROP TABLE IF EXISTS User;
      PRAGMA foreign_keys = ON;
    `);
    sdb.exec(SQLITE_SCHEMA);
    sdb.exec(SQLITE_SEEDS);
    return true;
  },

  // รายการตารางทั้งหมดสำหรับ Database Inspector
  getAllTableNames: () => [
    'User',
    'Trainee',
    'TrainerBA',
    'HR',
    'LearningMaterial',
    'Assignment',
    'TrainingRoadmap',
    'RoadmapItem',
    'Submission',
    'SubmissionFile',
    'Evaluation',
    'Feedback',
    'ProbationReport'
  ]
};