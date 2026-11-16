@echo off
title Matrimonial Tracker PWA
cd /d "%~dp0"
echo Starting Matrimonial Tracker PWA local server...
start "" http://localhost:8080/
node server.js
pause
