const mysql = require('mysql2/promise');
const crypto = require('crypto');

function hashPassword(password, salt = 'hospital2025') {
  const step1 = crypto.createHash('sha256').update(password).digest('hex');
  const step2 = crypto.createHash('sha256').update(step1 + salt).digest('hex');
  return step2;
}

async function createAdminAndUsers() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'hospital_management_system'
  });

  try {
    console.log('📝 Creating/updating admin and key users...\n');

    // Create admin if not exists
    const adminHash = hashPassword('admin123');
    await conn.query(
      `INSERT INTO users (username, email, role, first_name, last_name, auth_type, password_hash, is_active)
       VALUES ('admin', 'admin@hospital.com', 'admin', 'Admin', 'User', 'simple_hash', ?, 1)
       ON DUPLICATE KEY UPDATE password_hash = ?, auth_type = 'simple_hash'`,
      [adminHash, adminHash]
    );
    console.log('✅ Admin user created/updated');

    // Ensure doctor and patient users exist in database with correct passwords
    const doctor1Hash = hashPassword('Doctor@123');
    const [docUsers] = await conn.query('SELECT id FROM users WHERE username = "doctor1"');
    
    if (docUsers.length > 0) {
      await conn.query(
        'UPDATE users SET password_hash = ?, auth_type = "simple_hash" WHERE username = "doctor1"',
        [doctor1Hash]
      );
      console.log('✅ Doctor user updated');
    }

    const patient1Hash = hashPassword('Patient@123');
    const [patUsers] = await conn.query('SELECT id FROM users WHERE username = "patient1"');
    
    if (patUsers.length > 0) {
      await conn.query(
        'UPDATE users SET password_hash = ?, auth_type = "simple_hash" WHERE username = "patient1"',
        [patient1Hash]
      );
      console.log('✅ Patient user updated');
    }

    console.log('\n✅ All users ready for testing');
    console.log('\nTest Credentials:');
    console.log('  Admin: admin / admin123');
    console.log('  Doctor: doctor1 / Doctor@123');
    console.log('  Patient: patient1 / Patient@123');

    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdminAndUsers();
