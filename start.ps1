# Smart Meditation Attendance System Launcher
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Smart Meditation Attendance System"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "    Smart Meditation Attendance System             " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Preparing system..." -ForegroundColor Yellow
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "mysqld" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "[2/3] Starting Database (MySQL)..." -ForegroundColor Yellow
Start-Process -FilePath "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" -ArgumentList '--datadir="d:\ActivityTracking\mysql-data"', '--console' -WindowStyle Minimized
Start-Sleep -Seconds 3

Write-Host "[3/3] Starting Web Server (Next.js)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList '/c npm run dev' -WorkingDirectory "d:\ActivityTracking\smart-attendance" -WindowStyle Minimized
Start-Sleep -Seconds 5

Write-Host "Opening Web Browser (http://localhost:3000)..." -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "===================================================" -ForegroundColor Green
Write-Host "   SYSTEM IS RUNNING SUCCESSFULLY!                 " -ForegroundColor Green
Write-Host "   - Web Address: http://localhost:3000            " -ForegroundColor Green
Write-Host "   - Please keep this window open or minimized.    " -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit this launcher window"
