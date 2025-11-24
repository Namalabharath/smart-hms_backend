@echo off
REM Hospital Management System - Database Setup Script
REM This script creates the database with sample test data

echo ========================================
echo Hospital Management System - DB Setup
echo ========================================
echo.
echo This script will:
echo 1. Drop existing database (if any)
echo 2. Create new database
echo 3. Create all 18 tables
echo 4. Insert test data for all roles
echo.

REM Check if MySQL is installed
where mysql >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: MySQL is not installed or not in PATH
    echo Please install MySQL or add it to your system PATH
    pause
    exit /b 1
)

REM Get MySQL password from user
set /p MYSQL_PASS="Enter MySQL password (press Enter if no password): "

REM Run the schema with test data
echo.
echo Importing database schema and test data...
echo.

if "%MYSQL_PASS%"=="" (
    mysql -u root < "%~dp0schema_with_data.sql"
) else (
    mysql -u root -p%MYSQL_PASS% < "%~dp0schema_with_data.sql"
)

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Database created with test data
    echo ========================================
    echo.
    echo Database Name: hospital_management_system
    echo Tables Created: 18
    echo Test Users Created: 11
    echo.
    echo TEST CREDENTIALS:
    echo ================
    echo Admin:       admin / (use your password)
    echo Doctor 1:    dr_smith / (use your password)
    echo Doctor 2:    dr_jones / (use your password)
    echo Nurse 1:     nurse_sarah / (use your password)
    echo Nurse 2:     nurse_mike / (use your password)
    echo Pharmacist:  pharmacist_bob / (use your password)
    echo Lab Tech:    lab_tech_alice / (use your password)
    echo Receptionist: receptionist_emma / (use your password)
    echo Patient 1:   patient_john / (use your password)
    echo Patient 2:   patient_jane / (use your password)
    echo Patient 3:   patient_bob / (use your password)
    echo.
    echo Next Steps:
    echo 1. Start Backend: cd backend ^&^& npm start
    echo 2. Start Frontend: cd frontend ^&^& npm start
    echo 3. Visit: http://localhost:3000
    echo 4. Try registering or logging in with test credentials
    echo.
) else (
    echo.
    echo ERROR: Database import failed
    echo Please check your MySQL connection and try again
    echo.
)

pause
