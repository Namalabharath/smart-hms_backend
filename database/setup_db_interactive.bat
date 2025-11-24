@echo off
REM Hospital Management System - Complete Database Setup
REM This script will help you set up MySQL and import test data

setlocal enabledelayedexpansion
cls

echo ========================================
echo Hospital Management System
echo MySQL Database Setup Wizard
echo ========================================
echo.

REM MySQL paths
set MYSQL_BIN=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe
set MYSQL_SCHEMA=C:\Users\nbhar\SMART HMS\backend\database\schema_with_data.sql

REM Check if MySQL exists
if not exist "%MYSQL_BIN%" (
    echo ERROR: MySQL not found at %MYSQL_BIN%
    echo.
    echo Please install MySQL Server 8.0 from:
    echo https://dev.mysql.com/downloads/mysql/
    echo.
    pause
    exit /b 1
)

echo [1/4] MySQL found: OK
echo.

REM Ask for MySQL password
set /p MYSQL_PASS="Enter your MySQL root password (press Enter if no password): "

REM Test connection
echo.
echo [2/4] Testing MySQL connection...
"%MYSQL_BIN%" -u root -p%MYSQL_PASS% -e "SELECT 1;" >nul 2>&1

if %errorlevel% neq 0 (
    echo ERROR: Cannot connect to MySQL
    echo Please check your password and try again
    echo.
    pause
    exit /b 1
)

echo Connected to MySQL: OK
echo.

REM Import schema and test data
echo [3/4] Creating database and tables...
"%MYSQL_BIN%" -u root -p%MYSQL_PASS% < "%MYSQL_SCHEMA%"

if %errorlevel% neq 0 (
    echo ERROR: Failed to import database schema
    echo.
    pause
    exit /b 1
)

echo Database created: OK
echo.

REM Verify
echo [4/4] Verifying database...
"%MYSQL_BIN%" -u root -p%MYSQL_PASS% -e "USE hospital_management_system; SELECT COUNT(*) as 'Tables' FROM information_schema.tables WHERE table_schema='hospital_management_system';" 2>nul

echo.
echo ========================================
echo SUCCESS! Database setup complete
echo ========================================
echo.
echo Next Steps:
echo 1. Update your .env file with the password:
echo    DB_PASSWORD=%MYSQL_PASS%
echo.
echo 2. Start Backend Server:
echo    cd "C:\Users\nbhar\SMART HMS\backend"
echo    npm start
echo.
echo 3. Start Frontend Server:
echo    cd "C:\Users\nbhar\SMART HMS\frontend"
echo    npm start
echo.
echo 4. Visit http://localhost:3000
echo.
echo Test Users:
echo - admin / (your password)
echo - dr_smith / (your password)
echo - patient_john / (your password)
echo.

pause
