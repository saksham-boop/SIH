@echo off
title SIH Land Record System - Dual Launcher
echo ================================================================
echo Launching Intelligent Land Record Validation System (SIH Prototype)
echo 1. Backend: http://127.0.0.1:8000
echo 2. Frontend: http://localhost:5173
echo ================================================================

start "SIH Backend" cmd /k "%~dp0run_backend.bat"
timeout /t 3 /nobreak >nul
start "SIH Frontend" cmd /k "%~dp0run_frontend.bat"

echo.
echo Both servers launched in background terminal windows!
echo Access the officer portal at: http://localhost:5173
timeout /t 5
