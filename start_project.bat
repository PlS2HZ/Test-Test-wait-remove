@echo off
chcp 65001 >nul
title TRAIN TMS - Starting Full-Stack Application
echo ================================================================
echo   🚀 เริ่มต้นระบบ TRAIN TMS (Dynamics Motion)
echo   ระบบบริหารจัดการการฝึกอบรมพนักงานใหม่
echo ================================================================
echo.

rem 1. ตรวจสอบ Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] ไม่พบ Node.js ในเครื่อง! กรุณาติดตั้ง Node.js จาก https://nodejs.org ก่อนครับ
    pause
    exit /b
)

rem 2. ตรวจสอบและติดตั้ง Dependencies ใน Backend
if not exist "backend\node_modules" (
    echo [INFO] กำลังติดตั้ง Dependencies สำหรับ Backend...
    cd backend
    call npm install
    cd ..
)

rem 3. ตรวจสอบและติดตั้ง Dependencies ใน Frontend
if not exist "frontend\node_modules" (
    echo [INFO] กำลังติดตั้ง Dependencies สำหรับ Frontend...
    cd frontend
    call npm install
    cd ..
)

echo.
echo [INFO] เซิร์ฟเวอร์กำลังเริ่มต้น...
echo        - Backend API: http://localhost:5000
echo        - Frontend Web: http://localhost:5173
echo.
echo กด Ctrl + C ในหน้าต่างนี้เมื่อต้องการหยุดการทำงาน
echo ================================================================

node start.js
pause
