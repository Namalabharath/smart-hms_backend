const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'hospital_management_system'
    });

    // Alter the ENUM to add 'simple_hash'
    await conn.query(`ALTER TABLE users MODIFY auth_type ENUM('zkp', 'traditional', 'simple_hash') DEFAULT 'simple_hash'`);
    console.log('✅ auth_type ENUM updated successfully');

    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
