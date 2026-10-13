@echo off
chcp 65001 >nul
title TRAIN TMS - Cloudflare Online Tunnel for Friends
echo ================================================================
echo   🌐 สร้างลิงก์ออนไลน์ (Cloudflare Tunnel) ส่งให้เพื่อนดูได้ทันที
echo ================================================================
echo.
echo [1/2] กำลังตรวจสอบสถานะระบบ...
echo       กรุณาตรวจสอบว่าคุณได้เปิดเซิร์ฟเวอร์ด้วย start_project.bat แล้ว
echo.
echo [2/2] กำลังเชื่อมต่อ Cloudflare Tunnel ไปที่ http://localhost:5173 ...
echo       (รอสักครู่จนกว่าจะมีลิงก์ https://...trycloudflare.com ปรากฏขึ้น)
echo       คุณสามารถคัดลอกลิงก์นั้นส่งให้เพื่อนเปิดในมือถือหรือคอมพิวเตอร์ได้เลย!
echo ================================================================
echo.

npx --yes cloudflared tunnel --http-host-header localhost:5173 --url http://127.0.0.1:5173
pause
