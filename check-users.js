const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'hospital_management_system'
    });

    // Check receptionist users
    const [receptionists] = await conn.query(
      "SELECT id, username, first_name, role FROM users WHERE role = 'receptionist' LIMIT 3"
    );
    console.log('\n📋 Receptionists:', receptionists);

    // Check patients with user details
    const [patients] = await conn.query(`
      SELECT p.id, u.first_name, u.last_name, u.email, p.blood_group
      FROM patients p
      JOIN users u ON p.user_id = u.id
      LIMIT 5
    `);
    console.log('\n👥 Patients with users:', patients);

    // Check doctors with user details
    const [doctors] = await conn.query(`
      SELECT u.id, u.first_name, u.last_name, u.email, d.specialization
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LIMIT 5
    `);
    console.log('\n👨‍⚕️  Doctors with users:', doctors);

    await conn.end();
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
