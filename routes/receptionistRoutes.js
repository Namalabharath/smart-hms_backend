const express = require('express');
const db = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const crypto = require('crypto');

const router = express.Router();

function hashPassword(password) {
    const hash1 = crypto.createHash('sha256').update(password).digest('hex');
    return crypto.createHash('sha256').update(hash1 + 'hospital2025').digest('hex');
}

// Register new patient
router.post('/patients/register', authMiddleware, roleMiddleware('receptionist'), async (req, res) => {
  try {
    const { firstName, lastName, age, gender, bloodGroup, address, city, postalCode, medicalHistory, allergies, emergencyContact, email, phone } = req.body;

    const tempUsername = `patient_${Date.now()}`;
    const tempPassword = `Temp@${Math.random().toString(36).substring(7)}`;
    const hash = hashPassword(tempPassword);

    const [userResult] = await db.query(
      `INSERT INTO users (username, email, role, first_name, last_name, password_hash, auth_type, is_active) 
       VALUES (?, ?, 'patient', ?, ?, ?, 'simple_hash', TRUE)`,
      [tempUsername, email || `${tempUsername}@hospital.local`, firstName, lastName, hash]
    );

    const [patientResult] = await db.query(
      `INSERT INTO patients (user_id, gender, blood_group, address, city, postal_code, medical_history, allergies, emergency_contact_phone, phone, emergency_contact_name) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userResult.insertId, gender, bloodGroup, address, city, postalCode, medicalHistory, allergies, emergencyContact, phone, emergencyContact]
    );

    res.json({
      success: true,
      message: 'Patient registered successfully',
      patientId: patientResult.insertId,
      userId: userResult.insertId,
      tempUsername,
      tempPassword,
      instructions: 'Share these credentials with the patient. They can change password on first login.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all patients - SIMPLE VERSION
router.get('/patients-all', async (req, res) => {
  try {
    console.log('🔍 Fetching patients (simple endpoint)...');
    
    const [patients] = await db.query(
      `SELECT p.id, u.first_name, u.last_name, u.email, p.blood_group, p.gender, p.phone, p.created_at
       FROM patients p
       LEFT JOIN users u ON p.user_id = u.id`
    );
    
    console.log(`✅ Fetched ${patients.length} patients`);
    res.json({ success: true, patients: patients || [] });
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all patients
router.get('/patients', authMiddleware, roleMiddleware('receptionist'), async (req, res) => {
  try {
    console.log('🔍 [PATIENTS] Fetching from database...');
    
    // Fetch real data from database
    const [patients] = await db.query(`
      SELECT p.id, u.first_name, u.last_name, u.email, p.blood_group, p.gender, p.phone
      FROM patients p
      JOIN users u ON p.user_id = u.id
      LIMIT 100
    `);
    
    console.log(`✅ Found ${patients.length} patients`, patients.slice(0, 3));
    res.json({ success: true, patients: patients || [] });
  } catch (error) {
    console.error('❌ ERROR in /patients:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get available doctors
router.get('/doctors/available', authMiddleware, roleMiddleware('receptionist'), async (req, res) => {
  try {
    console.log('🔍 [DOCTORS] Fetching from database...');
    
    const [doctors] = await db.query(`
      SELECT d.id, u.first_name, u.last_name, u.email, d.specialization, d.available_slots
      FROM doctors d
      JOIN users u ON d.user_id = u.id
    `);
    
    console.log(`✅ Found ${doctors.length} doctors`, doctors.slice(0, 3));
    res.json({ success: true, doctors: doctors || [] });
  } catch (error) {
    console.error('❌ ERROR in /doctors:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Book appointment
router.post('/appointments/book', authMiddleware, roleMiddleware('receptionist'), async (req, res) => {
  try {
    const { patientId, doctorId, appointmentDate, reason } = req.body;

    // Validate inputs
    if (!patientId || !doctorId || !appointmentDate || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate that patient exists
    const [patient] = await db.query('SELECT id FROM patients WHERE id = ?', [patientId]);
    if (patient.length === 0) {
      return res.status(400).json({ error: 'Patient not found' });
    }

    // Validate that doctor exists and get the doctor table ID
    const [doctor] = await db.query('SELECT id FROM doctors WHERE id = ?', [doctorId]);
    if (doctor.length === 0) {
      return res.status(400).json({ error: 'Doctor not found' });
    }

    const [result] = await db.query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason, status)
       VALUES (?, ?, ?, ?, 'scheduled')`,
      [patientId, doctorId, appointmentDate, reason]
    );

    res.json({ success: true, message: 'Appointment booked successfully', appointmentId: result.insertId });
  } catch (error) {
    console.error('Appointment booking error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all appointments
router.get('/appointments', authMiddleware, roleMiddleware('receptionist'), async (req, res) => {
  try {
    const [appointments] = await db.query(
      `SELECT a.id, a.appointment_date, a.reason, a.status,
              p.id as patient_id, u1.first_name as patient_name, u1.last_name as patient_last_name,
              d.id as doctor_id, u2.first_name as doctor_name, u2.last_name as doctor_last_name, d.specialization
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN users u1 ON p.user_id = u1.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users u2 ON d.user_id = u2.id
       ORDER BY a.appointment_date DESC`
    );
    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all staff members
router.get('/staff', authMiddleware, roleMiddleware('receptionist'), async (req, res) => {
  try {
    const [staff] = await db.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.role, 
              CASE 
                WHEN u.role = 'doctor' THEN d.specialization
                WHEN u.role = 'nurse' THEN n.department
                WHEN u.role = 'pharmacist' THEN 'Pharmacy'
                WHEN u.role = 'lab_technician' THEN 'Laboratory'
                WHEN u.role = 'receptionist' THEN 'Reception'
                ELSE 'General'
              END as department
       FROM users u
       LEFT JOIN doctors d ON u.id = d.user_id AND u.role = 'doctor'
       LEFT JOIN nurses n ON u.id = n.user_id AND u.role = 'nurse'
       WHERE u.role IN ('doctor', 'nurse', 'pharmacist', 'lab_technician', 'receptionist')
       AND u.is_active = TRUE
       ORDER BY u.first_name ASC`
    );
    res.json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark staff absence
router.post('/staff-absence/mark', authMiddleware, roleMiddleware('receptionist'), async (req, res) => {
  try {
    const { staffId, absenceType, startDate, endDate, reason } = req.body;

    if (!staffId || !absenceType || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await db.query(
      `INSERT INTO staff_absences (staff_id, absence_type, start_date, end_date, reason, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [staffId, absenceType, startDate, endDate, reason || null]
    );

    res.json({
      success: true,
      message: 'Staff absence marked successfully',
      absenceId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get staff absences
router.get('/staff-absences', authMiddleware, roleMiddleware('receptionist'), async (req, res) => {
  try {
    const [absences] = await db.query(
      `SELECT sa.id, sa.staff_id, sa.absence_type, sa.start_date, sa.end_date, sa.reason,
              u.first_name, u.last_name,
              CASE 
                WHEN u.role = 'doctor' THEN d.specialization
                WHEN u.role = 'nurse' THEN n.department
                WHEN u.role = 'pharmacist' THEN 'Pharmacy'
                WHEN u.role = 'lab_technician' THEN 'Laboratory'
                WHEN u.role = 'receptionist' THEN 'Reception'
                ELSE 'General'
              END as department
       FROM staff_absences sa
       JOIN users u ON sa.staff_id = u.id
       LEFT JOIN doctors d ON u.id = d.user_id AND u.role = 'doctor'
       LEFT JOIN nurses n ON u.id = n.user_id AND u.role = 'nurse'
       WHERE sa.start_date <= CURDATE() AND sa.end_date >= CURDATE()
       ORDER BY sa.start_date DESC`
    );
    res.json({ success: true, absences });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
