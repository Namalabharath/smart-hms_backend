const express = require('express');
const PatientController = require('../controllers/patientController');
const DoctorController = require('../controllers/doctorController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// ============================================
// PATIENT ROUTES
// ============================================

// Register patient (receptionist or admin)
router.post('/patients/register', 
    authMiddleware, 
    roleMiddleware('receptionist', 'admin'),
    PatientController.registerPatient
);

// Get all patients
router.get('/patients',
    authMiddleware,
    roleMiddleware('doctor', 'admin', 'nurse'),
    PatientController.getAllPatients
);

// Get patient details
router.get('/patients/:patientId',
    authMiddleware,
    PatientController.getPatientDetails
);

// Get patient medical records
router.get('/patients/:patientId/medical-records',
    authMiddleware,
    PatientController.getPatientRecords
);

// Get patient diagnoses
router.get('/patients/:patientId/diagnoses',
    authMiddleware,
    async (req, res) => {
        try {
            const db = require('../config/database');
            const { patientId } = req.params;
            const [diagnoses] = await db.query(
                'SELECT * FROM diagnoses WHERE patient_id = ? ORDER BY created_at DESC',
                [patientId]
            );
            res.json({ success: true, diagnoses });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// ============================================
// DOCTOR ROUTES
// ============================================

// Get all doctors
router.get('/doctors',
    authMiddleware,
    roleMiddleware('admin', 'nurse'),
    async (req, res) => {
        try {
            const db = require('../config/database');
            const [doctors] = await db.query(
                `SELECT d.*, u.username, u.email, u.first_name, u.last_name 
                 FROM doctors d
                 JOIN users u ON d.user_id = u.id
                 ORDER BY u.first_name`
            );
            res.json({ success: true, doctors });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Get doctor details
router.get('/doctors/:doctorId',
    authMiddleware,
    async (req, res) => {
        try {
            const db = require('../config/database');
            const { doctorId } = req.params;
            const [doctors] = await db.query(
                `SELECT d.*, u.username, u.email, u.first_name, u.last_name 
                 FROM doctors d
                 JOIN users u ON d.user_id = u.id
                 WHERE d.id = ?`,
                [doctorId]
            );
            if (doctors.length === 0) {
                return res.status(404).json({ error: 'Doctor not found' });
            }
            res.json({ success: true, doctor: doctors[0] });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Get doctor's patients
router.get('/doctors/my-patients',
    authMiddleware,
    roleMiddleware('doctor'),
    async (req, res) => {
        try {
            const db = require('../config/database');
            const doctorId = req.user.user_id;
            const [results] = await db.query(
                `SELECT DISTINCT p.*, u.username, u.email, u.first_name, u.last_name
                 FROM patients p
                 JOIN users u ON p.user_id = u.id
                 LEFT JOIN appointments a ON p.id = a.patient_id
                 LEFT JOIN doctors d ON a.doctor_id = d.id
                 WHERE d.user_id = ? OR 1=1
                 ORDER BY u.first_name LIMIT 10`,
                [doctorId]
            );
            res.json({ success: true, patients: results });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Add diagnosis
router.post('/diagnoses',
    authMiddleware,
    roleMiddleware('doctor'),
    async (req, res) => {
        try {
            const db = require('../config/database');
            const { patientId, diagnosisName, icdCode, severity, description } = req.body;
            const doctorId = req.user.user_id;
            
            const [docCheck] = await db.query(
                'SELECT id FROM doctors WHERE user_id = ?',
                [doctorId]
            );
            
            if (docCheck.length === 0) {
                return res.status(403).json({ error: 'Not authorized' });
            }
            
            const [result] = await db.query(
                `INSERT INTO diagnoses (patient_id, doctor_id, diagnosis_name, icd_code, severity, description)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [patientId, docCheck[0].id, diagnosisName, icdCode, severity, description]
            );
            
            res.json({ success: true, diagnosisId: result.insertId });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// ============================================
// APPOINTMENT ROUTES
// ============================================

// Get all appointments
router.get('/appointments',
    authMiddleware,
    async (req, res) => {
        try {
            const db = require('../config/database');
            const [appointments] = await db.query(
                `SELECT a.*, p.id as patient_id, d.id as doctor_id 
                 FROM appointments a
                 JOIN patients p ON a.patient_id = p.id
                 JOIN doctors d ON a.doctor_id = d.id
                 ORDER BY a.appointment_date DESC`
            );
            res.json({ success: true, appointments });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Create appointment
router.post('/appointments',
    authMiddleware,
    roleMiddleware('admin', 'receptionist'),
    async (req, res) => {
        try {
            const db = require('../config/database');
            const { patientId, doctorId, appointmentDate, reason, status } = req.body;
            
            const [result] = await db.query(
                `INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason, status)
                 VALUES (?, ?, ?, ?, ?)`,
                [patientId, doctorId, appointmentDate, reason, status || 'scheduled']
            );
            
            res.json({ success: true, appointmentId: result.insertId });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Update appointment
router.put('/appointments/:appointmentId',
    authMiddleware,
    roleMiddleware('admin', 'doctor', 'nurse'),
    async (req, res) => {
        try {
            const db = require('../config/database');
            const { appointmentId } = req.params;
            const { status, notes } = req.body;
            
            await db.query(
                `UPDATE appointments SET status = ?, notes = ? WHERE id = ?`,
                [status, notes, appointmentId]
            );
            
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// ============================================
// PRESCRIPTION ROUTES
// ============================================

// Get all prescriptions
router.get('/prescriptions',
    authMiddleware,
    async (req, res) => {
        try {
            const db = require('../config/database');
            const [prescriptions] = await db.query(
                `SELECT p.*, m.name as medication_name 
                 FROM prescriptions p
                 JOIN medications m ON p.medication_id = m.id
                 ORDER BY p.created_at DESC`
            );
            res.json({ success: true, prescriptions });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Create prescription
router.post('/prescriptions',
    authMiddleware,
    roleMiddleware('doctor'),
    async (req, res) => {
        try {
            const db = require('../config/database');
            const { patientId, doctorId, medicationId, dosage, frequency, duration, quantity } = req.body;
            
            const [result] = await db.query(
                `INSERT INTO prescriptions (patient_id, doctor_id, medication_id, dosage, frequency, duration, quantity, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
                [patientId, doctorId || 1, medicationId, dosage, frequency, duration, quantity]
            );
            
            res.json({ success: true, prescriptionId: result.insertId });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Update prescription
router.put('/prescriptions/:prescriptionId',
    authMiddleware,
    roleMiddleware('admin', 'pharmacist'),
    async (req, res) => {
        try {
            const db = require('../config/database');
            const { prescriptionId } = req.params;
            const { status } = req.body;
            
            await db.query(
                `UPDATE prescriptions SET status = ? WHERE id = ?`,
                [status, prescriptionId]
            );
            
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// ============================================
// MEDICATION ROUTES
// ============================================

// Get all medications
router.get('/medications',
    authMiddleware,
    async (req, res) => {
        try {
            const db = require('../config/database');
            const [medications] = await db.query(
                'SELECT * FROM medications ORDER BY name'
            );
            res.json({ success: true, medications });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Get low stock medications
router.get('/medications/low-stock',
    authMiddleware,
    roleMiddleware('admin', 'pharmacist'),
    async (req, res) => {
        try {
            const db = require('../config/database');
            const [medications] = await db.query(
                'SELECT * FROM medications WHERE stock_quantity <= reorder_level ORDER BY stock_quantity'
            );
            res.json({ success: true, medications });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Update medication stock
router.put('/medications/:medicationId',
    authMiddleware,
    roleMiddleware('admin', 'pharmacist'),
    async (req, res) => {
        try {
            const db = require('../config/database');
            const { medicationId } = req.params;
            const { stockQuantity } = req.body;
            
            await db.query(
                `UPDATE medications SET stock_quantity = ? WHERE id = ?`,
                [stockQuantity, medicationId]
            );
            
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// ============================================
// VITAL SIGNS ROUTES
// ============================================

// Get vital signs
router.get('/vital-signs',
    authMiddleware,
    async (req, res) => {
        try {
            const db = require('../config/database');
            const { patientId } = req.query;
            
            let query = 'SELECT * FROM vital_signs ORDER BY recorded_at DESC';
            let params = [];
            
            if (patientId) {
                query = 'SELECT * FROM vital_signs WHERE patient_id = ? ORDER BY recorded_at DESC';
                params = [patientId];
            }
            
            const [vitalSigns] = await db.query(query, params);
            res.json({ success: true, vitalSigns });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Record vital signs
router.post('/vital-signs',
    authMiddleware,
    roleMiddleware('nurse', 'admin'),
    async (req, res) => {
        try {
            const db = require('../config/database');
            const { patientId, temperature, heartRate, bloodPressureSystolic, bloodPressureDiastolic, 
                    oxygenSaturation, glucoseLevel, weight, height, notes } = req.body;
            
            const [result] = await db.query(
                `INSERT INTO vital_signs (patient_id, temperature, heart_rate, blood_pressure_systolic,
                 blood_pressure_diastolic, oxygen_saturation, glucose_level, weight, height, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [patientId, temperature, heartRate, bloodPressureSystolic, bloodPressureDiastolic,
                 oxygenSaturation, glucoseLevel, weight, height, notes]
            );
            
            res.json({ success: true, vitalSignId: result.insertId });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// ============================================
// LAB ROUTES
// ============================================

// Get lab requests
router.get('/lab-requests',
    authMiddleware,
    async (req, res) => {
        try {
            const db = require('../config/database');
            const [labRequests] = await db.query(
                'SELECT * FROM lab_requests ORDER BY created_at DESC'
            );
            res.json({ success: true, labRequests });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Create lab request
router.post('/lab-requests',
    authMiddleware,
    roleMiddleware('doctor'),
    async (req, res) => {
        try {
            const db = require('../config/database');
            const { patientId, doctorId, testName, testType, reason } = req.body;
            
            const [result] = await db.query(
                `INSERT INTO lab_requests (patient_id, doctor_id, test_name, test_type, reason, status)
                 VALUES (?, ?, ?, ?, ?, 'pending')`,
                [patientId, doctorId || 1, testName, testType, reason]
            );
            
            res.json({ success: true, labRequestId: result.insertId });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Get lab results
router.get('/lab-results',
    authMiddleware,
    async (req, res) => {
        try {
            const db = require('../config/database');
            const [labResults] = await db.query(
                `SELECT lr.*, lr2.test_name FROM lab_results lr
                 LEFT JOIN lab_requests lr2 ON lr.lab_request_id = lr2.id
                 ORDER BY lr.created_at DESC`
            );
            res.json({ success: true, labResults });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

module.exports = router;
