-- ========================================================
-- ระบบบริหารจัดการการฝึกอบรม (Training Management System)
-- MySQL 8.0.16 ขึ้นไป (ต้องใช้ CHECK constraint)
-- 13 ตาราง ตรงกับ ER / 5.2 Database Design / Data Dictionary
-- สคริปต์นี้รันซ้ำได้ (ลบตารางเดิมแล้วสร้างใหม่)
-- ========================================================

CREATE DATABASE IF NOT EXISTS training_management_db
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE training_management_db;

-- --------------------------------------------------------
-- ลบตารางเดิม (ลบตารางลูกก่อนตารางแม่)
-- --------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS SubmissionFile;
DROP TABLE IF EXISTS RoadmapItem;
DROP TABLE IF EXISTS ProbationReport;
DROP TABLE IF EXISTS Feedback;
DROP TABLE IF EXISTS Evaluation;
DROP TABLE IF EXISTS Submission;
DROP TABLE IF EXISTS Assignment;
DROP TABLE IF EXISTS LearningMaterial;
DROP TABLE IF EXISTS TrainingRoadmap;
DROP TABLE IF EXISTS HR;
DROP TABLE IF EXISTS TrainerBA;
DROP TABLE IF EXISTS Trainee;
DROP TABLE IF EXISTS User;

SET FOREIGN_KEY_CHECKS = 1;

-- ========================================================
-- สร้างตาราง (เรียงตามลำดับการอ้างอิง FK)
-- เลขตารางตรงกับ Data Dictionary
-- ========================================================

