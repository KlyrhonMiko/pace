@echo off
REM PACE Development - Clear Upstash Redis Cache (Windows)
REM This script clears all cached data from Upstash Redis

echo.
echo 🗑️  PACE Cache Clear Tool (Upstash)
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0

REM Navigate to project root
cd /d "%SCRIPT_DIR%..\.."

REM Check if .env.local exists
if not exist ".env.local" (
    echo ❌ .env.local file not found.
    pause
    exit /b 1
)

REM Check if redis-cli is available
where redis-cli >nul 2>nul
if errorlevel 1 (
    echo ⚠️  redis-cli is not installed.
    echo Please install redis-cli from: https://redis.io/download
    echo Or use Windows Subsystem for Linux (WSL).
    echo.
    pause
    exit /b 1
)

REM Parse REDIS_URL from .env.local
setlocal enabledelayedexpansion
for /f "tokens=2 delims==" %%A in ('findstr /i "^REDIS_URL" .env.local') do (
    set "REDIS_URL=%%A"
    REM Remove quotes if present
    set "REDIS_URL=!REDIS_URL:"=!"
)

if "!REDIS_URL!"=="" (
    echo ❌ REDIS_URL not found in .env.local
    pause
    exit /b 1
)

echo Are you sure you want to clear ALL cache from Upstash? This is irreversible. (y/N)
set /p confirm=

if /i not "!confirm!"=="y" (
    echo ❌ Cache clear cancelled.
    echo.
    pause
    exit /b 0
)

echo.
echo ⏳ Clearing cache...

REM Get count before using redis-cli
for /f "tokens=*" %%A in ('redis-cli -u "!REDIS_URL!" DBSIZE 2^>nul ^| findstr /r "keys"') do (
    set "output=%%A"
)
if defined output (
    echo 📊 Keys before clear: !output!
) else (
    echo 📊 Checking cache...
)

REM Clear the database
redis-cli -u "!REDIS_URL!" FLUSHDB >nul 2>&1

if errorlevel 1 (
    echo ❌ Failed to clear cache. Check your REDIS_URL in .env.local
    pause
    exit /b 1
)

echo.
echo ✅ Cache cleared successfully from Upstash!
echo.
echo 📊 Keys after clear: 0
echo.
echo 💡 Next steps:
echo    - Restart the backend to reload cache on startup
echo    - Or let the cache auto-refresh (jobs refresh every 6 hours)
echo.

pause
endlocal
