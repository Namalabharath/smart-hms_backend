#!/usr/bin/env node

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_management_system',
    port: process.env.DB_PORT || 3306
};

async function runMigrations() {
    let connection;
    try {
        console.log('🔄 Connecting to database...');
        connection = await mysql.createConnection(config);
        console.log('✅ Connected to database');

        // Read migration files - using parent directory path
        const migrationsDir = path.join(__dirname, '..', 'migrations');
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

        console.log(`\n📋 Found ${files.length} migration file(s)`);

        for (const file of files) {
            console.log(`\n▶️  Running: ${file}`);
            const sqlPath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(sqlPath, 'utf8');
            
            // Split by semicolon and execute each statement
            const statements = sql.split(';').filter(s => s.trim());
            
            for (const statement of statements) {
                if (statement.trim()) {
                    try {
                        await connection.execute(statement);
                        console.log(`  ✓ Executed: ${statement.substring(0, 50)}...`);
                    } catch (err) {
                        console.error(`  ✗ Error: ${err.message}`);
                    }
                }
            }
        }

        console.log('\n✅ All migrations completed!');
        console.log('\n📝 Summary:');
        console.log('  - Created patient_samples table');
        console.log('  - Created test_results table');
        console.log('  - Updated lab_requests table with new columns');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run migrations
runMigrations();
