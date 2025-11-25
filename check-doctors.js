const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'hospital_management_system'
    });

    console.log('\n=== DOCTORS TABLE ===');
    const [doctors] = await conn.query('SELECT id, user_id, specialization FROM doctors');
    console.log('Doctor IDs:', doctors.map(d => d.id));
    console.log(doctors);

    console.log('\n=== USERS (doctors) ===');
    const [users] = await conn.query("SELECT id, username, first_name, role FROM users WHERE role = 'doctor'");
    console.log(users);

    await conn.end();
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
