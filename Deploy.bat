@echo off
setlocal enabledelayedexpansion

set "WORKDIR=D:\ReelsFlow IA"

echo Working dir: %WORKDIR%
cd /d "%WORKDIR%"

REM 1) Ensure origin is set
git remote | findstr /R /I "^origin$" >nul
if errorlevel 1 (
  echo Adding origin remote
  git remote add origin https://github.com/rafsanchez2rs-jpg/ReelsPro.git
)

echo Fetching from origin
git fetch origin
echo Checking out main
git checkout main
echo Pulling latest
git pull origin main

echo Removing package-lock.json if exists
if exist "package-lock.json" del "package-lock.json"

echo Installing dependencies
where yarn >nul 2>&1
if not errorlevel 1 (
  echo Yarn found, using yarn
  yarn install
  yarn build
  set "BUILD_OK=%ERRORLEVEL%"
) else (
  echo Yarn not found, using npm
  npm install
  npm run build
  set "BUILD_OK=%ERRORLEVEL%"
)

if "%BUILD_OK%"=="0" (
  echo Build successful.
) else (
  echo Build failed. Please check the logs above.
  goto end
)

echo Do you want to push local changes (if any) after this build? (y/n)
set /p PUSH=
if /I "%PUSH%"=="Y" (
  git add -A
  git commit -m "deploy: sync after build"
  git push origin main
)

:end
echo Done
pause