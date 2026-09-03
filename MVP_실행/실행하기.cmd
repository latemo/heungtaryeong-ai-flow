@echo off
chcp 65001 > nul
title 천안 J3D LAB - 흥타령 AI FLOW 모바일 웹앱 실행기 (MVP 제출용)

echo ========================================================
echo    천안 J3D LAB - 흥타령 AI FLOW 모바일 웹앱
echo    2026 천안시 AI·데이터 기반 정책 아이디어 경진대회
echo ========================================================
echo.
echo 웹앱을 실행하는 중입니다... 잠시만 기다려주세요.
echo.

set PARENT_DIR=%~dp0..
cd /d "%PARENT_DIR%"

where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [알림] 로컬 웹 서버(포트 8080)를 시작하고 브라우저를 엽니다...
    start http://localhost:8080/index.html
    python -m http.server 8080
) else (
    echo [알림] 기본 웹 브라우저로 index.html 파일을 엽니다...
    start "" "%PARENT_DIR%\index.html"
)
pause
