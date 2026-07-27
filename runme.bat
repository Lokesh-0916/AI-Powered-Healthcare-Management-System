@echo off
cd /d "%~dp0"
echo Starting HealthCare Portal...

:: Run seed if this is the first time (no .seed marker file found)
if not exist "server\.seed" (
    echo First run detected. Seeding database...
    cd server
    node seed.js
    cd ..
    echo Seeding complete.
) else (
    echo Database already seeded. Skipping.
)

:: Start the Node.js server
echo Starting Node.js server...
start "HealthCare Server" cmd /c "cd server && npm start"

:: Wait for 4 seconds to give the server time to start
timeout /t 4 /nobreak >nul

:: Open the frontend at login.html to ensure a clean start
echo Opening Client...
start "" "client\login.html"

echo Done!
