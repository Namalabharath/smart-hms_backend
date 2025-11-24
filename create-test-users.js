#!/usr/bin/env node
const mysql = require('mysql2/promise');
const crypto = require('crypto');

function hashPassword(password) {
    const hash1 = crypto.createHash('sha256').update(password).digest('hex');
    return crypto.createHash('sha256').update(hash1 + 'hospital2025').digest('hex');
}

async function createTestUsers() {
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'hospital_management_system'
        });

        console.log('🔄 Creating test users...\n');

        const users = [
            { username: 'receptionist_priya', email: 'priya@hospital.com', role: 'receptionist', first_name: 'Priya', last_name: 'Verma', password: 'Receptionist@123' },
            { username: 'pharmacist_ravi', email: 'ravi@hospital.com', role: 'pharmacist', first_name: 'Ravi', last_name: 'Kumar', password: 'Pharmacist@123' },
            { username: 'lab_tech_meera', email: 'meera@hospital.com', role: 'lab_technician', first_name: 'Meera', last_name: 'Singh', password: 'LabTech@123' },
            { username: 'inventory_admin', email: 'admin@hospital.com', role: 'inventory_manager', first_name: 'Admin', last_name: 'Manager', password: 'Inventory@123' }
        ];

        for (const user of users) {
            const hash = hashPassword(user.password);
            
            try {
                await conn.execute(
                    'INSERT INTO users (username, email, role, first_name, last_name, auth_type, password_hash, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)',
                    [user.username, user.email, user.role, user.first_name, user.last_name, 'simple_hash', hash]
                );
                console.log(`✅ Created: ${user.username} (${user.role}) / ${user.password}`);
            } catch (e) {
                if (e.code === 'ER_DUP_ENTRY') {
                    console.log(`⚠️  Already exists: ${user.username}`);
                } else {
                    throw e;
                }
            }
        }

        // Create receptionist record
        try {
            const [receptionistUser] = await conn.execute('SELECT id FROM users WHERE username = ?', ['receptionist_priya']);
            if (receptionistUser.length > 0) {
                await conn.execute('INSERT IGNORE INTO receptionists (user_id, department) VALUES (?, ?)', [receptionistUser[0].id, 'Reception']);
            }
        } catch (e) {}

        console.log('\n✅ All test users created successfully!\n');
        console.log('📋 Test Credentials:\n');
        console.log('Receptionist:');
        console.log('  Username: receptionist_priya');
        console.log('  Password: Receptionist@123\n');
        console.log('Pharmacist:');
        console.log('  Username: pharmacist_ravi');
        console.log('  Password: Pharmacist@123\n');
        console.log('Lab Technician:');
        console.log('  Username: lab_tech_meera');
        console.log('  Password: LabTech@123\n');
        console.log('Inventory Manager:');
        console.log('  Username: inventory_admin');
        console.log('  Password: Inventory@123\n');

        await conn.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createTestUsers();
