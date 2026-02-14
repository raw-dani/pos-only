@echo off
echo Testing POS Invoice API...

REM Test login
echo Testing login...
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}" > login_response.json

REM Extract token (simple way)
for /f "tokens=2 delims=:," %%a in ('findstr "token" login_response.json') do set TOKEN=%%a
set TOKEN=%TOKEN:"=%
set TOKEN=%TOKEN: =%

echo Token: %TOKEN%

REM Test products API
echo Testing products API...
curl -X GET http://localhost:5000/api/products -H "Authorization: Bearer %TOKEN%"

echo Test completed.
pause