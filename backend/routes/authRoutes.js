const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [users] = await db.query(
      'SELECT User_ID, Username, User_Role FROM User WHERE Username = ? AND Password = ?',
      [username, password]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const user = users[0];

    const [trainees] = await db.query('SELECT Trainee_ID AS profileId, Name, Position FROM Trainee WHERE User_ID = ?', [user.User_ID]);
    const [trainers] = await db.query('SELECT Trainer_ID AS profileId, Name, Position, Department FROM TrainerBA WHERE User_ID = ?', [user.User_ID]);
    const [hrs] = await db.query('SELECT Hr_ID AS profileId, Name, Position, Department FROM HR WHERE User_ID = ?', [user.User_ID]);

    let role = user.User_Role || 'Unknown';
    let fullName = user.Username;
    let profileId = null;
    let position = '';

    if (trainees.length > 0) {
      role = 'Trainee';
      fullName = trainees[0].Name;
      profileId = trainees[0].profileId;
      position = trainees[0].Position;
    } else if (trainers.length > 0) {
      role = 'Trainer';
      fullName = trainers[0].Name;
      profileId = trainers[0].profileId;
      position = trainers[0].Position;
    } else if (hrs.length > 0) {
      role = 'HR';
      fullName = hrs[0].Name;
      profileId = hrs[0].profileId;
      position = hrs[0].Position;
    }

    return res.json({
      success: true,
      token: 'jwt-session-token-' + user.User_ID,
      user: {
        userId: user.User_ID,
        username: user.Username,
        fullName,
        role,
        profileId,
        position
      }
    });

  } catch (err) {
    console.error('❌ [Auth Error]:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// บัญชีตัวอย่างสำหรับ 1-Click Login และ Role Switcher
router.get('/demo-users', async (req, res) => {
  try {
    const [trainees] = await db.query(`
      SELECT u.User_ID, u.Username, u.Password, 'Trainee' as Role, t.Trainee_ID as profileId, t.Name as fullName, t.Position
      FROM User u JOIN Trainee t ON u.User_ID = t.User_ID ORDER BY t.Trainee_ID LIMIT 3
    `);
    const [trainers] = await db.query(`
      SELECT u.User_ID, u.Username, u.Password, 'Trainer' as Role, tr.Trainer_ID as profileId, tr.Name as fullName, tr.Position
      FROM User u JOIN TrainerBA tr ON u.User_ID = tr.User_ID ORDER BY tr.Trainer_ID LIMIT 2
    `);
    const [hrs] = await db.query(`
      SELECT u.User_ID, u.Username, u.Password, 'HR' as Role, h.Hr_ID as profileId, h.Name as fullName, h.Position
      FROM User u JOIN HR h ON u.User_ID = h.User_ID ORDER BY h.Hr_ID LIMIT 1
    `);

    res.json({
      success: true,
      users: [...trainees, ...trainers, ...hrs]
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;