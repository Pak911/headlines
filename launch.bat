@echo off
echo ========================================
echo   Headlines - Crossword Game Launcher
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed!
    echo.
    echo Please install Python from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)

echo Starting Headlines server...
echo.
echo The game will open in your browser automatically.
echo Keep this window open while playing.
echo.
echo Press Ctrl+C to stop the server when done.
echo ========================================
echo.

REM Kill any existing Python server on port 8033
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8033" ^| find "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

REM Start Python server and open browser
start http://localhost:8033
python -m http.server 8033

pause