const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ดึงรายชื่อ 13 ตารางและจำนวนแถว
router.get('/tables', async (req, res) => {
  try {
    const tableNames = db.getAllTableNames();
    const result = [];
    for (const name of tableNames) {
      const [rows] = await db.query(`SELECT COUNT(*) as count FROM ${name}`);
      result.push({
        name,
        count: rows[0]?.count || 0
      });
    }
    res.json({
      success: true,
      driver: db.getDriver(),
      tables: result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ดึงข้อมูลในตารางที่เลือก
router.get('/table/:tableName', async (req, res) => {
  const { tableName } = req.params;
  const validTables = db.getAllTableNames();
  if (!validTables.includes(tableName)) {
    return res.status(400).json({ success: false, message: 'Invalid table name' });
  }

  try {
    const [rows] = await db.query(`SELECT * FROM ${tableName} LIMIT 100`);
    res.json({
      success: true,
      tableName,
      rowCount: rows.length,
      rows
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// รันคำสั่ง SQL สด (SELECT, INSERT, UPDATE, DELETE)
router.post('/query', async (req, res) => {
  const { sql } = req.body;
  if (!sql || !sql.trim()) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกคำสั่ง SQL' });
  }

  const cleanSql = sql.trim();
  const lower = cleanSql.toLowerCase();
  const isSelect = lower.startsWith('select') || lower.startsWith('pragma') || lower.startsWith('show');

  try {
    const [result] = await db.query(cleanSql);
    if (isSelect) {
      res.json({
        success: true,
        isSelect: true,
        rowCount: Array.isArray(result) ? result.length : 0,
        rows: Array.isArray(result) ? result : []
      });
    } else {
      res.json({
        success: true,
        isSelect: false,
        affectedRows: result?.affectedRows || 0,
        message: `รันคำสั่งสำเร็จ (ได้รับผลกระทบ ${result?.affectedRows || 0} แถว)`
      });
    }
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// รีเซ็ตข้อมูลกลับค่าเริ่มต้น 13 ตาราง
router.post('/reset', async (req, res) => {
  try {
    db.resetToDefault();
    res.json({
      success: true,
      message: 'รีเซ็ตข้อมูลทั้ง 13 ตารางกลับสู่ค่าเริ่มต้นเรียบร้อยแล้ว'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