-- --------------------------------------------------------
-- ตารางที่ 1: User (บัญชีผู้ใช้งานส่วนกลาง - Supertype)
-- Username = รหัสพนักงาน: TN### = Trainee, TR### = Trainer/BA, HR### = HR (BR-5)
-- --------------------------------------------------------
CREATE TABLE User (
    User_ID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(10) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    CONSTRAINT chk_user_username
        CHECK (Username REGEXP '^(TN|TR|HR)[0-9]{3}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- ตารางที่ 2: Trainee (พนักงานใหม่ / ผู้รับการฝึกอบรม)
-- --------------------------------------------------------
CREATE TABLE Trainee (
    Trainee_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT NOT NULL UNIQUE,
    Name VARCHAR(100) NOT NULL,
    Position VARCHAR(50) NULL,
    Start_Date DATE NOT NULL,
    Skill_Level VARCHAR(20) NULL,
    CONSTRAINT fk_trainee_user FOREIGN KEY (User_ID)
        REFERENCES User(User_ID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- ตารางที่ 3: TrainerBA (ผู้ฝึกสอน / พี่เลี้ยง / BA)
-- --------------------------------------------------------
CREATE TABLE TrainerBA (
    Trainer_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT NOT NULL UNIQUE,
    Name VARCHAR(100) NOT NULL,
    Position VARCHAR(50) NULL,
    Department VARCHAR(50) NULL,
    CONSTRAINT fk_trainerba_user FOREIGN KEY (User_ID)
        REFERENCES User(User_ID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- ตารางที่ 4: HR (เจ้าหน้าที่ฝ่ายทรัพยากรบุคคล)
-- --------------------------------------------------------
CREATE TABLE HR (
    Hr_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT NOT NULL UNIQUE,
    Name VARCHAR(100) NOT NULL,
    Position VARCHAR(50) NULL,
    Department VARCHAR(50) NULL,
    CONSTRAINT fk_hr_user FOREIGN KEY (User_ID)
        REFERENCES User(User_ID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- ตารางที่ 6: LearningMaterial (สื่อการเรียนรู้)
-- Material_URL = ลิงก์วิดีโอ หรือที่อยู่ไฟล์เอกสาร
-- --------------------------------------------------------
CREATE TABLE LearningMaterial (
    Material_ID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(100) NOT NULL,
    Type VARCHAR(50) NOT NULL,
    Description TEXT NULL,
    Material_URL VARCHAR(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- ตารางที่ 7: Assignment (คลังโจทย์ / แบบฝึกหัด)
-- ห้ามลบสื่อที่ยังมีโจทย์อ้างอิงอยู่ (RESTRICT)
-- --------------------------------------------------------
CREATE TABLE Assignment (
    Assignment_ID INT AUTO_INCREMENT PRIMARY KEY,
    Material_ID INT NOT NULL,
    Title VARCHAR(100) NOT NULL,
    Description TEXT NULL,
    Category VARCHAR(30) NOT NULL,
    Difficulty_Level VARCHAR(20) NOT NULL,
    Deadline DATETIME NOT NULL,
    CONSTRAINT chk_assignment_category
        CHECK (Category IN ('Development', 'Business_Logic')),
    CONSTRAINT fk_assignment_material FOREIGN KEY (Material_ID)
        REFERENCES LearningMaterial(Material_ID) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- ตารางที่ 5: TrainingRoadmap (แผนการเรียนรู้ของ Trainee แต่ละคน)
-- ห้ามลบ Trainer ที่ยังมีแผนอยู่ (RESTRICT)
-- --------------------------------------------------------
CREATE TABLE TrainingRoadmap (
    Roadmap_ID INT AUTO_INCREMENT PRIMARY KEY,
    Trainee_ID INT NOT NULL,
    Trainer_ID INT NOT NULL,
    Title VARCHAR(100) NOT NULL,
    Description TEXT NULL,
    Start_Date DATE NOT NULL,
    End_Date DATE NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'Not_Started',
    CONSTRAINT chk_roadmap_status
        CHECK (Status IN ('Not_Started', 'In_Progress', 'Completed')),
    CONSTRAINT chk_roadmap_dates
        CHECK (End_Date >= Start_Date),
    CONSTRAINT fk_roadmap_trainee FOREIGN KEY (Trainee_ID)
        REFERENCES Trainee(Trainee_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_roadmap_trainer FOREIGN KEY (Trainer_ID)
        REFERENCES TrainerBA(Trainer_ID) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- ตารางที่ 12: RoadmapItem (สถานะการเรียนรายบท / ปลดล็อกบทถัดไป)
-- กฎ: Seq_No = 1 เข้าได้เสมอ, บทอื่นเข้าได้เมื่อบทก่อนหน้า Status = 'Completed'
-- --------------------------------------------------------
CREATE TABLE RoadmapItem (
    Item_ID INT AUTO_INCREMENT PRIMARY KEY,
    Roadmap_ID INT NOT NULL,
    Assignment_ID INT NOT NULL,
    Seq_No INT NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'Not_Started',
    CONSTRAINT uq_item_seq UNIQUE (Roadmap_ID, Seq_No),
    CONSTRAINT uq_item_assignment UNIQUE (Roadmap_ID, Assignment_ID),
    CONSTRAINT chk_item_seq CHECK (Seq_No >= 1),
    CONSTRAINT chk_item_status
        CHECK (Status IN ('Not_Started', 'In_Progress', 'Completed')),
    CONSTRAINT fk_item_roadmap FOREIGN KEY (Roadmap_ID)
        REFERENCES TrainingRoadmap(Roadmap_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_item_assignment FOREIGN KEY (Assignment_ID)
        REFERENCES Assignment(Assignment_ID) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- ตารางที่ 8: Submission (การส่งงานแต่ละครั้ง / แต่ละ Version)
-- ส่งแก้ไขใหม่ (Resubmit) = เพิ่มแถวใหม่ Version_No + 1
-- --------------------------------------------------------
CREATE TABLE Submission (
    Submission_ID INT AUTO_INCREMENT PRIMARY KEY,
    Trainee_ID INT NOT NULL,
    Assignment_ID INT NOT NULL,
    Version_No INT NOT NULL DEFAULT 1,
    Submitted_At DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Status VARCHAR(20) NOT NULL DEFAULT 'Submitted',
    CONSTRAINT uq_submission_version UNIQUE (Trainee_ID, Assignment_ID, Version_No),
    CONSTRAINT chk_submission_version CHECK (Version_No >= 1),
    CONSTRAINT chk_submission_status
        CHECK (Status IN ('Submitted', 'Graded')),
    CONSTRAINT fk_submission_trainee FOREIGN KEY (Trainee_ID)
        REFERENCES Trainee(Trainee_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_submission_assignment FOREIGN KEY (Assignment_ID)
        REFERENCES Assignment(Assignment_ID) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- ตารางที่ 13: SubmissionFile (ไฟล์หรือลิงก์แต่ละชิ้นที่แนบในการส่งครั้งนั้น)
-- File_Type = นามสกุลไฟล์ หรือ 'URL' เมื่อเป็นลิงก์
-- --------------------------------------------------------
CREATE TABLE SubmissionFile (
    File_ID INT AUTO_INCREMENT PRIMARY KEY,
    Submission_ID INT NOT NULL,
    File_Name VARCHAR(255) NULL,
    File_Type VARCHAR(50) NOT NULL,
    File_Size INT NULL,
    File_URL VARCHAR(500) NOT NULL,
    CONSTRAINT fk_file_submission FOREIGN KEY (Submission_ID)
        REFERENCES Submission(Submission_ID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- ตารางที่ 9: Evaluation (ผลตรวจตามเกณฑ์ Rubric 3 ด้าน ระดับ 1-4)
-- 1 การส่งงาน ถูกประเมินได้ 1 ครั้ง (Submission_ID UNIQUE)
-- --------------------------------------------------------
CREATE TABLE Evaluation (
    Evaluation_ID INT AUTO_INCREMENT PRIMARY KEY,
    Submission_ID INT NOT NULL UNIQUE,
    Trainer_ID INT NOT NULL,
    Development_Score TINYINT NOT NULL,
    BusinessLogic_Score TINYINT NOT NULL,
    Communication_Score TINYINT NOT NULL,
    Status VARCHAR(20) NOT NULL,
    CONSTRAINT chk_eval_dev CHECK (Development_Score BETWEEN 1 AND 4),
    CONSTRAINT chk_eval_biz CHECK (BusinessLogic_Score BETWEEN 1 AND 4),
    CONSTRAINT chk_eval_comm CHECK (Communication_Score BETWEEN 1 AND 4),
    CONSTRAINT chk_eval_status
        CHECK (Status IN ('Passed', 'Need_Revision')),
    CONSTRAINT fk_eval_submission FOREIGN KEY (Submission_ID)
        REFERENCES Submission(Submission_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_eval_trainer FOREIGN KEY (Trainer_ID)
        REFERENCES TrainerBA(Trainer_ID) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- ตารางที่ 10: Feedback (ข้อเสนอแนะจาก Trainer/BA)
-- --------------------------------------------------------
CREATE TABLE Feedback (
    Feedback_ID INT AUTO_INCREMENT PRIMARY KEY,
    Evaluation_ID INT NOT NULL,
    Feedback_Note TEXT NOT NULL,
    Created_At DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_feedback_evaluation FOREIGN KEY (Evaluation_ID)
        REFERENCES Evaluation(Evaluation_ID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- ตารางที่ 11: ProbationReport (รายงานสรุปผลการทดลองงานสำหรับ HR)
-- ห้ามลบ HR ที่เคยอนุมัติรายงานแล้ว (RESTRICT)
-- --------------------------------------------------------
CREATE TABLE ProbationReport (
    Report_ID INT AUTO_INCREMENT PRIMARY KEY,
    Trainee_ID INT NOT NULL,
    Hr_ID INT NOT NULL,
    Status VARCHAR(20) NOT NULL,
    Remark TEXT NULL,
    CONSTRAINT chk_report_status
        CHECK (Status IN ('Passed', 'Failed', 'Extended')),
    CONSTRAINT fk_report_trainee FOREIGN KEY (Trainee_ID)
        REFERENCES Trainee(Trainee_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_report_hr FOREIGN KEY (Hr_ID)
        REFERENCES HR(Hr_ID) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- INSERT DATA (ข้อมูลทดสอบ)
-- Trainee 5 คน, Trainer/BA 2 คน, HR 1 คน
-- ========================================================

-- --------------------------------------------------------
-- 1. User (User_ID 1-5 = Trainee, 6-7 = Trainer/BA, 8 = HR)
-- รหัสผ่านด้านล่างเป็น plain text เพื่อทดสอบเท่านั้น
-- ตามข้อกำหนดต้องเก็บเป็น hash (bcrypt/Argon2) ให้ backend hash ก่อนใช้งานจริง
-- --------------------------------------------------------
INSERT INTO User (Username, Password) VALUES
('TN001', 'pass1234'),
('TN002', 'pass1234'),
('TN003', 'pass1234'),
('TN004', 'pass1234'),
('TN005', 'pass1234'),
('TR001', 'train123'),
('TR002', 'train123'),
('HR001', 'hrpass12');

-- --------------------------------------------------------
-- 2. Trainee (Trainee_ID 1-5)
-- --------------------------------------------------------
INSERT INTO Trainee (User_ID, Name, Position, Start_Date, Skill_Level) VALUES
(1, 'สมชาย สายโค้ด',       'Software Developer', '2026-09-01', 'Beginner'),
(2, 'วิภาวี มีทักษะ',      'Software Developer', '2026-09-01', 'Intermediate'),
(3, 'ณัฐพล ระบบดี',       'Software Developer', '2026-09-15', 'Beginner'),
(4, 'กานดา พัฒนาไว',      'Software Developer', '2026-09-15', 'Intermediate'),
(5, 'ธนกฤต คิดวิเคราะห์', 'Software Developer', '2026-10-01', 'Beginner');

-- --------------------------------------------------------
-- 3. TrainerBA (Trainer_ID 1-2)
-- --------------------------------------------------------
INSERT INTO TrainerBA (User_ID, Name, Position, Department) VALUES
(6, 'วิชัย สอนดี',         'Senior Software Developer', 'IT Development'),
(7, 'ปรียา วิเคราะห์ธุรกิจ', 'Business Analyst',          'Business Analysis');

-- --------------------------------------------------------
-- 4. HR (Hr_ID 1)
-- --------------------------------------------------------
INSERT INTO HR (User_ID, Name, Position, Department) VALUES
(8, 'นภา ดูแลคน', 'HR Specialist', 'Human Resources');

-- --------------------------------------------------------
-- 6. LearningMaterial (Material_ID 1-4)
-- --------------------------------------------------------
INSERT INTO LearningMaterial (Title, Type, Description, Material_URL) VALUES
('Business Logic & Flowchart Basics', 'Video',
 'วิดีโอสอนโครงสร้าง Business Logic และกระบวนการเขียน Flowchart',
 'https://storage.company.com/materials/business-logic-flowchart.mp4'),
('API Design & Backend Integration', 'Document',
 'เอกสารคู่มือการออกแบบ RESTful API และการเชื่อมต่อฐานข้อมูล',
 'https://storage.company.com/materials/api-design-guide.pdf'),
('SQL & Database Design Fundamentals', 'Video',
 'วิดีโอสอนการออกแบบฐานข้อมูลและการเขียน SQL เบื้องต้น',
 'https://storage.company.com/materials/sql-database-design.mp4'),
('Order-to-Cash Business Flow', 'Document',
 'เอกสารอธิบายกระบวนการธุรกิจตั้งแต่รับคำสั่งซื้อจนถึงรับชำระเงิน',
 'https://storage.company.com/materials/order-to-cash-flow.pdf');

-- --------------------------------------------------------
-- 7. Assignment (Assignment_ID 1-4)
-- --------------------------------------------------------
INSERT INTO Assignment (Material_ID, Title, Description, Category, Difficulty_Level, Deadline) VALUES
(1, 'ออกแบบ Flowchart ระบบชำระเงิน',
    'ให้ออกแบบ Diagram สรุป Process Flowchart ระบบชำระเงิน',
    'Business_Logic', 'Beginner', '2026-10-15 17:00:00'),
(2, 'พัฒนา RESTful API สำหรับระบบสมาชิก',
    'ให้พัฒนา API ด้วย Node.js หรือ Java ตามข้อกำหนดที่ระบุ',
    'Development', 'Intermediate', '2026-10-30 17:00:00'),
(3, 'ออกแบบฐานข้อมูลและเขียน SQL เบื้องต้น',
    'ให้ออกแบบ ER Diagram และเขียน SQL สร้างตารางตามโจทย์ระบบห้องสมุด',
    'Development', 'Beginner', '2026-10-22 17:00:00'),
(4, 'วิเคราะห์ Business Flow ระบบสั่งซื้อ (Order-to-Cash)',
    'ให้วิเคราะห์และเขียน Flow ของกระบวนการสั่งซื้อจนถึงรับชำระเงิน',
    'Business_Logic', 'Intermediate', '2026-10-30 17:00:00');

-- --------------------------------------------------------
-- 5. TrainingRoadmap (Roadmap_ID 1-5 = Trainee 1-5)
-- --------------------------------------------------------
INSERT INTO TrainingRoadmap (Trainee_ID, Trainer_ID, Title, Description, Start_Date, End_Date, Status) VALUES
(1, 1, 'Onboarding Dev - Batch 1', 'แผนฝึกอบรม 2 เดือนสำหรับพนักงานใหม่กลุ่มที่ 1', '2026-09-01', '2026-10-31', 'In_Progress'),
(2, 1, 'Onboarding Dev - Batch 1', 'แผนฝึกอบรม 2 เดือนสำหรับพนักงานใหม่กลุ่มที่ 1', '2026-09-01', '2026-10-31', 'Completed'),
(3, 2, 'Onboarding Dev - Batch 2', 'แผนฝึกอบรม 2 เดือนสำหรับพนักงานใหม่กลุ่มที่ 2', '2026-09-15', '2026-11-15', 'In_Progress'),
(4, 2, 'Onboarding Dev - Batch 2', 'แผนฝึกอบรม 2 เดือนสำหรับพนักงานใหม่กลุ่มที่ 2', '2026-09-15', '2026-11-15', 'In_Progress'),
(5, 1, 'Onboarding Dev - Batch 3', 'แผนฝึกอบรม 2 เดือนสำหรับพนักงานใหม่กลุ่มที่ 3', '2026-10-01', '2026-11-30', 'In_Progress');

-- --------------------------------------------------------
-- 12. RoadmapItem (Roadmap_ID, Assignment_ID, Seq_No, Status)
-- Beginner  : เรียงโจทย์ 1 -> 3 -> 2 -> 4
-- Intermediate : เรียงโจทย์ 2 -> 4 -> 1 -> 3
-- --------------------------------------------------------
INSERT INTO RoadmapItem (Roadmap_ID, Assignment_ID, Seq_No, Status) VALUES
-- Roadmap 1 (Trainee 1): ผ่าน 2 บท, บทที่ 3 ส่งแล้วรอตรวจ
(1, 1, 1, 'Completed'),
(1, 3, 2, 'Completed'),
(1, 2, 3, 'In_Progress'),
(1, 4, 4, 'Not_Started'),
-- Roadmap 2 (Trainee 2): ผ่านครบทุกบท
(2, 2, 1, 'Completed'),
(2, 4, 2, 'Completed'),
(2, 1, 3, 'Completed'),
(2, 3, 4, 'Completed'),
-- Roadmap 3 (Trainee 3): บทแรกไม่ผ่าน ส่งแก้ไขแล้วรอตรวจ
(3, 1, 1, 'In_Progress'),
(3, 3, 2, 'Not_Started'),
(3, 2, 3, 'Not_Started'),
(3, 4, 4, 'Not_Started'),
-- Roadmap 4 (Trainee 4): ผ่านบทแรก กำลังเรียนบทที่ 2 (ยังไม่ส่งงาน)
(4, 2, 1, 'Completed'),
(4, 4, 2, 'In_Progress'),
(4, 1, 3, 'Not_Started'),
(4, 3, 4, 'Not_Started'),
-- Roadmap 5 (Trainee 5): ส่งงานบทแรกแล้วรอตรวจ
(5, 1, 1, 'In_Progress'),
(5, 3, 2, 'Not_Started'),
(5, 2, 3, 'Not_Started'),
(5, 4, 4, 'Not_Started');

-- --------------------------------------------------------
-- 8. Submission (Submission_ID 1-11)
-- --------------------------------------------------------
INSERT INTO Submission (Trainee_ID, Assignment_ID, Version_No, Submitted_At, Status) VALUES
(1, 1, 1, '2026-09-08 10:30:00', 'Graded'),     -- 1
(1, 3, 1, '2026-09-18 14:00:00', 'Graded'),     -- 2
(1, 2, 1, '2026-10-09 16:20:00', 'Submitted'),  -- 3 รอตรวจ
(2, 2, 1, '2026-09-10 11:00:00', 'Graded'),     -- 4
(2, 4, 1, '2026-09-24 09:45:00', 'Graded'),     -- 5
(2, 1, 1, '2026-10-05 13:10:00', 'Graded'),     -- 6
(2, 3, 1, '2026-10-10 15:30:00', 'Graded'),     -- 7
(3, 1, 1, '2026-09-25 10:00:00', 'Graded'),     -- 8 ไม่ผ่าน
(3, 1, 2, '2026-10-02 15:00:00', 'Submitted'),  -- 9 ส่งแก้ไขใหม่ (Version 2) รอตรวจ
(4, 2, 1, '2026-09-30 17:20:00', 'Graded'),     -- 10
(5, 1, 1, '2026-10-08 10:15:00', 'Submitted');  -- 11 รอตรวจ

-- --------------------------------------------------------
-- 13. SubmissionFile (File_Name, File_Type, File_Size, File_URL)
-- --------------------------------------------------------
INSERT INTO SubmissionFile (Submission_ID, File_Name, File_Type, File_Size, File_URL) VALUES
(1,  'trainee1_flowchart.pdf',            'pdf', 245760,  'https://storage.company.com/submissions/1/trainee1_flowchart.pdf'),
(2,  'trainee1_er_diagram.pdf',           'pdf', 312400,  'https://storage.company.com/submissions/2/trainee1_er_diagram.pdf'),
(2,  'trainee1_schema.sql',               'sql', 8190,    'https://storage.company.com/submissions/2/trainee1_schema.sql'),
(3,  NULL,                                'URL', NULL,    'https://github.com/company-trainee/trainee1-member-api'),
(3,  'trainee1_api_source.zip',           'zip', 1843200, 'https://storage.company.com/submissions/3/trainee1_api_source.zip'),
(4,  'trainee2_member_api.zip',           'zip', 2097152, 'https://storage.company.com/submissions/4/trainee2_member_api.zip'),
(4,  NULL,                                'URL', NULL,    'https://github.com/company-trainee/trainee2-member-api'),
(5,  'trainee2_order_flow.pdf',           'pdf', 398336,  'https://storage.company.com/submissions/5/trainee2_order_flow.pdf'),
(6,  'trainee2_payment_flowchart.pdf',    'pdf', 271360,  'https://storage.company.com/submissions/6/trainee2_payment_flowchart.pdf'),
(7,  'trainee2_database.zip',             'zip', 512000,  'https://storage.company.com/submissions/7/trainee2_database.zip'),
(8,  'trainee3_payment_flowchart_v1.pdf', 'pdf', 198656,  'https://storage.company.com/submissions/8/trainee3_payment_flowchart_v1.pdf'),
(9,  'trainee3_payment_flowchart_v2.pdf', 'pdf', 224256,  'https://storage.company.com/submissions/9/trainee3_payment_flowchart_v2.pdf'),
(9,  'trainee3_fix_notes.pdf',            'pdf', 51200,   'https://storage.company.com/submissions/9/trainee3_fix_notes.pdf'),
(10, NULL,                                'URL', NULL,    'https://github.com/company-trainee/trainee4-api-project'),
(10, 'trainee4_api_source.zip',           'zip', 1572864, 'https://storage.company.com/submissions/10/trainee4_api_source.zip'),
(11, 'trainee5_payment_flowchart.pdf',    'pdf', 233472,  'https://storage.company.com/submissions/11/trainee5_payment_flowchart.pdf');

-- --------------------------------------------------------
-- 9. Evaluation (Evaluation_ID 1-8) คะแนน Rubric ระดับ 1-4
-- (Submission_ID, Trainer_ID, Dev, BusinessLogic, Communication, Status)
-- --------------------------------------------------------
INSERT INTO Evaluation (Submission_ID, Trainer_ID, Development_Score, BusinessLogic_Score, Communication_Score, Status) VALUES
(1,  1, 3, 3, 3, 'Passed'),
(2,  1, 3, 2, 3, 'Passed'),
(4,  1, 4, 3, 4, 'Passed'),
(5,  1, 3, 4, 3, 'Passed'),
(6,  1, 4, 3, 4, 'Passed'),
(7,  1, 3, 3, 4, 'Passed'),
(8,  2, 2, 1, 2, 'Need_Revision'),
(10, 2, 3, 2, 3, 'Passed');

-- --------------------------------------------------------
-- 10. Feedback (Evaluation_ID 1-8)
-- --------------------------------------------------------
INSERT INTO Feedback (Evaluation_ID, Feedback_Note) VALUES
(1, 'ออกแบบ Flowchart ได้ชัดเจน ครอบคลุม Business Logic หลัก แต่ควรเพิ่ม Exception Flow'),
(2, 'ออกแบบตารางและความสัมพันธ์ถูกต้อง ควรเพิ่ม Index ให้คอลัมน์ที่ใช้ค้นหาบ่อย'),
(3, 'API ทำงานครบตามข้อกำหนด โครงสร้างโค้ดอ่านง่าย มีการจัดการ Error ที่ดี'),
(4, 'วิเคราะห์ Business Flow ได้ครบถ้วนและถูกต้องทุกขั้นตอน'),
(5, 'Flowchart สมบูรณ์ ครอบคลุมทุกกรณีของการชำระเงิน'),
(6, 'ออกแบบฐานข้อมูลได้ดี SQL ถูกต้อง ควรอธิบายเหตุผลของ Data Type เพิ่มเติม'),
(7, 'Business Logic ยังไม่ครบถ้วน Process การชำระเงินไม่ถูกต้อง รบกวนแก้ไขแล้วส่งใหม่'),
(8, 'API ทำงานได้ถูกต้อง ควรเพิ่มการตรวจสอบข้อมูลนำเข้าและคำอธิบายประกอบโค้ด');

-- --------------------------------------------------------
-- 11. ProbationReport (เฉพาะ Trainee ที่ผ่านครบทุกบทแล้ว)
-- ค่าเฉลี่ย Trainee 2: Dev 3.50 / Business Logic 3.25 / Communication 3.75 (ผ่าน BR-1)
-- --------------------------------------------------------
INSERT INTO ProbationReport (Trainee_ID, Hr_ID, Status, Remark) VALUES
(2, 1, 'Passed', 'ผ่านเกณฑ์การประเมินทักษะทั้ง 3 ด้านช่วงฝึกอบรม 2 เดือนแรก สมควรให้ผ่านการทดลองงาน');

-- ========================================================
-- ตัวอย่าง Query ตรวจสอบ (เอาเครื่องหมาย -- ออกเพื่อใช้งาน)
-- ========================================================

-- ค่าเฉลี่ยรายด้านของแต่ละ Trainee (ใช้ตัดสิน BR-1: ทุกด้านต้อง >= 2.00)
-- SELECT t.Name,
--        ROUND(AVG(e.Development_Score), 2)   AS Avg_Dev,
--        ROUND(AVG(e.BusinessLogic_Score), 2) AS Avg_Business,
--        ROUND(AVG(e.Communication_Score), 2) AS Avg_Comm
-- FROM Evaluation e
-- JOIN Submission s ON s.Submission_ID = e.Submission_ID
-- JOIN Trainee t    ON t.Trainee_ID = s.Trainee_ID
-- GROUP BY t.Trainee_ID, t.Name;

-- บทที่ปลดล็อกแล้วของ Trainee_ID = 1 (Seq 1 หรือบทก่อนหน้า Completed)
-- SELECT ri.Seq_No, a.Title, ri.Status
-- FROM TrainingRoadmap r
-- JOIN RoadmapItem ri ON ri.Roadmap_ID = r.Roadmap_ID
-- JOIN Assignment a   ON a.Assignment_ID = ri.Assignment_ID
-- WHERE r.Trainee_ID = 1
--   AND (ri.Seq_No = 1 OR EXISTS (
--         SELECT 1 FROM RoadmapItem prev
--         WHERE prev.Roadmap_ID = ri.Roadmap_ID
--           AND prev.Seq_No = ri.Seq_No - 1
--           AND prev.Status = 'Completed'))
-- ORDER BY ri.Seq_No;