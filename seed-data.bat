@echo off
echo Seeding data awal ke database...

REM Menggunakan curl untuk POST request ke endpoint seed
curl -X POST http://localhost:5000/api/seed -H "Content-Type: application/json"

echo.
echo Seeding selesai. Tekan sembarang tombol untuk keluar...
pause >nul