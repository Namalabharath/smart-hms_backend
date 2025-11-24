const mysql = require('mysql2/promise');
const crypto = require('crypto');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'hospital_management_system'
    });

    const [users] = await conn.query('SELECT username, password_hash FROM users WHERE username IN (?, ?, ?)', 
      ['patient1', 'doctor1', 'admin']);

    console.log('Checking password hashes...\n');

    for (const user of users) {
      const testPasswords = {
        'patient1': 'Patient@100',
        'doctor1': 'Doctor@100',
        'admin': 'admin123'
      };

      const testPass = testPasswords[user.username];
      if (!testPass) continue;

      const step1 = crypto.createHash('sha256').update(testPass).digest('hex');
      const computedHash = crypto.createHash('sha256').update(step1 + 'hospital2025').digest('hex');
      
      const matches = computedHash === user.password_hash;
      console.log(`${user.username}:`);
      console.log(`  Password: ${testPass}`);
      console.log(`  Stored:   ${user.password_hash.substring(0, 30)}...`);
      console.log(`  Computed: ${computedHash.substring(0, 30)}...`);
      console.log(`  Match: ${matches ? '✅ YES' : '❌ NO'}\n`);
    }

    await conn.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
