@echo off
title SIH Land Record System - Backend (FastAPI :8000)
echo ================================================================
echo Starting FastAPI Land Record Validation Backend on port 8000...
echo ================================================================
cd /d "%~dp0"
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
pause
