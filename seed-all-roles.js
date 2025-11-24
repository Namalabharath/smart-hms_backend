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

async function seedAllRoles() {
  const conn = await mysql.createConnection(DB_CONFIG);
  
  try {
    console.log('\n🔐 Creating Test Accounts for All 7 Roles...\n');

    // 1. ADMIN
    console.log('1️⃣  Creating ADMIN...');
    try {
      const adminHash = hashPassword('Admin@123');
      await conn.query(
        `INSERT IGNORE INTO users (username, email, role, first_name, last_name, password_hash, auth_type, is_active) 
         VALUES (?, ?, 'admin', ?, ?, ?, 'simple_hash', TRUE)`,
        ['admin_marcus', 'admin@hospital.local', 'Marcus', 'Admin', adminHash]
      );
      console.log('   ✅ admin_marcus / Admin@123\n');
    } catch (e) {
      console.log('   ⚠️  Admin already exists\n');
    }

    // 2. DOCTOR
    console.log('2️⃣  Creating DOCTOR...');
    try {
      const doctorHash = hashPassword('Doctor@123');
      await conn.query(
        `INSERT IGNORE INTO users (username, email, role, first_name, last_name, password_hash, auth_type, is_active) 
         VALUES (?, ?, 'doctor', ?, ?, ?, 'simple_hash', TRUE)`,
        ['doctor_smith', 'smith@hospital.local', 'Robert', 'Smith', doctorHash]
      );
      console.log('   ✅ doctor_smith / Doctor@123 (Cardiology)\n');
    } catch (e) {
      console.log('   ⚠️  Doctor already exists\n');
    }

    // 3. NURSE
    console.log('3️⃣  Creating NURSE...');
    try {
      const nurseHash = hashPassword('Nurse@123');
      await conn.query(
        `INSERT IGNORE INTO users (username, email, role, first_name, last_name, password_hash, auth_type, is_active) 
         VALUES (?, ?, 'nurse', ?, ?, ?, 'simple_hash', TRUE)`,
        ['nurse_sarah', 'sarah@hospital.local', 'Sarah', 'Miller', nurseHash]
      );
      console.log('   ✅ nurse_sarah / Nurse@123 (ICU)\n');
    } catch (e) {
      console.log('   ⚠️  Nurse already exists\n');
    }

    // 4. PHARMACIST
    console.log('4️⃣  Creating PHARMACIST...');
    try {
      const pharmacistHash = hashPassword('Pharmacist@123');
      await conn.query(
        `INSERT IGNORE INTO users (username, email, role, first_name, last_name, password_hash, auth_type, is_active) 
         VALUES (?, ?, 'pharmacist', ?, ?, ?, 'simple_hash', TRUE)`,
        ['pharmacist_priya', 'priya@hospital.local', 'Priya', 'Sharma', pharmacistHash]
      );
      console.log('   ✅ pharmacist_priya / Pharmacist@123\n');
    } catch (e) {
      console.log('   ⚠️  Pharmacist already exists\n');
    }

    // 5. LAB TECHNICIAN
    console.log('5️⃣  Creating LAB TECHNICIAN...');
    try {
      const labHash = hashPassword('LabTech@123');
      await conn.query(
        `INSERT IGNORE INTO users (username, email, role, first_name, last_name, password_hash, auth_type, is_active) 
         VALUES (?, ?, 'lab_technician', ?, ?, ?, 'simple_hash', TRUE)`,
        ['labtech_raj', 'raj@hospital.local', 'Raj', 'Kumar', labHash]
      );
      console.log('   ✅ labtech_raj / LabTech@123\n');
    } catch (e) {
      console.log('   ⚠️  Lab Technician already exists\n');
    }

    // 6. RECEPTIONIST
    console.log('6️⃣  Creating RECEPTIONIST...');
    try {
      const receptionistHash = hashPassword('Receptionist@123');
      await conn.query(
        `INSERT IGNORE INTO users (username, email, role, first_name, last_name, password_hash, auth_type, is_active) 
         VALUES (?, ?, 'receptionist', ?, ?, ?, 'simple_hash', TRUE)`,
        ['receptionist_priya', 'receptionist@hospital.local', 'Priya', 'Desai', receptionistHash]
      );
      console.log('   ✅ receptionist_priya / Receptionist@123\n');
    } catch (e) {
      console.log('   ⚠️  Receptionist already exists\n');
    }

    // 7. PATIENT
    console.log('7️⃣  Creating PATIENT...');
    try {
      const patientHash = hashPassword('Patient@123');
      await conn.query(
        `INSERT IGNORE INTO users (username, email, role, first_name, last_name, password_hash, auth_type, is_active) 
         VALUES (?, ?, 'patient', ?, ?, ?, 'simple_hash', TRUE)`,
        ['patient_james', 'james@gmail.com', 'James', 'Wilson', patientHash]
      );
      console.log('   ✅ patient_james / Patient@123\n');
    } catch (e) {
      console.log('   ⚠️  Patient already exists\n');
    }

    console.log('═════════════════════════════════════════════');
    console.log('✅ ALL 7 ROLES CREATED SUCCESSFULLY!\n');
    
    console.log('📋 LOGIN CREDENTIALS:\n');
    console.log('1. ADMIN        | admin_marcus        | Admin@123');
    console.log('2. DOCTOR       | doctor_smith        | Doctor@123');
    console.log('3. NURSE        | nurse_sarah         | Nurse@123');
    console.log('4. PHARMACIST   | pharmacist_priya    | Pharmacist@123');
    console.log('5. LAB TECH     | labtech_raj         | LabTech@123');
    console.log('6. RECEPTIONIST | receptionist_priya  | Receptionist@123');
    console.log('7. PATIENT      | patient_james       | Patient@123');
    console.log('\n═════════════════════════════════════════════\n');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await conn.end();
  }
}

seedAllRoles();
