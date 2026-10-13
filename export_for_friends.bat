@echo off
chcp 65001 >nul
title TRAIN TMS - Package Project for Friends
echo ================================================================
echo   📦 กำลังแพ็กไฟล์โปรเจกต์เป็น ZIP เพื่อส่งให้เพื่อน...
echo ================================================================
echo.

set "OUTPUT_ZIP=%~dp0..\train_tms_ready_for_friends.zip"

if exist "%OUTPUT_ZIP%" del "%OUTPUT_ZIP%"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$dest = '%OUTPUT_ZIP%';" ^
  "$src = '%~dp0';" ^
  "Write-Host 'กำลังบีบอัดไฟล์ (ไม่รวม node_modules เพื่อให้ไฟล์เล็กส่งไลน์ง่าย)...';" ^
  "& tar -a -cf $dest --exclude='*node_modules*' --exclude='*.git*' -C $src ."

if exist "%OUTPUT_ZIP%" (
    echo.
    echo ================================================================
    echo   ✅ แพ็กสำเร็จเรียบร้อย!
    echo   ไฟล์ ZIP อยู่ที่:
    echo   %OUTPUT_ZIP%
    echo.
    echo   เพื่อนที่รับไฟล์ไป เพียงแตกไฟล์ ZIP แล้วดับเบิ้ลคลิก:
    echo   "start_project.bat" 
    echo   ระบบจะติดตั้งและเปิดหน้าเว็บให้อัตโนมัติทันที
    echo ================================================================
) else (
    echo [ERROR] เกิดข้อผิดพลาดในการสร้างไฟล์ ZIP
)

pause
