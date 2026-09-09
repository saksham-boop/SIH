@echo off
title SIH Land Record System - Frontend (React + Vite :5173)
echo ================================================================
echo Starting React Vite Frontend on http://localhost:5173...
echo ================================================================
cd /d "%~dp0"
set "PATH=%~dp0.tools\node;%PATH%"
cd frontend
npm run dev
pause
