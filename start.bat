@echo off
echo ========================================
echo vibeX - Starting Development Server
echo ========================================
echo.

echo [1/3] Installing dependencies...
call npm install
if errorlevel 1 (
    echo.
    echo ERROR: npm install failed
    echo Make sure Node.js is installed
    pause
    exit /b 1
)

echo.
echo [2/3] Dependencies installed!
echo.

echo [3/3] Starting dev server...
echo.
echo Your app will open at: http://localhost:5173
echo Press Ctrl+C to stop the server
echo.

call npm run dev
