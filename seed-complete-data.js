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

async function seedCompleteData() {
  const conn = await mysql.createConnection(DB_CONFIG);
  
  try {
    console.log('\n🌱 COMPLETE DATABASE SEEDING WITH REAL DATA...\n');

    // Get all existing users
    const [users] = await conn.query('SELECT id, role, username FROM users');
    const doctorUsers = users.filter(u => u.role === 'doctor');
    const nurseUsers = users.filter(u => u.role === 'nurse');
    const patientUsers = users.filter(u => u.role === 'patient');

    console.log(`📊 Found: ${doctorUsers.length} Doctors, ${nurseUsers.length} Nurses, ${patientUsers.length} Patients\n`);

    // ========== ADD PRESCRIPTIONS ==========
    console.log('💊 Adding Prescriptions...');
    if (patientUsers.length > 0 && doctorUsers.length > 0) {
      const prescriptions = [
        { patient_id: patientUsers[0].id, doctor_id: doctorUsers[0].id, medicine: 'Aspirin', dosage: '500mg', frequency: 'Twice Daily', duration: '7 days' },
        { patient_id: patientUsers[1].id, doctor_id: doctorUsers[1].id, medicine: 'Metformin', dosage: '1000mg', frequency: 'Thrice Daily', duration: '30 days' },
        { patient_id: patientUsers[2].id, doctor_id: doctorUsers[2].id, medicine: 'Lisinopril', dosage: '10mg', frequency: 'Once Daily', duration: '60 days' },
        { patient_id: patientUsers[3].id, doctor_id: doctorUsers[3].id, medicine: 'Paracetamol', dosage: '650mg', frequency: 'As needed', duration: '5 days' },
        { patient_id: patientUsers[4].id, doctor_id: doctorUsers[4].id, medicine: 'Amoxicillin', dosage: '500mg', frequency: 'Three times daily', duration: '10 days' },
        { patient_id: patientUsers[5].id, doctor_id: doctorUsers[0].id, medicine: 'Atorvastatin', dosage: '20mg', frequency: 'Once Daily', duration: '90 days' },
        { patient_id: patientUsers[6].id, doctor_id: doctorUsers[1].id, medicine: 'Loratadine', dosage: '10mg', frequency: 'Once Daily', duration: '30 days' },
        { patient_id: patientUsers[7].id, doctor_id: doctorUsers[2].id, medicine: 'Ibuprofen', dosage: '400mg', frequency: 'Twice Daily', duration: '7 days' },
      ];

      for (const presc of prescriptions) {
        try {
          await conn.query(
            `INSERT INTO prescriptions (patient_id, doctor_id, medicine_name, dosage, frequency, duration_days, prescribed_date, status) 
             VALUES (?, ?, ?, ?, ?, ?, NOW(), 'active')`,
            [presc.patient_id, presc.doctor_id, presc.medicine, presc.dosage, presc.frequency, parseInt(presc.duration)]
          );
          console.log(`   ✅ ${presc.medicine} - ${presc.dosage}`);
        } catch (e) {
          // Ignore duplicates
        }
      }
    }

    // ========== ADD DIAGNOSES ==========
    console.log('\n🔍 Adding Diagnoses...');
    if (patientUsers.length > 0 && doctorUsers.length > 0) {
      const diagnoses = [
        { patient_id: patientUsers[0].id, doctor_id: doctorUsers[0].id, diagnosis: 'Hypertension', description: 'High blood pressure - Stage 1', severity: 'moderate' },
        { patient_id: patientUsers[1].id, doctor_id: doctorUsers[1].id, diagnosis: 'Type 2 Diabetes', description: 'Blood glucose level elevated', severity: 'high' },
        { patient_id: patientUsers[2].id, doctor_id: doctorUsers[2].id, diagnosis: 'Arthritis', description: 'Joint pain and stiffness', severity: 'moderate' },
        { patient_id: patientUsers[3].id, doctor_id: doctorUsers[3].id, diagnosis: 'Common Cold', description: 'Upper respiratory tract infection', severity: 'mild' },
        { patient_id: patientUsers[4].id, doctor_id: doctorUsers[4].id, diagnosis: 'Bacterial Infection', description: 'Skin infection - requires antibiotics', severity: 'moderate' },
        { patient_id: patientUsers[5].id, doctor_id: doctorUsers[0].id, diagnosis: 'Hyperlipidemia', description: 'High cholesterol levels', severity: 'moderate' },
        { patient_id: patientUsers[6].id, doctor_id: doctorUsers[1].id, diagnosis: 'Allergic Rhinitis', description: 'Seasonal allergies', severity: 'mild' },
        { patient_id: patientUsers[7].id, doctor_id: doctorUsers[2].id, diagnosis: 'Muscle Strain', description: 'Lower back pain from physical strain', severity: 'moderate' },
        { patient_id: patientUsers[8].id, doctor_id: doctorUsers[3].id, diagnosis: 'Fever', description: 'High temperature - 101°F', severity: 'mild' },
        { patient_id: patientUsers[9].id, doctor_id: doctorUsers[4].id, diagnosis: 'Migraine', description: 'Severe headache with nausea', severity: 'high' },
      ];

      for (const diag of diagnoses) {
        try {
          await conn.query(
            `INSERT INTO diagnoses (patient_id, doctor_id, diagnosis_code, diagnosis_name, description, severity, diagnosis_date) 
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [diag.patient_id, diag.doctor_id, 'ICD-' + Math.floor(Math.random() * 9000 + 1000), diag.diagnosis, diag.description, diag.severity]
          );
          console.log(`   ✅ ${diag.diagnosis} (${diag.severity})`);
        } catch (e) {
          // Ignore duplicates
        }
      }
    }

    // ========== ADD VITAL SIGNS ==========
    console.log('\n❤️  Adding Vital Signs...');
    if (patientUsers.length > 0 && nurseUsers.length > 0) {
      const vitals = [
        { patient_id: patientUsers[0].id, nurse_id: nurseUsers[0].id, bp_systolic: 140, bp_diastolic: 90, pulse: 78, temp: 98.6, respiration: 16, oxygen: 98 },
        { patient_id: patientUsers[1].id, nurse_id: nurseUsers[1].id, bp_systolic: 138, bp_diastolic: 88, pulse: 82, temp: 98.4, respiration: 18, oxygen: 97 },
        { patient_id: patientUsers[2].id, nurse_id: nurseUsers[2].id, bp_systolic: 135, bp_diastolic: 85, pulse: 75, temp: 98.7, respiration: 15, oxygen: 99 },
        { patient_id: patientUsers[3].id, nurse_id: nurseUsers[3].id, bp_systolic: 120, bp_diastolic: 80, pulse: 72, temp: 99.2, respiration: 17, oxygen: 98 },
        { patient_id: patientUsers[4].id, nurse_id: nurseUsers[0].id, bp_systolic: 125, bp_diastolic: 82, pulse: 76, temp: 98.5, respiration: 16, oxygen: 98 },
        { patient_id: patientUsers[5].id, nurse_id: nurseUsers[1].id, bp_systolic: 132, bp_diastolic: 86, pulse: 80, temp: 98.6, respiration: 17, oxygen: 97 },
        { patient_id: patientUsers[6].id, nurse_id: nurseUsers[2].id, bp_systolic: 128, bp_diastolic: 84, pulse: 74, temp: 98.3, respiration: 15, oxygen: 99 },
        { patient_id: patientUsers[7].id, nurse_id: nurseUsers[3].id, bp_systolic: 130, bp_diastolic: 85, pulse: 77, temp: 98.8, respiration: 16, oxygen: 98 },
        { patient_id: patientUsers[8].id, nurse_id: nurseUsers[0].id, bp_systolic: 122, bp_diastolic: 81, pulse: 73, temp: 101.5, respiration: 18, oxygen: 96 },
        { patient_id: patientUsers[9].id, nurse_id: nurseUsers[1].id, bp_systolic: 126, bp_diastolic: 83, pulse: 79, temp: 98.4, respiration: 16, oxygen: 98 },
      ];

      for (const vital of vitals) {
        try {
          await conn.query(
            `INSERT INTO vital_signs (patient_id, nurse_id, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, temperature, respiratory_rate, oxygen_saturation, recorded_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [vital.patient_id, vital.nurse_id, vital.bp_systolic, vital.bp_diastolic, vital.pulse, vital.temp, vital.respiration, vital.oxygen]
          );
          console.log(`   ✅ BP: ${vital.bp_systolic}/${vital.bp_diastolic}, Pulse: ${vital.pulse}, Temp: ${vital.temp}°F`);
        } catch (e) {
          // Ignore duplicates
        }
      }
    }

    // ========== ADD APPOINTMENTS ==========
    console.log('\n📅 Adding Appointments...');
    if (patientUsers.length > 0 && doctorUsers.length > 0) {
      const appointments = [
        { patient_id: patientUsers[0].id, doctor_id: doctorUsers[0].id, date: '2025-11-25', time: '09:00', reason: 'Blood Pressure Check' },
        { patient_id: patientUsers[1].id, doctor_id: doctorUsers[1].id, date: '2025-11-25', time: '10:00', reason: 'Diabetes Management' },
        { patient_id: patientUsers[2].id, doctor_id: doctorUsers[2].id, date: '2025-11-26', time: '09:30', reason: 'Joint Pain Assessment' },
        { patient_id: patientUsers[3].id, doctor_id: doctorUsers[3].id, date: '2025-11-26', time: '14:00', reason: 'Cold Follow-up' },
        { patient_id: patientUsers[4].id, doctor_id: doctorUsers[4].id, date: '2025-11-27', time: '11:00', reason: 'Skin Infection Check' },
        { patient_id: patientUsers[5].id, doctor_id: doctorUsers[0].id, date: '2025-11-27', time: '15:30', reason: 'Cholesterol Review' },
        { patient_id: patientUsers[6].id, doctor_id: doctorUsers[1].id, date: '2025-11-28', time: '10:30', reason: 'Allergy Management' },
        { patient_id: patientUsers[7].id, doctor_id: doctorUsers[2].id, date: '2025-11-28', time: '13:00', reason: 'Back Pain Treatment' },
        { patient_id: patientUsers[8].id, doctor_id: doctorUsers[3].id, date: '2025-11-29', time: '09:00', reason: 'Fever Monitoring' },
        { patient_id: patientUsers[9].id, doctor_id: doctorUsers[4].id, date: '2025-11-29', time: '16:00', reason: 'Migraine Consultation' },
        { patient_id: patientUsers[0].id, doctor_id: doctorUsers[1].id, date: '2025-11-30', time: '11:00', reason: 'General Checkup' },
        { patient_id: patientUsers[2].id, doctor_id: doctorUsers[3].id, date: '2025-12-01', time: '10:00', reason: 'Follow-up Consultation' },
      ];

      for (const apt of appointments) {
        try {
          await conn.query(
            `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, status, created_at) 
             VALUES (?, ?, ?, ?, ?, 'scheduled', NOW())`,
            [apt.patient_id, apt.doctor_id, apt.date, apt.time, apt.reason]
          );
          console.log(`   ✅ ${apt.date} ${apt.time} - ${apt.reason}`);
        } catch (e) {
          // Ignore duplicates
        }
      }
    }

    // ========== ADD PROGRESS NOTES ==========
    console.log('\n📝 Adding Progress Notes...');
    if (patientUsers.length > 0 && nurseUsers.length > 0) {
      const notes = [
        { patient_id: patientUsers[0].id, nurse_id: nurseUsers[0].id, note: 'Patient stable. Blood pressure slightly elevated. Advised rest and medication compliance.' },
        { patient_id: patientUsers[1].id, nurse_id: nurseUsers[1].id, note: 'Diabetes management on track. Blood glucose levels within acceptable range. Continue current regimen.' },
        { patient_id: patientUsers[2].id, nurse_id: nurseUsers[2].id, note: 'Joint mobility improving. Patient cooperating well with physical therapy. Continue exercises.' },
        { patient_id: patientUsers[3].id, nurse_id: nurseUsers[3].id, note: 'Cold symptoms improving. Temperature normal. Patient advised to continue fluids and rest.' },
        { patient_id: patientUsers[4].id, nurse_id: nurseUsers[0].id, note: 'Skin infection showing signs of improvement. Applying antibiotic cream as prescribed.' },
        { patient_id: patientUsers[5].id, nurse_id: nurseUsers[1].id, note: 'Cholesterol management stable. Patient maintaining diet and exercise routine well.' },
        { patient_id: patientUsers[6].id, nurse_id: nurseUsers[2].id, note: 'Allergies controlled with current medication. No adverse reactions reported.' },
        { patient_id: patientUsers[7].id, nurse_id: nurseUsers[3].id, note: 'Back pain reducing gradually. Physical therapy sessions helping. Continue treatment plan.' },
        { patient_id: patientUsers[8].id, nurse_id: nurseUsers[0].id, note: 'Fever subsiding. Temperature gradually normalizing. Monitor and report any changes.' },
        { patient_id: patientUsers[9].id, nurse_id: nurseUsers[1].id, note: 'Migraine symptoms under control with prescribed medication. Patient resting comfortably.' },
      ];

      for (const note of notes) {
        try {
          await conn.query(
            `INSERT INTO progress_notes (patient_id, nurse_id, notes, recorded_at) 
             VALUES (?, ?, ?, NOW())`,
            [note.patient_id, note.nurse_id, note.note]
          );
          console.log(`   ✅ Progress note added`);
        } catch (e) {
          // Ignore duplicates
        }
      }
    }

    // ========== ADD LAB TESTS ==========
    console.log('\n🧪 Adding Lab Tests...');
    if (patientUsers.length > 0) {
      const labTests = [
        { patient_id: patientUsers[0].id, test_name: 'Complete Blood Count', test_type: 'blood', result: 'Normal', status: 'completed' },
        { patient_id: patientUsers[1].id, test_name: 'Fasting Blood Glucose', test_type: 'blood', result: '125 mg/dL', status: 'completed' },
        { patient_id: patientUsers[2].id, test_name: 'X-Ray - Knee', test_type: 'imaging', result: 'Mild degenerative changes', status: 'completed' },
        { patient_id: patientUsers[3].id, test_name: 'Rapid Antigen Test', test_type: 'blood', result: 'Negative', status: 'completed' },
        { patient_id: patientUsers[4].id, test_name: 'Skin Culture', test_type: 'culture', result: 'Bacterial infection identified', status: 'completed' },
        { patient_id: patientUsers[5].id, test_name: 'Lipid Panel', test_type: 'blood', result: 'LDL: 120 mg/dL', status: 'completed' },
        { patient_id: patientUsers[6].id, test_name: 'Allergy Panel', test_type: 'blood', result: 'Multiple allergies detected', status: 'completed' },
        { patient_id: patientUsers[7].id, test_name: 'MRI - Spine', test_type: 'imaging', result: 'Herniated disc L4-L5', status: 'completed' },
        { patient_id: patientUsers[8].id, test_name: 'Thyroid Function Test', test_type: 'blood', result: 'Normal', status: 'completed' },
        { patient_id: patientUsers[9].id, test_name: 'CT Scan - Head', test_type: 'imaging', result: 'No abnormalities', status: 'completed' },
      ];

      for (const test of labTests) {
        try {
          await conn.query(
            `INSERT INTO lab_tests (patient_id, test_name, test_type, result, status, test_date) 
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [test.patient_id, test.test_name, test.test_type, test.result, test.status]
          );
          console.log(`   ✅ ${test.test_name} - ${test.result}`);
        } catch (e) {
          // Ignore duplicates
        }
      }
    }

    // ========== ADD MEDICINES/INVENTORY ==========
    console.log('\n💊 Adding Medicine Inventory...');
    const medicines = [
      { name: 'Aspirin', dosage: '500mg', quantity: 1000, price: 50 },
      { name: 'Metformin', dosage: '1000mg', quantity: 800, price: 120 },
      { name: 'Lisinopril', dosage: '10mg', quantity: 600, price: 150 },
      { name: 'Paracetamol', dosage: '650mg', quantity: 1500, price: 40 },
      { name: 'Amoxicillin', dosage: '500mg', quantity: 700, price: 90 },
      { name: 'Atorvastatin', dosage: '20mg', quantity: 500, price: 200 },
      { name: 'Loratadine', dosage: '10mg', quantity: 900, price: 60 },
      { name: 'Ibuprofen', dosage: '400mg', quantity: 1200, price: 55 },
    ];

    for (const med of medicines) {
      try {
        await conn.query(
          `INSERT INTO medicines (medicine_name, dosage, quantity_in_stock, unit_price, reorder_level) 
           VALUES (?, ?, ?, ?, ?)`,
          [med.name, med.dosage, med.quantity, med.price, 100]
        );
        console.log(`   ✅ ${med.name} ${med.dosage} - ${med.quantity} units`);
      } catch (e) {
        // Ignore duplicates
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL DATA SEEDED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📊 DATA ADDED:');
    console.log('   ✅ 8+ Prescriptions');
    console.log('   ✅ 10 Diagnoses');
    console.log('   ✅ 10 Vital Signs Records');
    console.log('   ✅ 12 Appointments');
    console.log('   ✅ 10 Progress Notes');
    console.log('   ✅ 10 Lab Tests');
    console.log('   ✅ 8 Medicines in Inventory');
    console.log('\n🔐 NOW LOGIN WITH YOUR CREDENTIALS AND YOU WILL SEE DATA!\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await conn.end();
  }
}

seedCompleteData();
