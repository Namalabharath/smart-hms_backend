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

async function insertData() {
  const conn = await mysql.createConnection(DB_CONFIG);
  
  try {
    console.log('\n🌱 Starting comprehensive database seeding...\n');

    // ===== ADMINS =====
    console.log('👨‍💼 Creating Admins...');
    const adminData = [
      { username: 'admin_john', email: 'admin.john@hospital.local', firstName: 'John', lastName: 'Administrator', password: 'Admin@123' },
      { username: 'admin_sarah', email: 'admin.sarah@hospital.local', firstName: 'Sarah', lastName: 'Director', password: 'Admin@456' }
    ];
    
    for (const admin of adminData) {
      const hash = hashPassword(admin.password);
      await conn.query(
        `INSERT IGNORE INTO users (username, email, role, first_name, last_name, auth_type, password_hash, is_active) 
         VALUES (?, ?, 'admin', ?, ?, 'simple_hash', ?, TRUE)`,
        [admin.username, admin.email, admin.firstName, admin.lastName, hash]
      );
      console.log(`  ✅ ${admin.firstName} ${admin.lastName}`);
    }

    // ===== DOCTORS =====
    console.log('\n👨‍⚕️ Creating Doctors...');
    const doctorData = [
      { username: 'doctor_smith', email: 'smith@hospital.local', firstName: 'Robert', lastName: 'Smith', password: 'Doctor@123', spec: 'Cardiology' },
      { username: 'doctor_johnson', email: 'johnson@hospital.local', firstName: 'Emily', lastName: 'Johnson', password: 'Doctor@234', spec: 'Neurology' },
      { username: 'doctor_williams', email: 'williams@hospital.local', firstName: 'Michael', lastName: 'Williams', password: 'Doctor@345', spec: 'Orthopedics' },
      { username: 'doctor_brown', email: 'brown@hospital.local', firstName: 'Lisa', lastName: 'Brown', password: 'Doctor@456', spec: 'Pediatrics' },
      { username: 'doctor_jones', email: 'jones@hospital.local', firstName: 'David', lastName: 'Jones', password: 'Doctor@567', spec: 'Dermatology' }
    ];

    for (const doctor of doctorData) {
      const hash = hashPassword(doctor.password);
      const [userResult] = await conn.query(
        `INSERT IGNORE INTO users (username, email, role, first_name, last_name, auth_type, password_hash, is_active) 
         VALUES (?, ?, 'doctor', ?, ?, 'simple_hash', ?, TRUE)`,
        [doctor.username, doctor.email, doctor.firstName, doctor.lastName, hash]
      );
      
      if (userResult.insertId) {
        await conn.query(
          `INSERT IGNORE INTO doctors (user_id, specialization, available_slots) VALUES (?, ?, 5)`,
          [userResult.insertId, doctor.spec]
        );
      }
      console.log(`  ✅ Dr. ${doctor.firstName} ${doctor.lastName} - ${doctor.spec}`);
    }

    // ===== NURSES =====
    console.log('\n👩‍⚕️ Creating Nurses...');
    const nurseData = [
      { username: 'nurse_sarah', email: 'nurse.sarah@hospital.local', firstName: 'Sarah', lastName: 'Miller', password: 'Nurse@123', dept: 'ICU' },
      { username: 'nurse_anna', email: 'nurse.anna@hospital.local', firstName: 'Anna', lastName: 'Davis', password: 'Nurse@234', dept: 'Emergency' },
      { username: 'nurse_rachel', email: 'nurse.rachel@hospital.local', firstName: 'Rachel', lastName: 'Wilson', password: 'Nurse@345', dept: 'Cardiology' },
      { username: 'nurse_maria', email: 'nurse.maria@hospital.local', firstName: 'Maria', lastName: 'Garcia', password: 'Nurse@456', dept: 'Pediatrics' }
    ];

    for (const nurse of nurseData) {
      const hash = hashPassword(nurse.password);
      const [userResult] = await conn.query(
        `INSERT IGNORE INTO users (username, email, role, first_name, last_name, auth_type, password_hash, is_active) 
         VALUES (?, ?, 'nurse', ?, ?, 'simple_hash', ?, TRUE)`,
        [nurse.username, nurse.email, nurse.firstName, nurse.lastName, hash]
      );
      
      if (userResult.insertId) {
        await conn.query(
          `INSERT IGNORE INTO nurses (user_id, department, shift) VALUES (?, ?, 'Day Shift')`,
          [userResult.insertId, nurse.dept]
        );
      }
      console.log(`  ✅ ${nurse.firstName} ${nurse.lastName} - ${nurse.dept}`);
    }

    // ===== PHARMACISTS =====
    console.log('\n💊 Creating Pharmacists...');
    const pharmacistData = [
      { username: 'pharmacist_john', email: 'pharma.john@hospital.local', firstName: 'John', lastName: 'Martinez', password: 'Pharma@123' },
      { username: 'pharmacist_lisa', email: 'pharma.lisa@hospital.local', firstName: 'Lisa', lastName: 'Anderson', password: 'Pharma@234' }
    ];

    for (const pharmacist of pharmacistData) {
      const hash = hashPassword(pharmacist.password);
      const [userResult] = await conn.query(
        `INSERT IGNORE INTO users (username, email, role, first_name, last_name, auth_type, password_hash, is_active) 
         VALUES (?, ?, 'pharmacist', ?, ?, 'simple_hash', ?, TRUE)`,
        [pharmacist.username, pharmacist.email, pharmacist.firstName, pharmacist.lastName, hash]
      );
      
      // Only try to create pharmacist record if table exists
      try {
        if (userResult.insertId) {
          await conn.query(
            `INSERT IGNORE INTO pharmacists (user_id) VALUES (?)`,
            [userResult.insertId]
          );
        }
      } catch (e) {
        console.log(`  ⚠️  ${pharmacist.firstName} ${pharmacist.lastName} (table not present yet)`);
      }
      console.log(`  ✅ ${pharmacist.firstName} ${pharmacist.lastName}`);
    }

    // ===== LAB TECHNICIANS =====
    console.log('\n🔬 Creating Lab Technicians...');
    const labTechData = [
      { username: 'labtech_mark', email: 'lab.mark@hospital.local', firstName: 'Mark', lastName: 'Taylor', password: 'Lab@123' },
      { username: 'labtech_jennifer', email: 'lab.jennifer@hospital.local', firstName: 'Jennifer', lastName: 'Thomas', password: 'Lab@234' }
    ];

    for (const tech of labTechData) {
      const hash = hashPassword(tech.password);
      const [userResult] = await conn.query(
        `INSERT IGNORE INTO users (username, email, role, first_name, last_name, auth_type, password_hash, is_active) 
         VALUES (?, ?, 'lab_technician', ?, ?, 'simple_hash', ?, TRUE)`,
        [tech.username, tech.email, tech.firstName, tech.lastName, hash]
      );
      
      // Only try to create lab tech record if table exists
      try {
        if (userResult.insertId) {
          await conn.query(
            `INSERT IGNORE INTO lab_technicians (user_id) VALUES (?)`,
            [userResult.insertId]
          );
        }
      } catch (e) {
        console.log(`  ⚠️  ${tech.firstName} ${tech.lastName} (table not present yet)`);
      }
      console.log(`  ✅ ${tech.firstName} ${tech.lastName}`);
    }

    // ===== RECEPTIONISTS =====
    console.log('\n👨‍💼 Creating Receptionists...');
    const receptionistData = [
      { username: 'receptionist_priya', email: 'reception.priya@hospital.local', firstName: 'Priya', lastName: 'Sharma', password: 'Receptionist@123' },
      { username: 'receptionist_kevin', email: 'reception.kevin@hospital.local', firstName: 'Kevin', lastName: 'Chen', password: 'Receptionist@234' }
    ];

    for (const receptionist of receptionistData) {
      const hash = hashPassword(receptionist.password);
      const [userResult] = await conn.query(
        `INSERT IGNORE INTO users (username, email, role, first_name, last_name, auth_type, password_hash, is_active) 
         VALUES (?, ?, 'receptionist', ?, ?, 'simple_hash', ?, TRUE)`,
        [receptionist.username, receptionist.email, receptionist.firstName, receptionist.lastName, hash]
      );
      
      if (userResult.insertId) {
        await conn.query(
          `INSERT IGNORE INTO receptionists (user_id) VALUES (?)`,
          [userResult.insertId]
        );
      }
      console.log(`  ✅ ${receptionist.firstName} ${receptionist.lastName}`);
    }

    // ===== PATIENTS =====
    console.log('\n🧑‍🤝‍🧑 Creating Patients...');
    const patientData = [
      { username: 'patient_james', email: 'james@gmail.com', firstName: 'James', lastName: 'Wilson', password: 'Patient@123', dob: '1990-05-15', blood: 'O+', gender: 'Male' },
      { username: 'patient_mary', email: 'mary@gmail.com', firstName: 'Mary', lastName: 'Harris', password: 'Patient@234', dob: '1985-08-22', blood: 'A+', gender: 'Female' },
      { username: 'patient_robert', email: 'robert@gmail.com', firstName: 'Robert', lastName: 'Clark', password: 'Patient@345', dob: '1992-03-10', blood: 'B+', gender: 'Male' },
      { username: 'patient_susan', email: 'susan@gmail.com', firstName: 'Susan', lastName: 'Lewis', password: 'Patient@456', dob: '1988-11-07', blood: 'AB+', gender: 'Female' },
      { username: 'patient_william', email: 'william@gmail.com', firstName: 'William', lastName: 'Walker', password: 'Patient@567', dob: '1995-02-18', blood: 'O-', gender: 'Male' },
      { username: 'patient_patricia', email: 'patricia@gmail.com', firstName: 'Patricia', lastName: 'Hall', password: 'Patient@678', dob: '1987-09-25', blood: 'A-', gender: 'Female' },
      { username: 'patient_michael', email: 'michael@gmail.com', firstName: 'Michael', lastName: 'Young', password: 'Patient@789', dob: '1993-06-12', blood: 'B-', gender: 'Male' },
      { username: 'patient_linda', email: 'linda@gmail.com', firstName: 'Linda', lastName: 'King', password: 'Patient@890', dob: '1991-01-30', blood: 'AB-', gender: 'Female' },
      { username: 'patient_david', email: 'david@gmail.com', firstName: 'David', lastName: 'Wright', password: 'Patient@901', dob: '1986-12-05', blood: 'O+', gender: 'Male' },
      { username: 'patient_barbara', email: 'barbara@gmail.com', firstName: 'Barbara', lastName: 'Lopez', password: 'Patient@012', dob: '1989-04-14', blood: 'A+', gender: 'Female' }
    ];

    const patientIds = [];
    for (const patient of patientData) {
      const hash = hashPassword(patient.password);
      const [userResult] = await conn.query(
        `INSERT IGNORE INTO users (username, email, role, first_name, last_name, auth_type, password_hash, is_active) 
         VALUES (?, ?, 'patient', ?, ?, 'simple_hash', ?, TRUE)`,
        [patient.username, patient.email, patient.firstName, patient.lastName, hash]
      );
      
      if (userResult.insertId) {
        patientIds.push(userResult.insertId);
        await conn.query(
          `INSERT IGNORE INTO patients (user_id, date_of_birth, gender, blood_group, phone, address, city, postal_code, medical_history, allergies, emergency_contact_name, emergency_contact_phone) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userResult.insertId, patient.dob, patient.gender, patient.blood, '555-' + Math.random().toString().slice(2, 6), 
           '123 Main St', 'New York', '10001', 'Hypertension', 'Penicillin', 'John Doe', '555-0000']
        );
      } else {
        const [existing] = await conn.query(
          `SELECT u.id FROM users u JOIN patients p ON u.id = p.user_id WHERE u.username = ?`,
          [patient.username]
        );
        if (existing.length > 0) {
          patientIds.push(existing[0].id);
        }
      }
      console.log(`  ✅ ${patient.firstName} ${patient.lastName}`);
    }

    console.log('\n📊 Seeding Summary:');
    console.log(`  ✅ 2 Admins`);
    console.log(`  ✅ 5 Doctors`);
    console.log(`  ✅ 4 Nurses`);
    console.log(`  ✅ 2 Pharmacists`);
    console.log(`  ✅ 2 Lab Technicians`);
    console.log(`  ✅ 2 Receptionists`);
    console.log(`  ✅ 10 Patients`);
    console.log('\n🔐 Test Accounts:');
    console.log(`  • Admin: admin_john / Admin@123`);
    console.log(`  • Doctor: doctor_smith / Doctor@123`);
    console.log(`  • Nurse: nurse_sarah / Nurse@123`);
    console.log(`  • Pharmacist: pharmacist_john / Pharma@123`);
    console.log(`  • Lab Tech: labtech_mark / Lab@123`);
    console.log(`  • Receptionist: receptionist_priya / Receptionist@123`);
    console.log(`  • Patient: patient_james / Patient@123\n`);

    console.log('✅ Database seeding completed!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await conn.end();
  }
}

insertData();
