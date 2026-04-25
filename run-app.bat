@echo off
echo ========================================
echo   POS Invoice - Application Launcher
echo ========================================
echo.

REM Check Node.js installation
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js tidak ditemukan. Silakan install Node.js terlebih dahulu.
    pause
    exit /b 1
)
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm tidak ditemukan. Silakan install Node.js terlebih dahulu.
    pause
    exit /b 1
)

REM Check dependencies
if not exist "backend\node_modules" (
    echo [INFO] Backend dependencies belum ada. Menjalankan npm install...
    cd backend
    call npm install
    cd ..
)
if not exist "frontend\node_modules" (
    echo [INFO] Frontend dependencies belum ada. Menjalankan npm install...
    cd frontend
    call npm install
    cd ..
)

echo [1/3] Membersihkan port 5000 dan 3000...

REM Kill port 5000 (backend) - exact match dengan trailing space agar tidak match 50000, 15000, dll
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000 " ^| find "LISTENING"') do (
    echo   - Menutup process di port 5000 (PID: %%a)
    taskkill /PID %%a /F >nul 2>&1
)

REM Kill port 3000 (frontend) - exact match dengan trailing space
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000 " ^| find "LISTENING"') do (
    echo   - Menutup process di port 3000 (PID: %%a)
    taskkill /PID %%a /F >nul 2>&1
)

echo [2/3] Menjalankan backend...
start "Backend" cmd /k "cd backend && node server.js"

echo [INFO] Menunggu backend initialize (5 detik)...
timeout /t 5 /nobreak >nul

REM Quick health check
echo [INFO] Memeriksa status backend...
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:5000/api/health' -UseBasicParsing -TimeoutSec 3; if ($r.StatusCode -eq 200) { Write-Host '   [OK] Backend responding' } else { Write-Host '   [WARN] Backend returned status ' $r.StatusCode } } catch { Write-Host '   [WARN] Backend belum ready. Cek window Backend untuk detail error.' }" 2>nul

echo [3/3] Menjalankan frontend...
start "Frontend" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo   Aplikasi POS Invoice sedang berjalan.
echo ========================================
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3000
echo ========================================
pause
