const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'hospital_management_system'
    });

    const [users] = await conn.query(
      "SELECT id, username, password_hash FROM users WHERE username = 'receptionist_priya' LIMIT 1"
    );
    
    if (users.length > 0) {
      console.log('User found:', users[0].username);
      console.log('Password hash length:', users[0].password_hash?.length);
      console.log('Password hash:', users[0].password_hash?.substring(0, 50) + '...');
    } else {
      console.log('User not found');
    }

    await conn.end();
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
