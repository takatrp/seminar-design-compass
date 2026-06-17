@echo off
setlocal

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found.
  echo Please install Node.js, then run this launcher again.
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm.cmd was not found.
  echo Please check your Node.js installation.
  pause
  exit /b 1
)

if not exist "dist\index.html" (
  echo Build files were not found.
  echo Preparing the app. This may take a while.
  if not exist "node_modules\vite\bin\vite.js" (
    call npm.cmd install
    if errorlevel 1 (
      echo Setup failed.
      pause
      exit /b 1
    )
  )
  call npm.cmd run build
  if errorlevel 1 (
    echo Build failed.
    pause
    exit /b 1
  )
)

node "%~dp0serve-seminar-design-compass.mjs"

pause
