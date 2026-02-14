@echo off
echo ========================================
echo DEBUG MODE - POS Invoice Application
echo ========================================
echo.
echo This script will run the application with detailed logging
echo to help debug authentication issues.
echo.
echo Press any key to start...
pause >nul

echo.
echo [1/4] Checking ports 5000 and 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do (
    echo Killing process on port 5000 (PID: %%a)
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    echo Killing process on port 3000 (PID: %%a)
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo [2/4] Starting backend server with debug logging...
start "Backend Debug" cmd /k "cd backend && echo Backend Debug Mode - Check console for DEBUG logs && node server.js"

echo.
echo [3/4] Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo [4/4] Starting frontend...
start "Frontend Debug" cmd /k "cd frontend && echo Frontend Debug Mode - Check browser console for DEBUG logs && npm start"

echo.
echo ========================================
echo APPLICATION STARTED IN DEBUG MODE
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo DEBUG LOGS:
echo - Backend: Check backend terminal for "DEBUG AUTH" and "DEBUG PRODUCTS" logs
echo - Frontend: Open browser DevTools (F12) ^> Console tab for "DEBUG" logs
echo.
echo TROUBLESHOOTING STEPS:
echo 1. Open http://localhost:3000
echo 2. Login with admin/admin123
echo 3. Go to Products page
echo 4. Try to add a product
echo 5. Check both backend and frontend console logs
echo.
echo Press any key to exit...
pause >nul