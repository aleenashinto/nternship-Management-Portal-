@echo off
title Internship Management Portal - Backend (Django)
cd /d "%~dp0backend"
echo ====================================================
echo Starting Django Backend at http://127.0.0.1:8000
echo ====================================================
py manage.py runserver 127.0.0.1:8000
pause
