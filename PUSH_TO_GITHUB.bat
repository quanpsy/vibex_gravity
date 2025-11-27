@echo off
echo ==========================================
echo      vibeX - Push to GitHub Helper
echo ==========================================
echo.
echo This script will initialize Git, commit your code, and push it to GitHub.
echo.

:: 1. Initialize Git
echo [1/5] Initializing Git repository...
git init
if %errorlevel% neq 0 (
    echo Error: Git is not installed or not found. Please install Git.
    pause
    exit /b
)

:: 2. Configure .gitignore
echo [2/5] Creating .gitignore...
echo node_modules > .gitignore
echo .env >> .gitignore
echo dist >> .gitignore
echo .DS_Store >> .gitignore

:: 3. Add and Commit
echo [3/5] Committing code...
git add .
git commit -m "Initial commit: Complete vibeX app v1.0"

:: 4. Get Remote URL
echo.
echo Please create a NEW repository on GitHub (https://github.com/new)
echo and copy the HTTPS URL (e.g., https://github.com/username/vibex.git)
echo.
set /p REPO_URL="Paste your GitHub Repository URL here: "

:: 5. Push
echo [4/5] Adding remote origin...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main

echo [5/5] Pushing to GitHub...
git push -u origin main

echo.
echo ==========================================
echo      SUCCESS! Code pushed to GitHub.
echo ==========================================
echo.
echo Now go to Vercel and import this repository!
echo.
pause
