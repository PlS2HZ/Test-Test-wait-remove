const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Endpoints
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/trainee', require('./routes/traineeRoutes'));
app.use('/api/trainer', require('./routes/trainerRoutes'));
app.use('/api/hr', require('./routes/hrRoutes'));
// Developer database console is not mounted in the employee application.

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'TRAIN TMS (Dynamics Motion)',
    driver: db.getDriver(),
    time: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================================');
  console.log(`🚀 TRAIN TMS Backend API Server is running on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
  console.log(`🗄️ Database Driver: ${db.getDriver().toUpperCase()} (13 Relational Tables)`);
  console.log('========================================================');
});