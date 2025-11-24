const mysql = require('mysql2/promise');
const crypto = require('crypto');

function hashPassword(password, salt = 'hospital2025') {
  const step1 = crypto.createHash('sha256').update(password).digest('hex');
  const step2 = crypto.createHash('sha256').update(step1 + salt).digest('hex');
  return step2;
}

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'hospital_management_system'
    });

    console.log('🔐 Setting up test credentials...\n');

    // Update admin
    let hash = hashPassword('admin123');
    await conn.query('UPDATE users SET password_hash = ?, auth_type = "simple_hash" WHERE username = ?',
      [hash, 'admin']);
    console.log('✅ admin / admin123');

    // Update testuser
    hash = hashPassword('Test@123456');
    await conn.query('UPDATE users SET password_hash = ?, auth_type = "simple_hash" WHERE username = ?',
      [hash, 'testuser']);
    console.log('✅ testuser / Test@123456');

    // Update patient users
    for (let i = 1; i <= 5; i++) {
      hash = hashPassword(`Patient@${i}00`);
      await conn.query('UPDATE users SET password_hash = ?, auth_type = "simple_hash" WHERE username = ?',
        [hash, `patient${i}`]);
      console.log(`✅ patient${i} / Patient@${i}00`);
    }

    // Update doctor users
    for (let i = 1; i <= 3; i++) {
      hash = hashPassword(`Doctor@${i}00`);
      await conn.query('UPDATE users SET password_hash = ?, auth_type = "simple_hash" WHERE username = ?',
        [hash, `doctor${i}`]);
      console.log(`✅ doctor${i} / Doctor@${i}00`);
    }

    // Update nurse users
    for (let i = 1; i <= 3; i++) {
      hash = hashPassword(`Nurse@${i}00`);
      await conn.query('UPDATE users SET password_hash = ?, auth_type = "simple_hash" WHERE username = ?',
        [hash, `nurse${i}`]);
      console.log(`✅ nurse${i} / Nurse@${i}00`);
    }

    console.log('\n✅ All credentials updated!\n');
    console.log('Test with:');
    console.log('  admin / admin123');
    console.log('  patient1 / Patient@100');
    console.log('  doctor1 / Doctor@100');
    console.log('  nurse1 / Nurse@100\n');

    await conn.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
