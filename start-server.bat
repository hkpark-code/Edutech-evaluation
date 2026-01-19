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

REM 의존성 확인
if not exist "node_modules" (
    echo [경고] node_modules가 없습니다. npm install을 실행합니다...
    call npm install
    if %errorlevel% neq 0 (
        echo [오류] 의존성 설치에 실패했습니다.
        pause
        exit /b 1
    )
)

REM 개발 서버 시작
echo [정보] 개발 서버를 시작합니다...
echo [정보] 브라우저에서 http://localhost:3000 을 열어주세요.
echo.
call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [오류] 개발 서버 시작에 실패했습니다.
    pause
    exit /b 1
)







