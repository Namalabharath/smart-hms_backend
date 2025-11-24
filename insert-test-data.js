const mysql = require('mysql2/promise');
const crypto = require('crypto');

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'hospital_management_system'
};

// Hash password function
function hashPassword(password, salt = 'hospital2025') {
  const step1 = crypto.createHash('sha256').update(password).digest('hex');
  const step2 = crypto.createHash('sha256').update(step1 + salt).digest('hex');
  return step2;
}

async function insertTestData() {
  const conn = await mysql.createConnection(DB_CONFIG);
  
  try {
    console.log('🔄 Starting to insert comprehensive test data...\n');

    // Clear existing data (keeping auth users)
    console.log('Clearing existing test data...');
    await conn.query('DELETE FROM audit_log');
    await conn.query('DELETE FROM staff_attendance');
    await conn.query('DELETE FROM patient_documents');
    await conn.query('DELETE FROM daily_progress');
    await conn.query('DELETE FROM medication_administration');
    await conn.query('DELETE FROM lab_results');
    await conn.query('DELETE FROM lab_requests');
    await conn.query('DELETE FROM prescriptions');
    await conn.query('DELETE FROM vital_signs');
    await conn.query('DELETE FROM diagnoses');
    await conn.query('DELETE FROM appointments');
    await conn.query('DELETE FROM medications');
    await conn.query('DELETE FROM nurses');
    await conn.query('DELETE FROM doctors');
    await conn.query('DELETE FROM patients');
    console.log('✅ Cleared old data\n');

    // ============================================
    // CREATE PATIENT USERS (keep existing)
    // ============================================
    console.log('📝 Creating patient users...');
    const patients_data = [
      { username: 'patient1', email: 'patient1@hospital.com', password: 'Patient@123' },
      { username: 'patient2', email: 'patient2@hospital.com', password: 'Patient@456' },
      { username: 'patient3', email: 'patient3@hospital.com', password: 'Patient@789' },
      { username: 'patient4', email: 'patient4@hospital.com', password: 'Patient@101' },
      { username: 'patient5', email: 'patient5@hospital.com', password: 'Patient@202' }
    ];

    for (const p of patients_data) {
      const hash = hashPassword(p.password);
      await conn.query(
        `INSERT INTO users (username, email, role, first_name, last_name, auth_type, password_hash, is_active)
         VALUES (?, ?, 'patient', ?, ?, 'simple_hash', ?, 1)
         ON DUPLICATE KEY UPDATE password_hash = ?`,
        [p.username, p.email, p.username.toUpperCase(), 'Patient', hash, hash]
      );
    }
    console.log('✅ Created patient users\n');

    // ============================================
    // CREATE DOCTOR USERS
    // ============================================
    console.log('📝 Creating doctor users...');
    const doctors_data = [
      { username: 'doctor1', email: 'doctor1@hospital.com', password: 'Doctor@123', name: 'Dr. Raj Kumar' },
      { username: 'doctor2', email: 'doctor2@hospital.com', password: 'Doctor@456', name: 'Dr. Priya Singh' },
      { username: 'doctor3', email: 'doctor3@hospital.com', password: 'Doctor@789', name: 'Dr. Amit Sharma' }
    ];

    for (const d of doctors_data) {
      const hash = hashPassword(d.password);
      await conn.query(
        `INSERT INTO users (username, email, role, first_name, last_name, auth_type, password_hash, is_active)
         VALUES (?, ?, 'doctor', ?, ?, 'simple_hash', ?, 1)
         ON DUPLICATE KEY UPDATE password_hash = ?`,
        [d.username, d.email, d.name.split(' ')[0], d.name.split(' ')[1], hash, hash]
      );
    }
    console.log('✅ Created doctor users\n');

    // ============================================
    // CREATE NURSE USERS
    // ============================================
    console.log('📝 Creating nurse users...');
    const nurses_data = [
      { username: 'nurse1', email: 'nurse1@hospital.com', password: 'Nurse@123', name: 'Nurse Sarah' },
      { username: 'nurse2', email: 'nurse2@hospital.com', password: 'Nurse@456', name: 'Nurse Maria' },
      { username: 'nurse3', email: 'nurse3@hospital.com', password: 'Nurse@789', name: 'Nurse John' }
    ];

    for (const n of nurses_data) {
      const hash = hashPassword(n.password);
      await conn.query(
        `INSERT INTO users (username, email, role, first_name, last_name, auth_type, password_hash, is_active)
         VALUES (?, ?, 'nurse', ?, ?, 'simple_hash', ?, 1)
         ON DUPLICATE KEY UPDATE password_hash = ?`,
        [n.username, n.email, n.name.split(' ')[0], n.name.split(' ')[1], hash, hash]
      );
    }
    console.log('✅ Created nurse users\n');

    // Get user IDs
    const [patientsRows] = await conn.query('SELECT id FROM users WHERE role = "patient" ORDER BY id');
    const [doctorsRows] = await conn.query('SELECT id FROM users WHERE role = "doctor" ORDER BY id');
    const [nursesRows] = await conn.query('SELECT id FROM users WHERE role = "nurse" ORDER BY id');

    // ============================================
    // INSERT PATIENT PROFILES
    // ============================================
    console.log('📝 Creating patient profiles...');
    for (let i = 0; i < patientsRows.length; i++) {
      await conn.query(
        `INSERT INTO patients (user_id, date_of_birth, gender, blood_group, phone, address, city, state, postal_code, 
         emergency_contact_name, emergency_contact_phone, medical_history, allergies)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          patientsRows[i].id,
          new Date(1990 + i, 0, 1).toISOString().split('T')[0],
          ['Male', 'Female', 'Other'][i % 3],
          ['O+', 'A+', 'B+', 'AB+'][i % 4],
          `9876543${210 + i}`,
          `${100 + i} Medical Street`,
          'Mumbai',
          'Maharashtra',
          '40000' + i,
          `Emergency Contact ${i + 1}`,
          `9876543${500 + i}`,
          `Patient has history of ${['Diabetes', 'Hypertension', 'Asthma', 'Arthritis'][i % 4]}`,
          `Allergic to ${['Penicillin', 'Peanuts', 'Shellfish', 'Latex'][i % 4]}`
        ]
      );
    }
    console.log('✅ Created patient profiles\n');

    // ============================================
    // INSERT DOCTOR PROFILES
    // ============================================
    console.log('📝 Creating doctor profiles...');
    const specializations = ['Cardiology', 'Orthopedics', 'Neurology'];
    const departments = ['Cardiac Care', 'Orthopedic Surgery', 'Neurology'];
    
    for (let i = 0; i < doctorsRows.length; i++) {
      await conn.query(
        `INSERT INTO doctors (user_id, specialization, license_number, department, phone_extension, available_slots)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          doctorsRows[i].id,
          specializations[i],
          `DOC${1000 + i}`,
          departments[i],
          `${100 + i}`,
          10 + i
        ]
      );
    }
    console.log('✅ Created doctor profiles\n');

    // ============================================
    // INSERT NURSE PROFILES
    // ============================================
    console.log('📝 Creating nurse profiles...');
    const shifts = ['Morning', 'Evening', 'Night'];
    
    for (let i = 0; i < nursesRows.length; i++) {
      await conn.query(
        `INSERT INTO nurses (user_id, license_number, department, shift)
         VALUES (?, ?, ?, ?)`,
        [
          nursesRows[i].id,
          `NUR${1000 + i}`,
          departments[i % 3],
          shifts[i % 3]
        ]
      );
    }
    console.log('✅ Created nurse profiles\n');

    // Get patient, doctor, nurse IDs from their respective tables
    const [patientRows] = await conn.query('SELECT id, user_id FROM patients ORDER BY id');
    const [doctorRows] = await conn.query('SELECT id, user_id FROM doctors ORDER BY id');
    const [nurseRows] = await conn.query('SELECT id, user_id FROM nurses ORDER BY id');

    // ============================================
    // INSERT MEDICATIONS
    // ============================================
    console.log('📝 Creating medications...');
    const medications_data = [
      { name: 'Aspirin', generic: 'Acetylsalicylic Acid', strength: '500mg', form: 'Tablet', manufacturer: 'Pharma Inc', stock: 100, price: 5.50 },
      { name: 'Metformin', generic: 'Metformin', strength: '500mg', form: 'Tablet', manufacturer: 'Diabetes Labs', stock: 150, price: 12.00 },
      { name: 'Lisinopril', generic: 'Lisinopril', strength: '10mg', form: 'Tablet', manufacturer: 'Heart Care', stock: 80, price: 15.75 },
      { name: 'Amoxicillin', generic: 'Amoxicillin', strength: '250mg', form: 'Capsule', manufacturer: 'Anti-Biotics', stock: 200, price: 8.25 },
      { name: 'Omeprazole', generic: 'Omeprazole', strength: '20mg', form: 'Tablet', manufacturer: 'Gastro Care', stock: 120, price: 10.50 }
    ];

    const medIds = [];
    for (const med of medications_data) {
      const [result] = await conn.query(
        `INSERT INTO medications (name, generic_name, strength, form, manufacturer, stock_quantity, reorder_level, price, expiry_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          med.name, med.generic, med.strength, med.form, med.manufacturer, med.stock, 20,
          med.price, new Date(2026, 11, 31).toISOString().split('T')[0]
        ]
      );
      medIds.push(result.insertId);
    }
    console.log('✅ Created medications\n');

    // ============================================
    // INSERT APPOINTMENTS
    // ============================================
    console.log('📝 Creating appointments...');
    const appointmentStates = ['scheduled', 'completed', 'cancelled'];
    for (let i = 0; i < 5; i++) {
      const appointDate = new Date();
      appointDate.setDate(appointDate.getDate() + (i + 1));
      const appointDateStr = appointDate.toISOString().slice(0, 19).replace('T', ' ');
      
      await conn.query(
        `INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason, status, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          patientRows[i % patientRows.length].id,
          doctorRows[i % doctorRows.length].id,
          appointDateStr,
          `Health checkup and consultation - Issue ${i + 1}`,
          appointmentStates[i % 3],
          `Notes for appointment ${i + 1}`
        ]
      );
    }
    console.log('✅ Created appointments\n');

    // ============================================
    // INSERT DIAGNOSES
    // ============================================
    console.log('📝 Creating diagnoses...');
    const diagnoses_data = [
      { name: 'Type 2 Diabetes', icd: 'E11', severity: 'moderate' },
      { name: 'Hypertension', icd: 'I10', severity: 'moderate' },
      { name: 'Migraine', icd: 'G43', severity: 'mild' },
      { name: 'GERD', icd: 'K21', severity: 'mild' },
      { name: 'Pneumonia', icd: 'J18', severity: 'severe' }
    ];

    for (let i = 0; i < 5; i++) {
      await conn.query(
        `INSERT INTO diagnoses (patient_id, doctor_id, diagnosis_name, icd_code, severity, description)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          patientRows[i % patientRows.length].id,
          doctorRows[i % doctorRows.length].id,
          diagnoses_data[i].name,
          diagnoses_data[i].icd,
          diagnoses_data[i].severity,
          `Detailed diagnosis description for ${diagnoses_data[i].name}`
        ]
      );
    }
    console.log('✅ Created diagnoses\n');

    // ============================================
    // INSERT VITAL SIGNS
    // ============================================
    console.log('📝 Creating vital signs...');
    for (let i = 0; i < 8; i++) {
      const recordDate = new Date(Date.now() - i * 86400000).toISOString().slice(0, 19).replace('T', ' ');
      
      await conn.query(
        `INSERT INTO vital_signs (patient_id, nurse_id, temperature, heart_rate, blood_pressure_systolic, 
         blood_pressure_diastolic, oxygen_saturation, glucose_level, weight, height, notes, recorded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          patientRows[i % patientRows.length].id,
          nurseRows[i % nurseRows.length].id,
          98.6 + (Math.random() * 2),
          60 + Math.floor(Math.random() * 40),
          120 + Math.floor(Math.random() * 30),
          80 + Math.floor(Math.random() * 20),
          98 + (Math.random() * 2),
          100 + Math.floor(Math.random() * 100),
          70 + Math.random() * 20,
          170 + Math.random() * 10,
          `Vital signs recorded - Reading ${i + 1}`,
          recordDate
        ]
      );
    }
    console.log('✅ Created vital signs\n');

    // ============================================
    // INSERT PRESCRIPTIONS
    // ============================================
    console.log('📝 Creating prescriptions...');
    for (let i = 0; i < 7; i++) {
      await conn.query(
        `INSERT INTO prescriptions (patient_id, doctor_id, medication_id, dosage, frequency, duration, quantity, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          patientRows[i % patientRows.length].id,
          doctorRows[i % doctorRows.length].id,
          medIds[i % medIds.length],
          '1 tablet',
          'Once daily',
          '7 days',
          7,
          ['pending', 'dispensed'][i % 2],
          `Prescription notes for medication ${i + 1}`
        ]
      );
    }
    console.log('✅ Created prescriptions\n');

    // ============================================
    // INSERT LAB REQUESTS
    // ============================================
    console.log('📝 Creating lab requests...');
    const tests = ['Blood Test', 'X-Ray', 'ECG', 'Ultrasound', 'MRI'];
    for (let i = 0; i < 6; i++) {
      const sampleDate = new Date(Date.now() - i * 86400000).toISOString().slice(0, 19).replace('T', ' ');
      
      await conn.query(
        `INSERT INTO lab_requests (patient_id, doctor_id, test_name, test_type, reason, status, sample_collection_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          patientRows[i % patientRows.length].id,
          doctorRows[i % doctorRows.length].id,
          tests[i % tests.length],
          tests[i % tests.length],
          `Medical reason for ${tests[i % tests.length]}`,
          ['pending', 'sample_collected', 'processing', 'completed'][i % 4],
          sampleDate
        ]
      );
    }
    console.log('✅ Created lab requests\n');

    // ============================================
    // INSERT LAB RESULTS
    // ============================================
    console.log('📝 Creating lab results...');
    const [labReqs] = await conn.query('SELECT id FROM lab_requests LIMIT 4');
    for (let i = 0; i < labReqs.length; i++) {
      await conn.query(
        `INSERT INTO lab_results (lab_request_id, result_status, result_value, reference_range, unit, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          labReqs[i].id,
          ['normal', 'abnormal', 'critical'][i % 3],
          `${100 + i * 5}`,
          `${80 + i * 2} - ${120 + i * 3}`,
          'mg/dL',
          `Lab result notes for result ${i + 1}`
        ]
      );
    }
    console.log('✅ Created lab results\n');

    // ============================================
    // INSERT MEDICATION ADMINISTRATION
    // ============================================
    console.log('📝 Creating medication administration records...');
    const [prescriptions] = await conn.query('SELECT id, patient_id FROM prescriptions LIMIT 5');
    for (let i = 0; i < prescriptions.length; i++) {
      await conn.query(
        `INSERT INTO medication_administration (patient_id, prescription_id, nurse_id, time_administered, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [
          prescriptions[i].patient_id,
          prescriptions[i].id,
          nurseRows[i % nurseRows.length].id,
          `${10 + i}:30:00`,
          `Medication administered at scheduled time - Record ${i + 1}`
        ]
      );
    }
    console.log('✅ Created medication administration records\n');

    // ============================================
    // INSERT DAILY PROGRESS
    // ============================================
    console.log('📝 Creating daily progress records...');
    for (let i = 0; i < 6; i++) {
      await conn.query(
        `INSERT INTO daily_progress (patient_id, nurse_id, progress_date, shift, appetite, sleep_hours, mood, pain_level, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          patientRows[i % patientRows.length].id,
          nurseRows[i % nurseRows.length].id,
          new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
          ['Morning', 'Evening', 'Night'][i % 3],
          ['Good', 'Fair', 'Poor'][i % 3],
          6 + Math.floor(Math.random() * 4),
          ['Happy', 'Normal', 'Sad'][i % 3],
          Math.floor(Math.random() * 10),
          `Patient progress update - Day ${i + 1}`
        ]
      );
    }
    console.log('✅ Created daily progress records\n');

    // ============================================
    // INSERT STAFF ATTENDANCE
    // ============================================
    console.log('📝 Creating staff attendance records...');
    const [allUsers] = await conn.query('SELECT id FROM users WHERE role IN ("doctor", "nurse") LIMIT 8');
    for (let i = 0; i < allUsers.length; i++) {
      await conn.query(
        `INSERT INTO staff_attendance (user_id, attendance_date, status, check_in_time, check_out_time, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          allUsers[i].id,
          new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
          ['present', 'absent', 'leave'][i % 3],
          `0${8 + i}:00:00`,
          `1${6 + i}:00:00`,
          `Attendance record - Entry ${i + 1}`
        ]
      );
    }
    console.log('✅ Created staff attendance records\n');

    // ============================================
    // INSERT AUDIT LOG
    // ============================================
    console.log('📝 Creating audit log entries...');
    const [auditUsers] = await conn.query('SELECT id FROM users LIMIT 5');
    const auditActions = ['INSERT', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN'];
    for (let i = 0; i < 8; i++) {
      await conn.query(
        `INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          auditUsers[i % auditUsers.length].id,
          auditActions[i % auditActions.length],
          ['patient', 'appointment', 'prescription', 'diagnosis'][i % 4],
          1000 + i,
          `Old value for audit entry ${i + 1}`,
          `New value for audit entry ${i + 1}`,
          `192.168.1.${100 + i}`,
          `Mozilla/5.0 User Agent ${i + 1}`
        ]
      );
    }
    console.log('✅ Created audit log entries\n');

    console.log('✅✅✅ DATA INSERTION COMPLETE ✅✅✅\n');
    console.log('📊 Summary of inserted data:');
    console.log(`   ✓ ${patientsRows.length} Patient users created`);
    console.log(`   ✓ ${doctorsRows.length} Doctor users created`);
    console.log(`   ✓ ${nursesRows.length} Nurse users created`);
    console.log(`   ✓ ${patientRows.length} Patient profiles`);
    console.log(`   ✓ ${doctorRows.length} Doctor profiles`);
    console.log(`   ✓ ${nurseRows.length} Nurse profiles`);
    console.log(`   ✓ ${medIds.length} Medications`);
    console.log(`   ✓ 5 Appointments`);
    console.log(`   ✓ 5 Diagnoses`);
    console.log(`   ✓ 8 Vital Signs records`);
    console.log(`   ✓ 7 Prescriptions`);
    console.log(`   ✓ 6 Lab Requests`);
    console.log(`   ✓ Lab Results (for completed tests)`);
    console.log(`   ✓ Medication Administration records`);
    console.log(`   ✓ Daily Progress records`);
    console.log(`   ✓ Staff Attendance records`);
    console.log(`   ✓ Audit Log entries\n`);

  } catch (error) {
    console.error('❌ Error inserting data:', error.message);
  } finally {
    await conn.end();
    process.exit(0);
  }
}

insertTestData();
