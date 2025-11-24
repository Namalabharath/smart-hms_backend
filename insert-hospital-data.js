// Insert realistic hospital data with proper relationships
const mysql = require('mysql2/promise');
const crypto = require('crypto');

// Password hashing function
function hashPassword(password) {
    const hash1 = crypto.createHash('sha256').update(password).digest('hex');
    return crypto.createHash('sha256').update(hash1 + 'hospital2025').digest('hex');
}

async function insertHospitalData() {
    const config = {
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'hospital_management_system'
    };

    let conn;
    try {
        conn = await mysql.createConnection(config);
        console.log('✅ Connected to database');

        // ============================================
        // 1. CREATE ADMIN USERS
        // ============================================
        console.log('\n📝 Creating Admin Users...');
        const adminUsers = [
            { username: 'admin', email: 'admin@hospital.com', role: 'admin', first_name: 'John', last_name: 'Administrator', password: 'admin123' },
        ];

        for (const admin of adminUsers) {
            const hash = hashPassword(admin.password);
            await conn.execute(
                `INSERT INTO users (username, email, role, first_name, last_name, auth_type, password_hash, is_active) 
                VALUES (?, ?, ?, ?, ?, 'simple_hash', ?, TRUE)
                ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
                [admin.username, admin.email, admin.role, admin.first_name, admin.last_name, hash]
            );
            console.log(`✅ Created admin: ${admin.username}`);
        }

        // ============================================
        // 2. CREATE DOCTORS WITH SPECIALIZATIONS
        // ============================================
        console.log('\n👨‍⚕️ Creating Doctors...');
        const doctors = [
            { 
                username: 'dr_rajesh', email: 'rajesh.sharma@hospital.com', first_name: 'Rajesh', last_name: 'Sharma',
                password: 'Doctor@123', specialization: 'Cardiology', license: 'MD001', department: 'Cardiac Care', extension: '2001'
            },
            { 
                username: 'dr_priya', email: 'priya.kumari@hospital.com', first_name: 'Priya', last_name: 'Kumari',
                password: 'Doctor@123', specialization: 'General Medicine', license: 'MD002', department: 'General Ward', extension: '2002'
            },
            { 
                username: 'dr_arun', email: 'arun.verma@hospital.com', first_name: 'Arun', last_name: 'Verma',
                password: 'Doctor@123', specialization: 'Orthopedics', license: 'MD003', department: 'Orthopedic Surgery', extension: '2003'
            },
            { 
                username: 'dr_neha', email: 'neha.patel@hospital.com', first_name: 'Neha', last_name: 'Patel',
                password: 'Doctor@123', specialization: 'Pediatrics', license: 'MD004', department: 'Pediatric Ward', extension: '2004'
            },
            { 
                username: 'dr_vikram', email: 'vikram.singh@hospital.com', first_name: 'Vikram', last_name: 'Singh',
                password: 'Doctor@123', specialization: 'Neurology', license: 'MD005', department: 'Neuro Center', extension: '2005'
            },
        ];

        const doctorIds = {};
        for (const doc of doctors) {
            const hash = hashPassword(doc.password);
            const [existingUser] = await conn.execute(`SELECT id FROM users WHERE username = ?`, [doc.username]);
            
            let userId;
            if (existingUser.length > 0) {
                userId = existingUser[0].id;
            } else {
                const [result] = await conn.execute(
                    `INSERT INTO users (username, email, role, first_name, last_name, auth_type, password_hash, is_active) 
                    VALUES (?, ?, 'doctor', ?, ?, 'simple_hash', ?, TRUE)`,
                    [doc.username, doc.email, doc.first_name, doc.last_name, hash]
                );
                userId = result.insertId;
            }
            
            const [existingDoctor] = await conn.execute(`SELECT id FROM doctors WHERE user_id = ?`, [userId]);
            let doctorId;
            if (existingDoctor.length === 0) {
                const [docRes] = await conn.execute(
                    `INSERT INTO doctors (user_id, specialization, license_number, department, phone_extension, available_slots)
                    VALUES (?, ?, ?, ?, ?, 15)`,
                    [userId, doc.specialization, doc.license, doc.department, doc.extension]
                );
                doctorId = docRes.insertId;
            } else {
                doctorId = existingDoctor[0].id;
            }
            
            doctorIds[doc.username] = doctorId;
            console.log(`✅ Created doctor: ${doc.first_name} ${doc.last_name} (${doc.specialization})`);
        }

        // ============================================
        // 3. CREATE NURSES
        // ============================================
        console.log('\n👩‍⚕️ Creating Nurses...');
        const nurses = [
            { username: 'nurse_anjali', email: 'anjali.sharma@hospital.com', first_name: 'Anjali', last_name: 'Sharma', password: 'Nurse@123' },
            { username: 'nurse_deepak', email: 'deepak.kumar@hospital.com', first_name: 'Deepak', last_name: 'Kumar', password: 'Nurse@123' },
            { username: 'nurse_meera', email: 'meera.gupta@hospital.com', first_name: 'Meera', last_name: 'Gupta', password: 'Nurse@123' },
        ];

        const nurseIds = {};
        for (const nurse of nurses) {
            const hash = hashPassword(nurse.password);
            const [existingUser] = await conn.execute(`SELECT id FROM users WHERE username = ?`, [nurse.username]);
            
            let userId;
            if (existingUser.length > 0) {
                userId = existingUser[0].id;
            } else {
                const [result] = await conn.execute(
                    `INSERT INTO users (username, email, role, first_name, last_name, auth_type, password_hash, is_active) 
                    VALUES (?, ?, 'nurse', ?, ?, 'simple_hash', ?, TRUE)`,
                    [nurse.username, nurse.email, nurse.first_name, nurse.last_name, hash]
                );
                userId = result.insertId;
            }
            
            const [existingNurse] = await conn.execute(`SELECT id FROM nurses WHERE user_id = ?`, [userId]);
            let nurseId;
            if (existingNurse.length === 0) {
                const [nRes] = await conn.execute(
                    `INSERT INTO nurses (user_id) VALUES (?)`,
                    [userId]
                );
                nurseId = nRes.insertId;
            } else {
                nurseId = existingNurse[0].id;
            }
            
            nurseIds[nurse.username] = nurseId;
            console.log(`✅ Created nurse: ${nurse.first_name} ${nurse.last_name}`);
        }

        // ============================================
        // 4. CREATE PATIENTS WITH REALISTIC DATA
        // ============================================
        console.log('\n🏥 Creating Patients...');
        const patients = [
            { 
                username: 'patient_ramesh', email: 'ramesh.gupta@gmail.com', first_name: 'Ramesh', last_name: 'Gupta',
                password: 'Patient@123', dob: '1965-03-15', gender: 'Male', blood_group: 'O+', phone: '9876543210',
                address: '123 Model Town', city: 'Delhi', state: 'Delhi', postal_code: '110009',
                medical_history: 'Hypertension, Type 2 Diabetes', allergies: 'Penicillin'
            },
            { 
                username: 'patient_priya', email: 'priya.singh@gmail.com', first_name: 'Priya', last_name: 'Singh',
                password: 'Patient@123', dob: '1978-07-22', gender: 'Female', blood_group: 'A+', phone: '9876543211',
                address: '456 Karol Bagh', city: 'Delhi', state: 'Delhi', postal_code: '110005',
                medical_history: 'Migraine, Thyroid disorder', allergies: 'NSAIDs'
            },
            { 
                username: 'patient_amit', email: 'amit.verma@gmail.com', first_name: 'Amit', last_name: 'Verma',
                password: 'Patient@123', dob: '1980-11-08', gender: 'Male', blood_group: 'B+', phone: '9876543212',
                address: '789 Connaught Place', city: 'Delhi', state: 'Delhi', postal_code: '110001',
                medical_history: 'Previous heart surgery, Hypertension', allergies: 'None'
            },
            { 
                username: 'patient_riya', email: 'riya.desai@gmail.com', first_name: 'Riya', last_name: 'Desai',
                password: 'Patient@123', dob: '1990-05-30', gender: 'Female', blood_group: 'AB+', phone: '9876543213',
                address: '321 Saket', city: 'Delhi', state: 'Delhi', postal_code: '110017',
                medical_history: 'Asthma, Allergy prone', allergies: 'Shellfish, Aspirin'
            },
            { 
                username: 'patient_rajesh', email: 'rajesh.patel@gmail.com', first_name: 'Rajesh', last_name: 'Patel',
                password: 'Patient@123', dob: '1975-09-12', gender: 'Male', blood_group: 'O-', phone: '9876543214',
                address: '654 Dwarka', city: 'Delhi', state: 'Delhi', postal_code: '110075',
                medical_history: 'Arthritis, Back pain', allergies: 'Sulfa drugs'
            },
        ];

        const patientIds = {};
        for (const patient of patients) {
            const hash = hashPassword(patient.password);
            const [existingUser] = await conn.execute(`SELECT id FROM users WHERE username = ?`, [patient.username]);
            
            let userId;
            if (existingUser.length > 0) {
                userId = existingUser[0].id;
                // Update password if exists
                await conn.execute(
                    `UPDATE users SET password_hash = ? WHERE id = ?`,
                    [hash, userId]
                );
            } else {
                const [result] = await conn.execute(
                    `INSERT INTO users (username, email, role, first_name, last_name, auth_type, password_hash, is_active) 
                    VALUES (?, ?, 'patient', ?, ?, 'simple_hash', ?, TRUE)`,
                    [patient.username, patient.email, patient.first_name, patient.last_name, hash]
                );
                userId = result.insertId;
            }
            
            const [existingPatient] = await conn.execute(`SELECT id FROM patients WHERE user_id = ?`, [userId]);
            let patientId;
            if (existingPatient.length === 0) {
                const [patRes] = await conn.execute(
                    `INSERT INTO patients (user_id, date_of_birth, gender, blood_group, phone, address, city, state, postal_code, medical_history, allergies)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [userId, patient.dob, patient.gender, patient.blood_group, patient.phone, patient.address, 
                     patient.city, patient.state, patient.postal_code, patient.medical_history, patient.allergies]
                );
                patientId = patRes.insertId;
            } else {
                patientId = existingPatient[0].id;
            }
            
            patientIds[patient.username] = patientId;
            console.log(`✅ Created patient: ${patient.first_name} ${patient.last_name} (${patient.blood_group})`);
        }

        // ============================================
        // 5. CREATE APPOINTMENTS (Doctor-Patient assignments)
        // ============================================
        console.log('\n📅 Creating Appointments...');
        const appointmentData = [
            { doctor: 'dr_rajesh', patient: 'patient_amit', date: '2025-12-05 10:00:00', reason: 'Cardiac Checkup', status: 'completed' },
            { doctor: 'dr_rajesh', patient: 'patient_ramesh', date: '2025-12-06 14:00:00', reason: 'Heart Disease Follow-up', status: 'completed' },
            { doctor: 'dr_priya', patient: 'patient_priya', date: '2025-12-07 09:00:00', reason: 'General Checkup', status: 'completed' },
            { doctor: 'dr_priya', patient: 'patient_rajesh', date: '2025-12-08 11:00:00', reason: 'Hypertension Review', status: 'scheduled' },
            { doctor: 'dr_arun', patient: 'patient_rajesh', date: '2025-12-10 15:00:00', reason: 'Orthopedic Consultation', status: 'scheduled' },
            { doctor: 'dr_neha', patient: 'patient_riya', date: '2025-12-12 10:30:00', reason: 'Asthma Management', status: 'completed' },
            { doctor: 'dr_vikram', patient: 'patient_amit', date: '2025-12-15 13:00:00', reason: 'Neurological Assessment', status: 'scheduled' },
        ];

        for (const appt of appointmentData) {
            const doctorId = doctorIds[appt.doctor];
            const patientId = patientIds[appt.patient];
            
            await conn.execute(
                `INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason, status)
                VALUES (?, ?, ?, ?, ?)`,
                [patientId, doctorId, appt.date, appt.reason, appt.status]
            );
            console.log(`✅ Created appointment: ${appt.patient} with ${appt.doctor}`);
        }

        // ============================================
        // 6. CREATE DIAGNOSES
        // ============================================
        console.log('\n🔬 Creating Diagnoses...');
        const diagnoses = [
            { patient: 'patient_amit', doctor: 'dr_rajesh', diagnosis: 'Coronary Artery Disease', icd_code: 'I24.9', severity: 'moderate', notes: 'Requires medication and lifestyle changes' },
            { patient: 'patient_ramesh', doctor: 'dr_rajesh', diagnosis: 'Essential Hypertension', icd_code: 'I10', severity: 'mild', notes: 'Blood pressure controlled with medication' },
            { patient: 'patient_priya', doctor: 'dr_priya', diagnosis: 'Migraine with Aura', icd_code: 'G43.1', severity: 'mild', notes: 'Frequent episodes, prescribed preventive medication' },
            { patient: 'patient_rajesh', doctor: 'dr_arun', diagnosis: 'Osteoarthritis', icd_code: 'M19.9', severity: 'moderate', notes: 'Hip and knee affected' },
            { patient: 'patient_riya', doctor: 'dr_neha', diagnosis: 'Persistent Asthma', icd_code: 'J45.9', severity: 'mild', notes: 'Well controlled with inhaler' },
        ];

        for (const diag of diagnoses) {
            const patientId = patientIds[diag.patient];
            const doctorId = doctorIds[diag.doctor];
            
            await conn.execute(
                `INSERT INTO diagnoses (patient_id, doctor_id, diagnosis_name, icd_code, severity, description)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [patientId, doctorId, diag.diagnosis, diag.icd_code, diag.severity, diag.notes]
            );
            console.log(`✅ Created diagnosis: ${diag.diagnosis} for ${diag.patient}`);
        }

        // ============================================
        // 7. CREATE VITAL SIGNS
        // ============================================
        console.log('\n❤️ Creating Vital Signs Records...');
        const vitalSigns = [
            { patient: 'patient_amit', temp: 98.6, pulse: 72, bp_sys: 120, bp_dia: 80, oxygen: 98 },
            { patient: 'patient_ramesh', temp: 98.4, pulse: 68, bp_sys: 128, bp_dia: 82, oxygen: 97 },
            { patient: 'patient_priya', temp: 98.7, pulse: 75, bp_sys: 115, bp_dia: 78, oxygen: 99 },
            { patient: 'patient_riya', temp: 98.5, pulse: 70, bp_sys: 118, bp_dia: 79, oxygen: 98 },
            { patient: 'patient_rajesh', temp: 98.8, pulse: 76, bp_sys: 130, bp_dia: 85, oxygen: 96 },
            { patient: 'patient_amit', temp: 98.6, pulse: 74, bp_sys: 122, bp_dia: 81, oxygen: 98 },
        ];

        for (const vital of vitalSigns) {
            const patientId = patientIds[vital.patient];
            
            await conn.execute(
                `INSERT INTO vital_signs (patient_id, temperature, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, oxygen_saturation)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [patientId, vital.temp, vital.pulse, vital.bp_sys, vital.bp_dia, vital.oxygen]
            );
            console.log(`✅ Created vital signs for ${vital.patient}`);
        }

        // ============================================
        // 8. CREATE MEDICATIONS
        // ============================================
        console.log('\n💊 Creating Medications...');
        const medications = [
            { name: 'Aspirin', strength: '100mg', form: 'tablet', quantity: 1000, expiry: '2026-06-30', manufacturer: 'Bayer' },
            { name: 'Metoprolol', strength: '50mg', form: 'tablet', quantity: 500, expiry: '2026-12-31', manufacturer: 'Cipla' },
            { name: 'Atorvastatin', strength: '20mg', form: 'tablet', quantity: 800, expiry: '2026-08-15', manufacturer: 'Sun Pharma' },
            { name: 'Metformin', strength: '500mg', form: 'tablet', quantity: 1200, expiry: '2026-10-20', manufacturer: 'Dr. Reddy\'s' },
            { name: 'Lisinopril', strength: '10mg', form: 'tablet', quantity: 600, expiry: '2026-11-30', manufacturer: 'Torrent' },
            { name: 'Amoxicillin', strength: '500mg', form: 'capsule', quantity: 400, expiry: '2026-03-15', manufacturer: 'Glaxo' },
        ];

        const medicationIds = {};
        for (const med of medications) {
            const [result] = await conn.execute(
                `INSERT INTO medications (name, strength, form, stock_quantity, expiry_date, manufacturer)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [med.name, med.strength, med.form, med.quantity, med.expiry, med.manufacturer]
            );
            medicationIds[med.name] = result.insertId;
            console.log(`✅ Created medication: ${med.name} (${med.strength})`);
        }

        // ============================================
        // 9. CREATE PRESCRIPTIONS
        // ============================================
        console.log('\n📋 Creating Prescriptions...');
        const prescriptions = [
            { patient: 'patient_amit', doctor: 'dr_rajesh', medication: 'Aspirin', dosage: '1 tablet', frequency: 'once daily', duration: '30 days' },
            { patient: 'patient_amit', doctor: 'dr_rajesh', medication: 'Metoprolol', dosage: '1 tablet', frequency: 'twice daily', duration: '30 days' },
            { patient: 'patient_ramesh', doctor: 'dr_rajesh', medication: 'Atorvastatin', dosage: '1 tablet', frequency: 'once daily', duration: '30 days' },
            { patient: 'patient_priya', doctor: 'dr_priya', medication: 'Metformin', dosage: '2 tablets', frequency: 'twice daily', duration: '60 days' },
            { patient: 'patient_rajesh', doctor: 'dr_arun', medication: 'Lisinopril', dosage: '1 tablet', frequency: 'once daily', duration: '30 days' },
        ];

        const prescriptionIds = [];
        for (const presc of prescriptions) {
            const patientId = patientIds[presc.patient];
            const doctorId = doctorIds[presc.doctor];
            const medId = medicationIds[presc.medication] || 1;
            
            const [result] = await conn.execute(
                `INSERT INTO prescriptions (patient_id, doctor_id, medication_id, dosage, frequency, duration)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [patientId, doctorId, medId, presc.dosage, presc.frequency, presc.duration]
            );
            prescriptionIds.push({
                id: result.insertId,
                patient: presc.patient,
                medication: presc.medication
            });
            console.log(`✅ Created prescription: ${presc.medication} for ${presc.patient}`);
        }

        // ============================================
        // 10. CREATE LAB REQUESTS
        // ============================================
        console.log('\n🧪 Creating Lab Requests...');
        const labRequests = [
            { patient: 'patient_amit', doctor: 'dr_rajesh', test: 'Complete Blood Count', status: 'completed' },
            { patient: 'patient_ramesh', doctor: 'dr_rajesh', test: 'Blood Chemistry Panel', status: 'completed' },
            { patient: 'patient_priya', doctor: 'dr_priya', test: 'Thyroid Function Test', status: 'pending' },
            { patient: 'patient_rajesh', doctor: 'dr_arun', test: 'X-Ray Hip', status: 'completed' },
            { patient: 'patient_riya', doctor: 'dr_neha', test: 'Chest X-Ray', status: 'pending' },
        ];

        for (const lab of labRequests) {
            const patientId = patientIds[lab.patient];
            const doctorId = doctorIds[lab.doctor];
            
            const [result] = await conn.execute(
                `INSERT INTO lab_requests (patient_id, doctor_id, test_name, status)
                VALUES (?, ?, ?, ?)`,
                [patientId, doctorId, lab.test, lab.status]
            );
            console.log(`✅ Created lab request: ${lab.test} for ${lab.patient}`);
        }

        // ============================================
        // 11. CREATE DAILY PROGRESS NOTES
        // ============================================
        console.log('\n📝 Creating Daily Progress Notes...');
        const progressNotes = [
            { patient: 'patient_amit', nurse: 'nurse_anjali', appetite: 'good', sleep: 7, mood: 'stable', pain: 2, notes: 'Patient stable, chest pain managed. Continue current medications.' },
            { patient: 'patient_ramesh', nurse: 'nurse_deepak', appetite: 'normal', sleep: 8, mood: 'good', pain: 1, notes: 'Blood pressure well controlled. Review in 2 weeks.' },
            { patient: 'patient_priya', nurse: 'nurse_meera', appetite: 'good', sleep: 7, mood: 'improved', pain: 0, notes: 'Migraine episode resolved with medication. Advised stress management.' },
            { patient: 'patient_rajesh', nurse: 'nurse_anjali', appetite: 'normal', sleep: 6, mood: 'good', pain: 3, notes: 'Orthopedic pain improving with therapy. Continue exercises.' },
            { patient: 'patient_riya', nurse: 'nurse_deepak', appetite: 'good', sleep: 8, mood: 'excellent', pain: 0, notes: 'Asthma well controlled. No recent episodes. Continue monitoring.' },
        ];

        for (const note of progressNotes) {
            const patientId = patientIds[note.patient];
            const nurseId = nurseIds[note.nurse];
            
            await conn.execute(
                `INSERT INTO daily_progress (patient_id, nurse_id, appetite, sleep_hours, mood, pain_level, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [patientId, nurseId, note.appetite, note.sleep, note.mood, note.pain, note.notes]
            );
            console.log(`✅ Created progress note for ${note.patient}`);
        }

        // ============================================
        // 12. CREATE MEDICATION ADMINISTRATION RECORDS
        // ============================================
        console.log('\n💉 Creating Medication Administration Records...');
        for (const presc of prescriptionIds) {
            const patientId = patientIds[presc.patient];
            const nurseId = nurseIds['nurse_anjali'];
            
            await conn.execute(
                `INSERT INTO medication_administration (patient_id, prescription_id, nurse_id)
                VALUES (?, ?, ?)`,
                [patientId, presc.id, nurseId]
            );
            console.log(`✅ Created med admin: ${presc.medication} for ${presc.patient}`);
        }

        // ============================================
        // 13. CREATE STAFF ATTENDANCE
        // ============================================
        console.log('\n👥 Creating Staff Attendance Records...');
        const attendance = [
            { user: 'dr_rajesh', date: '2025-12-01', status: 'present', check_in: '09:00:00', check_out: '17:00:00' },
            { user: 'dr_priya', date: '2025-12-01', status: 'present', check_in: '08:30:00', check_out: '16:30:00' },
            { user: 'nurse_anjali', date: '2025-12-01', status: 'present', check_in: '07:00:00', check_out: '19:00:00' },
            { user: 'nurse_deepak', date: '2025-12-01', status: 'present', check_in: '07:00:00', check_out: '19:00:00' },
            { user: 'dr_rajesh', date: '2025-12-02', status: 'present', check_in: '09:00:00', check_out: '17:00:00' },
            { user: 'nurse_meera', date: '2025-12-02', status: 'present', check_in: '19:00:00', check_out: '07:00:00' },
        ];

        // Create a combined user ID map
        const allUsers = { ...doctorIds, ...nurseIds };
        const userIdMap = {};
        
        // Get actual user IDs (not doctor/nurse IDs)
        for (const [username, docNurseId] of Object.entries(allUsers)) {
            const [users] = await conn.execute(
                `SELECT u.id FROM users u WHERE u.username = ?`,
                [username]
            );
            if (users.length > 0) {
                userIdMap[username] = users[0].id;
            }
        }

        for (const att of attendance) {
            const userId = userIdMap[att.user];
            if (userId) {
                await conn.execute(
                    `INSERT INTO staff_attendance (user_id, attendance_date, status, check_in_time, check_out_time)
                    VALUES (?, ?, ?, ?, ?)`,
                    [userId, att.date, att.status, att.check_in, att.check_out]
                );
                console.log(`✅ Created attendance: ${att.user} on ${att.date}`);
            }
        }

        console.log('\n\n✅ ========================================');
        console.log('✅ ALL HOSPITAL DATA INSERTED SUCCESSFULLY!');
        console.log('✅ ========================================\n');

        console.log('📊 SUMMARY:');
        console.log('✅ 1 Admin user');
        console.log('✅ 5 Doctors (various specializations)');
        console.log('✅ 3 Nurses');
        console.log('✅ 5 Patients (with medical histories)');
        console.log('✅ 7 Appointments (doctor-patient assignments)');
        console.log('✅ 5 Diagnoses');
        console.log('✅ 6 Vital Signs records');
        console.log('✅ 6 Medications in inventory');
        console.log('✅ 5 Prescriptions');
        console.log('✅ 5 Lab Requests');
        console.log('✅ 5 Progress Notes');
        console.log('✅ 4 Medication Administration records');
        console.log('✅ 6 Staff Attendance records');

        console.log('\n🔐 TEST CREDENTIALS:');
        console.log('Admin:     admin / admin123');
        console.log('Doctor:    dr_rajesh / Doctor@123');
        console.log('Nurse:     nurse_anjali / Nurse@123');
        console.log('Patient:   patient_amit / Patient@123');

        await conn.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

insertHospitalData();
