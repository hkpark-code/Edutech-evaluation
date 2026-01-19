@echo off
REM Windows 11 호환성 개선 - UTF-8 인코딩 설정
chcp 65001 >nul 2>&1

echo ========================================
echo   에듀테크 가치평가 웹서버 시작
echo ========================================
echo.

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
echo.

echo [1/4] 기존 Node 프로세스 종료 중...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo [완료] 기존 프로세스가 종료되었습니다.
) else (
    echo [정보] 실행 중인 Node 프로세스가 없습니다.
)
echo.

echo [2/4] .next 캐시 정리 중...
if exist ".next" (
    rmdir /s /q ".next" >nul 2>&1
    echo [완료] 캐시가 정리되었습니다.
) else (
    echo [정보] 캐시 디렉토리가 없습니다.
)
echo.

echo [3/4] 의존성 확인 중...
if not exist "node_modules" (
    echo [경고] node_modules가 없습니다. npm install을 실행합니다...
    call npm install
    if %errorlevel% neq 0 (
        echo [오류] 의존성 설치에 실패했습니다.
        pause
        exit /b 1
    )
) else (
    echo [완료] 의존성이 확인되었습니다.
)
echo.

echo [4/4] 개발 서버 시작 중...
echo.
echo ----------------------------------------
echo   잠시 후 브라우저가 자동으로 열립니다
echo   열리지 않으면 http://localhost:3000
echo ----------------------------------------
echo.

REM 브라우저 자동 실행 (8초 후)
start "" /b cmd /c "timeout /t 8 /nobreak >nul && start http://localhost:3000"

REM 개발 서버 시작
npx next dev

if %errorlevel% neq 0 (
    echo.
    echo [오류] 개발 서버 시작에 실패했습니다.
    pause
    exit /b 1
)





