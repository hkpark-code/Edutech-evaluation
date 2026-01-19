@echo off
REM Windows 11 호환성 개선 - UTF-8 인코딩 설정
chcp 65001 >nul 2>&1

REM 현재 스크립트 디렉토리로 이동
cd /d "%~dp0"

REM Node.js 버전 확인
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [오류] Node.js가 설치되어 있지 않습니다.
    echo Node.js 18.0.0 이상을 설치해주세요.
    pause
    exit /b 1
)

REM Node.js 버전 확인 (18.0.0 이상)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [정보] Node.js 버전: %NODE_VERSION%

REM 브라우저 자동 실행 (8초 후)
start "" /b cmd /c "timeout /t 8 /nobreak >nul && start http://localhost:3000"

REM 개발 서버 시작
echo [정보] 개발 서버를 시작합니다...
echo [정보] 브라우저는 잠시 후 자동으로 열립니다.
echo.
call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [오류] 개발 서버 시작에 실패했습니다.
    pause
    exit /b 1
)







