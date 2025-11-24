const mysql = require('mysql2/promise');
const crypto = require('crypto');

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'hospital_management_system'
};

function hashPassword(password, salt = 'hospital2025') {
  const step1 = crypto.createHash('sha256').update(password).digest('hex');
  const step2 = crypto.createHash('sha256').update(step1 + salt).digest('hex');
  return step2;
}

async function seedDatabase() {
  const conn = await mysql.createConnection(DB_CONFIG);
  
  try {
    console.log('\n🌱 Seeding Database with Sample Data...\n');

    // Create test users and patient data
    console.log('👥 Creating 10 Test Patients...');
    const patientData = [
      { username: 'patient_james', email: 'james@gmail.com', name: 'James Wilson', dob: '1990-05-15', blood: 'O+', gender: 'Male' },
      { username: 'patient_mary', email: 'mary@gmail.com', name: 'Mary Harris', dob: '1985-08-22', blood: 'A+', gender: 'Female' },
      { username: 'patient_robert', email: 'robert@gmail.com', name: 'Robert Clark', dob: '1992-03-10', blood: 'B+', gender: 'Male' },
      { username: 'patient_susan', email: 'susan@gmail.com', name: 'Susan Lewis', dob: '1988-11-07', blood: 'AB+', gender: 'Female' },
      { username: 'patient_william', email: 'william@gmail.com', name: 'William Walker', dob: '1995-02-18', blood: 'O-', gender: 'Male' },
      { username: 'patient_patricia', email: 'patricia@gmail.com', name: 'Patricia Hall', dob: '1987-09-25', blood: 'A-', gender: 'Female' },
      { username: 'patient_michael', email: 'michael@gmail.com', name: 'Michael Young', dob: '1993-06-12', blood: 'B-', gender: 'Male' },
      { username: 'patient_linda', email: 'linda@gmail.com', name: 'Linda King', dob: '1991-01-30', blood: 'AB-', gender: 'Female' },
      { username: 'patient_david', email: 'david@gmail.com', name: 'David Wright', dob: '1986-12-05', blood: 'O+', gender: 'Male' },
      { username: 'patient_barbara', email: 'barbara@gmail.com', name: 'Barbara Lopez', dob: '1989-04-14', blood: 'A+', gender: 'Female' }
    ];

    const patientIds = [];
    for (const patient of patientData) {
      const [names] = patient.name.split(' ');
      const lastName = patient.name.split(' ')[1];
      const hash = hashPassword('Patient@123');
      
      try {
        const [result] = await conn.query(
          `INSERT INTO users (username, email, role, first_name, last_name, password_hash, auth_type, is_active) 
           VALUES (?, ?, 'patient', ?, ?, ?, 'simple_hash', TRUE)`,
          [patient.username, patient.email, patient.name.split(' ')[0], lastName, hash]
        );

        if (result.insertId) {
          patientIds.push(result.insertId);
          
          await conn.query(
            `INSERT INTO patients (user_id, date_of_birth, gender, blood_group, phone, address, city, postal_code, medical_history, allergies, emergency_contact_name, emergency_contact_phone) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [result.insertId, patient.dob, patient.gender, patient.blood, '555-' + Math.floor(Math.random() * 10000), 
             '123 Main St', 'New York', '10001', 'Medical history available', 'Penicillin', 'Emergency Contact', '555-0000']
          );
          console.log(`  ✅ ${patient.name}`);
        }
      } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') {
          console.log(`  ⚠️  ${patient.name} (already exists)`);
        }
      }
    }

    // Create doctors and appointments
    console.log('\n👨‍⚕️ Creating 5 Doctors...');
    const doctorData = [
      { username: 'doctor_smith', email: 'smith@hospital.local', name: 'Robert Smith', spec: 'Cardiology' },
      { username: 'doctor_johnson', email: 'johnson@hospital.local', name: 'Emily Johnson', spec: 'Neurology' },
      { username: 'doctor_williams', email: 'williams@hospital.local', name: 'Michael Williams', spec: 'Orthopedics' },
      { username: 'doctor_brown', email: 'brown@hospital.local', name: 'Lisa Brown', spec: 'Pediatrics' },
      { username: 'doctor_jones', email: 'jones@hospital.local', name: 'David Jones', spec: 'Dermatology' }
    ];

    const doctorIds = [];
    for (const doctor of doctorData) {
      const [firstName, lastName] = doctor.name.split(' ');
      const hash = hashPassword('Doctor@123');
      
      try {
        const [result] = await conn.query(
          `INSERT INTO users (username, email, role, first_name, last_name, password_hash, auth_type, is_active) 
           VALUES (?, ?, 'doctor', ?, ?, ?, 'simple_hash', TRUE)`,
          [doctor.username, doctor.email, firstName, lastName, hash]
        );

        if (result.insertId) {
          doctorIds.push(result.insertId);
          
          await conn.query(
            `INSERT INTO doctors (user_id, specialization, available_slots) 
             VALUES (?, ?, 5)`,
            [result.insertId, doctor.spec]
          );
          console.log(`  ✅ Dr. ${doctor.name} - ${doctor.spec}`);
        }
      } catch (e) {
        if (e.code !== 'ER_DUP_ENTRY') {
          console.log(`  ⚠️  Dr. ${doctor.name} (already exists)`);
        }
      }
    }

    // Create nurses
    console.log('\n👩‍⚕️ Creating 4 Nurses...');
    const nurseData = [
      { username: 'nurse_sarah', email: 'nurse.sarah@hospital.local', name: 'Sarah Miller', dept: 'ICU' },
      { username: 'nurse_anna', email: 'nurse.anna@hospital.local', name: 'Anna Davis', dept: 'Emergency' },
      { username: 'nurse_rachel', email: 'nurse.rachel@hospital.local', name: 'Rachel Wilson', dept: 'Cardiology' },
      { username: 'nurse_maria', email: 'nurse.maria@hospital.local', name: 'Maria Garcia', dept: 'Pediatrics' }
    ];

    const nurseIds = [];
    for (const nurse of nurseData) {
      const [firstName, lastName] = nurse.name.split(' ');
      const hash = hashPassword('Nurse@123');
      
      try {
        const [result] = await conn.query(
          `INSERT INTO users (username, email, role, first_name, last_name, password_hash, auth_type, is_active) 
           VALUES (?, ?, 'nurse', ?, ?, ?, 'simple_hash', TRUE)`,
          [nurse.username, nurse.email, firstName, lastName, hash]
        );

        if (result.insertId) {
          nurseIds.push(result.insertId);
          
          await conn.query(
            `INSERT INTO nurses (user_id, department, shift) 
             VALUES (?, ?, 'Day Shift')`,
            [result.insertId, nurse.dept]
          );
          console.log(`  ✅ ${nurse.name} - ${nurse.dept}`);
        }
      } catch (e) {
        if (e.code !== 'ER_DUP_ENTRY') {
          console.log(`  ⚠️  ${nurse.name} (already exists)`);
        }
      }
    }

    // Create appointments
    console.log('\n📅 Creating 10 Appointments...');
    for (let i = 0; i < 10 && i < patientIds.length && i < doctorIds.length; i++) {
      const date = new Date();
      date.setDate(date.getDate() + (i + 1));
      const dateStr = date.toISOString().slice(0, 10) + ' 10:00:00';
      
      try {
        await conn.query(
          `INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason, status) 
           VALUES (?, ?, ?, ?, ?)`,
          [patientIds[i], doctorIds[i % doctorIds.length], dateStr, 'General Checkup', 'scheduled']
        );
        console.log(`  ✅ Appointment ${i + 1}`);
      } catch (e) {
        console.log(`  ⚠️  Appointment ${i + 1} (error)`);
      }
    }

    console.log('\n✅ Database seeding completed!\n');
    console.log('📊 Summary:');
    console.log(`  • 10 Patients created`);
    console.log(`  • 5 Doctors created`);
    console.log(`  • 4 Nurses created`);
    console.log(`  • 10 Appointments created\n`);
    console.log('🔐 Test Accounts:');
    console.log(`  • Patient: patient_james / Patient@123`);
    console.log(`  • Doctor: doctor_smith / Doctor@123`);
    console.log(`  • Nurse: nurse_sarah / Nurse@123\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await conn.end();
  }
}

seedDatabase();
