@echo off
chcp 65001 >nul
title Smart Attendance System - DO NOT CLOSE
color 0A

echo ===================================================
echo     ระบบเช็คชื่อปฏิบัติธรรม (Smart Attendance)
echo ===================================================
echo.
echo [กำลังเตรียมระบบ...]
echo ปิดระบบที่อาจค้างอยู่ก่อนหน้า...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM mysqld.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo [1/3] กำลังเปิดฐานข้อมูล (MySQL)...
start "MySQL_Database" /MIN "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --datadir="d:\ActivityTracking\mysql-data" --console
timeout /t 4 /nobreak >nul

echo.
echo [2/3] กำลังเปิดเซิร์ฟเวอร์เว็บ (Next.js)...
start "Web_Server" /MIN cmd /c "cd /d d:\ActivityTracking\smart-attendance && npm run dev"
timeout /t 7 /nobreak >nul

echo.
echo [3/3] กำลังเปิดหน้าเว็บเบราว์เซอร์...
start http://localhost:3000

echo.
echo ===================================================
echo    ✅ ระบบกำลังทำงานอย่างสมบูรณ์!
echo.
echo    - โปรด "ย่อ (Minimize)" หน้าต่างเหล่านี้ไว้ ห้ามกดกากบาทปิด
echo    - หากเว็บเข้าไม่ได้ หรือระบบค้าง ให้ดับเบิ้ลคลิกไฟล์นี้ใหม่
echo ===================================================
echo.
echo (กดปุ่มใดๆ เพื่อปิดหน้าต่างคำสั่งนี้ ระบบจะยังคงทำงานอยู่เบื้องหลัง)
pause >nul
