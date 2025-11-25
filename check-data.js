const db = require('./config/database');

(async () => {
  try {
    // Check patients
    const [patients] = await db.query('SELECT id, user_id, blood_group FROM patients LIMIT 5');
    console.log(`\n📊 Total Patients: ${patients.length}`);
    if (patients.length > 0) {
      console.log('Sample patients:', patients);
    }

    // Check doctors
    const [doctors] = await db.query('SELECT id, user_id, specialization FROM doctors LIMIT 5');
    console.log(`\n👨‍⚕️  Total Doctors: ${doctors.length}`);
    if (doctors.length > 0) {
      console.log('Sample doctors:', doctors);
    }

    // Check users with roles
    const [users] = await db.query('SELECT id, first_name, last_name, role FROM users LIMIT 10');
    console.log(`\n👤 Total Users: ${users.length}`);
    console.log('Sample users:', users);

    // Check with JOIN
    const [patientsWithUsers] = await db.query(`
      SELECT p.id, u.first_name, u.last_name, p.blood_group
      FROM patients p
      JOIN users u ON p.user_id = u.id
      LIMIT 5
    `);
    console.log(`\n✅ Patients with users: ${patientsWithUsers.length}`);
    console.log(patientsWithUsers);

    const [doctorsWithUsers] = await db.query(`
      SELECT u.id, u.first_name, u.last_name, d.specialization
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LIMIT 5
    `);
    console.log(`\n✅ Doctors with users: ${doctorsWithUsers.length}`);
    console.log(doctorsWithUsers);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
