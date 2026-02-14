@echo off
echo Checking and killing processes on ports 5000 and 3000...

REM Kill port 5000 (backend)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do (
    echo Killing process on port 5000 (PID: %%a)
    taskkill /PID %%a /F >nul 2>&1
)

REM Kill port 3000 (frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    echo Killing process on port 3000 (PID: %%a)
    taskkill /PID %%a /F >nul 2>&1
)

echo Starting backend...
start "Backend" cmd /k "cd backend && node server.js"

timeout /t 5 /nobreak >nul

echo Starting frontend...
start "Frontend" cmd /k "cd frontend && npm start"

echo Aplikasi POS Invoice sedang berjalan.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
pause