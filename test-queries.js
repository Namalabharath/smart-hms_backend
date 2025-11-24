const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'hospital_management_system'
  });
  
  console.log('Testing patient query...');
  const [patients] = await conn.query(
    `SELECT p.id, u.first_name, u.last_name, u.email, p.blood_group, p.date_of_birth, p.gender, p.phone, p.address, p.city, p.postal_code, p.created_at
     FROM patients p
     INNER JOIN users u ON p.user_id = u.id
     ORDER BY p.created_at DESC
     LIMIT 1000`
  );
  console.log('✅ Patients result:', patients.length);
  if (patients.length > 0) console.log('Sample:', patients[0]);
  
  console.log('\nTesting doctor query...');
  const [doctors] = await conn.query(
    `SELECT d.id, d.specialization, d.available_slots, u.first_name, u.last_name, u.email
     FROM doctors d
     JOIN users u ON d.user_id = u.id`
  );
  console.log('✅ Doctors result:', doctors.length);
  if (doctors.length > 0) console.log('Sample:', doctors[0]);
  
  await conn.end();
})();
