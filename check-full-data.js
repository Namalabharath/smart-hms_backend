const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'hospital_management_system'
    });

    // Get ALL patients
    const [allPatients] = await conn.query('SELECT id, user_id FROM patients');
    console.log('\n📊 ALL Patients in table:', allPatients.length);
    console.log(allPatients);

    // Get ALL doctors
    const [allDoctors] = await conn.query('SELECT id, user_id FROM doctors');
    console.log('\n👨‍⚕️  ALL Doctors in table:', allDoctors.length);
    console.log(allDoctors);

    // Get patients with users (exactly like the API does)
    const [patientsWithJoin] = await conn.query(`
      SELECT p.id, u.first_name, u.last_name, u.email, p.blood_group, p.gender, p.phone
      FROM patients p
      JOIN users u ON p.user_id = u.id
      LIMIT 100
    `);
    console.log('\n✅ Patients with JOIN (API query):', patientsWithJoin.length);
    console.log(patientsWithJoin);

    // Get doctors with users (exactly like the API does)
    const [doctorsWithJoin] = await conn.query(`
      SELECT u.id, u.first_name, u.last_name, u.email, d.specialization, d.available_slots
      FROM doctors d
      JOIN users u ON d.user_id = u.id
    `);
    console.log('\n✅ Doctors with JOIN (API query):', doctorsWithJoin.length);
    console.log(doctorsWithJoin);

    await conn.end();
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
