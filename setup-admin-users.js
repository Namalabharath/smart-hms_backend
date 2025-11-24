const mysql = require('mysql2/promise');
const crypto = require('crypto');

function hashPassword(password) {
    const hash1 = crypto.createHash('sha256').update(password).digest('hex');
    return crypto.createHash('sha256').update(hash1 + 'hospital2025').digest('hex');
}

async function checkUsers() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'hospital_management_system'
    });

    // Check if admin exists
    const [admin] = await conn.query('SELECT * FROM users WHERE username = ?', ['admin_arjun']);
    console.log('Admin exists:', admin.length > 0);

    if (admin.length === 0) {
        const hash = hashPassword('Admin@123');
        await conn.execute(
            'INSERT INTO users (username, email, role, first_name, last_name, auth_type, password_hash, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['admin_arjun', 'admin@hospital.com', 'admin', 'Arjun', 'Sharma', 'simple_hash', hash, true]
        );
        console.log('✅ Admin created');
    }

    // Check if inventory manager exists
    const [inv] = await conn.query('SELECT * FROM users WHERE username = ?', ['inventory_admin']);
    console.log('Inventory manager exists:', inv.length > 0);

    if (inv.length === 0) {
        const hash = hashPassword('Inventory@123');
        await conn.execute(
            'INSERT INTO users (username, email, role, first_name, last_name, auth_type, password_hash, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['inventory_admin', 'inventory@hospital.com', 'inventory_manager', 'Admin', 'Manager', 'simple_hash', hash, true]
        );
        console.log('✅ Inventory manager created');
    }

    console.log('\nAll users:');
    const [all] = await conn.query('SELECT username, role FROM users ORDER BY username');
    all.forEach(u => console.log(`  ${u.username} - ${u.role}`));

    await conn.end();
}

checkUsers().catch(console.error);
