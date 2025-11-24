# Hospital Management System - Complete Database Setup (PowerShell)
# This script sets up MySQL and imports test data

param(
    [string]$MySQLPassword = ""
)

$ErrorActionPreference = "Stop"

# Colors
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }

# Paths
$MYSQL_BIN = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
$SCHEMA_FILE = "C:\Users\nbhar\SMART HMS\backend\database\schema_with_data.sql"

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Hospital Management System" -ForegroundColor Yellow
Write-Host "MySQL Database Setup Wizard" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

# Step 1: Check MySQL installation
Write-Info "[1/5] Checking MySQL installation..."
if (-not (Test-Path $MYSQL_BIN)) {
    Write-Error "ERROR: MySQL not found at $MYSQL_BIN"
    Write-Host ""
    Write-Host "Please install MySQL Server 8.0 from:"
    Write-Host "https://dev.mysql.com/downloads/mysql/"
    exit 1
}
Write-Success "✓ MySQL found: OK"
Write-Host ""

# Step 2: Get password if not provided
if (-not $MySQLPassword) {
    Write-Info "[2/5] Getting MySQL credentials..."
    $MySQLPassword = Read-Host "Enter your MySQL root password (press Enter if no password)"
} else {
    Write-Info "[2/5] Using provided password"
}

# Step 3: Test connection
Write-Info "[3/5] Testing MySQL connection..."
try {
    if ($MySQLPassword) {
        & $MYSQL_BIN -u root "-p$MySQLPassword" -e "SELECT 1;" 2>&1 | Out-Null
    } else {
        & $MYSQL_BIN -u root -e "SELECT 1;" 2>&1 | Out-Null
    }
    Write-Success "✓ Connected to MySQL: OK"
} catch {
    Write-Error "ERROR: Cannot connect to MySQL"
    Write-Host "Please check your password and ensure MySQL is running"
    Write-Host "To check if MySQL is running:"
    Write-Host "  Get-Service MySQL80 | Start-Service"
    exit 1
}
Write-Host ""

# Step 4: Import schema and test data
Write-Info "[4/5] Creating database and tables (18 tables)..."
try {
    if ($MySQLPassword) {
        & $MYSQL_BIN -u root "-p$MySQLPassword" < $SCHEMA_FILE
    } else {
        & $MYSQL_BIN -u root < $SCHEMA_FILE
    }
    Write-Success "✓ Database created with test data: OK"
} catch {
    Write-Error "ERROR: Failed to import database schema"
    exit 1
}
Write-Host ""

# Step 5: Verify
Write-Info "[5/5] Verifying database..."
try {
    if ($MySQLPassword) {
        $output = & $MYSQL_BIN -u root "-p$MySQLPassword" -e "USE hospital_management_system; SELECT COUNT(*) as 'Count' FROM users;" 2>&1
    } else {
        $output = & $MYSQL_BIN -u root -e "USE hospital_management_system; SELECT COUNT(*) as 'Count' FROM users;" 2>&1
    }
    Write-Success "✓ Database verified: OK"
    Write-Host ""
    Write-Host "Test users created: $($output -match '\d+' | ForEach-Object { $_.Split()[0] } | Select-Object -Last 1)"
} catch {
    Write-Error "ERROR: Failed to verify database"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ SUCCESS! Database setup complete" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. Update your .env file with the password:"
Write-Host "   File: C:\Users\nbhar\SMART HMS\backend\.env"
Write-Host "   Add: DB_PASSWORD=$MySQLPassword"
Write-Host ""

Write-Host "2. Start Backend Server (in Terminal 1):"
Write-Host "   cd 'C:\Users\nbhar\SMART HMS\backend'"
Write-Host "   npm start"
Write-Host ""

Write-Host "3. Start Frontend Server (in Terminal 2):"
Write-Host "   cd 'C:\Users\nbhar\SMART HMS\frontend'"
Write-Host "   npm start"
Write-Host ""

Write-Host "4. Visit http://localhost:3000 in your browser"
Write-Host ""

Write-Host "TEST USERS (use any username, password from ZKP):"
Write-Host "  • admin"
Write-Host "  • dr_smith"
Write-Host "  • dr_jones"
Write-Host "  • nurse_sarah"
Write-Host "  • patient_john"
Write-Host "  • patient_jane"
Write-Host "  ... and 4 more roles"
Write-Host ""

Write-Host "DATABASE INFO:"
Write-Host "  • Host: localhost"
Write-Host "  • Port: 3306"
Write-Host "  • User: root"
Write-Host "  • Password: $MySQLPassword"
Write-Host "  • Database: hospital_management_system"
Write-Host "  • Tables: 18"
Write-Host "  • Test Users: 11"
Write-Host ""

Write-Host "Ready to start? Press Enter to continue..."
Read-Host
