const express = require('express');
const axios = require('axios');
const db = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// ============================================
// DOCTOR ENDPOINTS
// ============================================

// Doctor: Get their assigned patients
router.get('/doctor/my-patients', authMiddleware, roleMiddleware('doctor'), async (req, res) => {
    try {
        const userId = req.user.id;
        const [doctors] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
        
        if (doctors.length === 0) {
            return res.json({ success: true, patients: [] });
        }
        
        const doctorId = doctors[0].id;
        const [appointments] = await db.query(
            `SELECT DISTINCT p.id, p.user_id, u.first_name, u.last_name, u.email, p.blood_group, p.date_of_birth, p.phone
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             JOIN users u ON p.user_id = u.id
             WHERE a.doctor_id = ?
             ORDER BY u.first_name`,
            [doctorId]
        );
        
        res.json({ success: true, patients: appointments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Doctor: Get patient details with medical history
router.get('/doctor/patient/:patientId', authMiddleware, roleMiddleware('doctor'), async (req, res) => {
    try {
        const { patientId } = req.params;
        
        const [patient] = await db.query(
            `SELECT p.*, u.first_name, u.last_name, u.email, u.username
             FROM patients p
             JOIN users u ON p.user_id = u.id
             WHERE p.id = ?`,
            [patientId]
        );
        
        if (patient.length === 0) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        
        const [diagnoses] = await db.query(
            'SELECT * FROM diagnoses WHERE patient_id = ? ORDER BY created_at DESC',
            [patientId]
        );
        
        const [prescriptions] = await db.query(
            `SELECT pr.*, m.name as medication_name, m.strength
             FROM prescriptions pr
             JOIN medications m ON pr.medication_id = m.id
             WHERE pr.patient_id = ? ORDER BY pr.created_at DESC LIMIT 5`,
            [patientId]
        );
        
        const [vitals] = await db.query(
            'SELECT * FROM vital_signs WHERE patient_id = ? ORDER BY recorded_at DESC LIMIT 5',
            [patientId]
        );
        
        const [appointments] = await db.query(
            'SELECT * FROM appointments WHERE patient_id = ? ORDER BY appointment_date DESC LIMIT 5',
            [patientId]
        );
        
        res.json({
            success: true,
            patient: patient[0],
            diagnoses,
            prescriptions,
            vitals,
            appointments
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Doctor: Add diagnosis for patient
router.post('/doctor/diagnoses', authMiddleware, roleMiddleware('doctor'), async (req, res) => {
    try {
        const { patientId, diagnosis_name, icd_code, severity, description } = req.body;
        const userId = req.user.id;
        
        const [doctors] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
        if (doctors.length === 0) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        const [result] = await db.query(
            `INSERT INTO diagnoses (patient_id, doctor_id, diagnosis_name, icd_code, severity, description)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [patientId, doctors[0].id, diagnosis_name, icd_code, severity, description]
        );
        
        res.json({ success: true, diagnosisId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Doctor: Create prescription
router.post('/doctor/prescriptions', authMiddleware, roleMiddleware('doctor'), async (req, res) => {
    try {
        const { patientId, medication_id, dosage, frequency, duration } = req.body;
        const userId = req.user.id;
        
        const [doctors] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
        if (doctors.length === 0) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        const [result] = await db.query(
            `INSERT INTO prescriptions (patient_id, doctor_id, medication_id, dosage, frequency, duration)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [patientId, doctors[0].id, medication_id, dosage, frequency, duration]
        );
        
        res.json({ success: true, prescriptionId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Doctor: View appointments schedule
router.get('/doctor/appointments', authMiddleware, roleMiddleware('doctor'), async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [doctors] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
        if (doctors.length === 0) {
            return res.json({ success: true, appointments: [] });
        }
        
        const [appointments] = await db.query(
            `SELECT a.*, u.first_name, u.last_name, p.id as patient_id
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             JOIN users u ON p.user_id = u.id
             WHERE a.doctor_id = ?
             ORDER BY a.appointment_date DESC`,
            [doctors[0].id]
        );
        
        res.json({ success: true, appointments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// PATIENT ENDPOINTS
// ============================================

// Patient: Get own medical records
router.get('/patient/my-records', authMiddleware, roleMiddleware('patient'), async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [patient] = await db.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
        if (patient.length === 0) {
            return res.status(404).json({ error: 'Patient profile not found' });
        }
        
        const patientId = patient[0].id;
        
        const [diagnoses] = await db.query(
            'SELECT * FROM diagnoses WHERE patient_id = ? ORDER BY created_at DESC',
            [patientId]
        );
        
        const [prescriptions] = await db.query(
            `SELECT pr.*, m.name as medication_name, m.strength FROM prescriptions pr
             JOIN medications m ON pr.medication_id = m.id
             WHERE pr.patient_id = ? ORDER BY pr.created_at DESC`,
            [patientId]
        );
        
        const [vitals] = await db.query(
            'SELECT * FROM vital_signs WHERE patient_id = ? ORDER BY recorded_at DESC',
            [patientId]
        );
        
        const [labRequests] = await db.query(
            'SELECT * FROM lab_requests WHERE patient_id = ? ORDER BY created_at DESC',
            [patientId]
        );
        
        res.json({
            success: true,
            diagnoses,
            prescriptions,
            vitals,
            labRequests
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Patient: Get profile
router.get('/patient/profile', authMiddleware, roleMiddleware('patient'), async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [patient] = await db.query(
            `SELECT p.*, u.first_name, u.last_name, u.email, u.username
             FROM patients p
             JOIN users u ON p.user_id = u.id
             WHERE p.user_id = ?`,
            [userId]
        );
        
        if (patient.length === 0) {
            return res.status(404).json({ error: 'Patient profile not found' });
        }
        
        res.json({ success: true, patient: patient[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Patient: View appointments
router.get('/patient/appointments', authMiddleware, roleMiddleware('patient'), async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [patient] = await db.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
        if (patient.length === 0) {
            return res.json({ success: true, appointments: [] });
        }
        
        const [appointments] = await db.query(
            `SELECT a.*, d.specialization, u.first_name, u.last_name
             FROM appointments a
             JOIN doctors d ON a.doctor_id = d.id
             JOIN users u ON d.user_id = u.id
             WHERE a.patient_id = ?
             ORDER BY a.appointment_date DESC`,
            [patient[0].id]
        );
        
        res.json({ success: true, appointments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// NURSE ENDPOINTS
// ============================================

// Nurse: Record vital signs
router.post('/nurse/vital-signs', authMiddleware, roleMiddleware('nurse'), async (req, res) => {
    try {
        const { patientId, temperature, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, oxygen_saturation } = req.body;
        
        const [result] = await db.query(
            `INSERT INTO vital_signs (patient_id, temperature, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, oxygen_saturation)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [patientId, temperature, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, oxygen_saturation]
        );
        
        res.json({ success: true, vitalSignId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Nurse: Get patients for vital signs
router.get('/nurse/patients', authMiddleware, roleMiddleware('nurse'), async (req, res) => {
    try {
        const [patients] = await db.query(
            `SELECT p.id, u.first_name, u.last_name, p.blood_group, u.email
             FROM patients p
             JOIN users u ON p.user_id = u.id
             ORDER BY u.first_name`
        );
        
        res.json({ success: true, patients });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Nurse: Get dashboard stats
router.get('/nurse/dashboard/stats', authMiddleware, roleMiddleware('nurse'), async (req, res) => {
    try {
        const [patients] = await db.query('SELECT COUNT(*) as count FROM patients');
        const [vitals] = await db.query('SELECT COUNT(*) as count FROM vital_signs');
        const [notes] = await db.query('SELECT COUNT(*) as count FROM progress_notes');
        const [monitored] = await db.query(
            `SELECT COUNT(DISTINCT patient_id) as count FROM vital_signs WHERE recorded_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)`
        );
        
        res.json({ 
            success: true, 
            stats: {
                totalPatients: patients[0]?.count || 0,
                vitalRecordings: vitals[0]?.count || 0,
                progressNotesAdded: notes[0]?.count || 0,
                patientsMonitored: monitored[0]?.count || 0
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Nurse: Record daily progress
router.post('/nurse/daily-progress', authMiddleware, roleMiddleware('nurse'), async (req, res) => {
    try {
        const { patientId, appetite, sleep_hours, mood, pain_level, notes } = req.body;
        const userId = req.user.id;
        
        const [nurses] = await db.query('SELECT id FROM nurses WHERE user_id = ?', [userId]);
        if (nurses.length === 0) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        const [result] = await db.query(
            `INSERT INTO daily_progress (patient_id, nurse_id, appetite, sleep_hours, mood, pain_level, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [patientId, nurses[0].id, appetite, sleep_hours, mood, pain_level, notes]
        );
        
        res.json({ success: true, progressId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Nurse: Get all vitals
router.get('/nurse/vitals/:patientId', authMiddleware, roleMiddleware('nurse'), async (req, res) => {
    try {
        const { patientId } = req.params;
        
        const [vitals] = await db.query(
            'SELECT * FROM vital_signs WHERE patient_id = ? ORDER BY recorded_at DESC LIMIT 50',
            [patientId]
        );
        
        res.json({ success: true, vitals });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Nurse: Get progress notes
router.get('/nurse/progress/:patientId', authMiddleware, roleMiddleware('nurse'), async (req, res) => {
    try {
        const { patientId } = req.params;
        
        const [notes] = await db.query(
            'SELECT * FROM progress_notes WHERE patient_id = ? ORDER BY recorded_at DESC LIMIT 50',
            [patientId]
        );
        
        res.json({ success: true, progressNotes: notes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Nurse: Get patient vital signs history (old endpoint - kept for compatibility)
router.get('/nurse/patient/:patientId/vitals', authMiddleware, roleMiddleware('nurse'), async (req, res) => {
    try {
        const { patientId } = req.params;
        
        const [vitals] = await db.query(
            'SELECT * FROM vital_signs WHERE patient_id = ? ORDER BY recorded_at DESC',
            [patientId]
        );
        
        res.json({ success: true, vitals });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

// Admin: Get all users
router.get('/admin/users', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, username, email, first_name, last_name, role, is_active FROM users ORDER BY created_at DESC'
        );
        
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get statistics
router.get('/admin/statistics', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const [totalUsers] = await db.query('SELECT COUNT(*) as count FROM users');
        const [totalPatients] = await db.query('SELECT COUNT(*) as count FROM patients');
        const [totalDoctors] = await db.query('SELECT COUNT(*) as count FROM doctors');
        const [totalAppointments] = await db.query('SELECT COUNT(*) as count FROM appointments');
        const [completedAppointments] = await db.query("SELECT COUNT(*) as count FROM appointments WHERE status = 'completed'");
        const [lowStockMeds] = await db.query('SELECT COUNT(*) as count FROM medications WHERE stock_quantity <= reorder_level');
        
        res.json({
            success: true,
            stats: {
                totalUsers: totalUsers[0].count,
                totalPatients: totalPatients[0].count,
                totalDoctors: totalDoctors[0].count,
                totalAppointments: totalAppointments[0].count,
                completedAppointments: completedAppointments[0].count,
                lowStockMeds: lowStockMeds[0].count
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get all appointments
router.get('/admin/appointments', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const [appointments] = await db.query(
            `SELECT a.*, p_user.first_name as patient_first_name, p_user.last_name as patient_last_name,
                    d_user.first_name as doctor_first_name, d_user.last_name as doctor_last_name
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             JOIN users p_user ON p.user_id = p_user.id
             JOIN doctors d ON a.doctor_id = d.id
             JOIN users d_user ON d.user_id = d_user.id
             ORDER BY a.appointment_date DESC`
        );
        
        res.json({ success: true, appointments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get all diagnoses
router.get('/admin/diagnoses', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const [diagnoses] = await db.query(
            `SELECT d.*, p_user.first_name as patient_name, doc_user.first_name as doctor_name
             FROM diagnoses d
             JOIN patients p ON d.patient_id = p.id
             JOIN users p_user ON p.user_id = p_user.id
             JOIN doctors doc ON d.doctor_id = doc.id
             JOIN users doc_user ON doc.user_id = doc_user.id
             ORDER BY d.created_at DESC`
        );
        
        res.json({ success: true, diagnoses });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get medications inventory
router.get('/admin/medications', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const [medications] = await db.query(
            'SELECT * FROM medications ORDER BY name'
        );
        
        res.json({ success: true, medications });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get low stock medications
router.get('/admin/medications/low-stock', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const [medications] = await db.query(
            'SELECT * FROM medications WHERE stock_quantity <= reorder_level ORDER BY stock_quantity ASC'
        );
        
        res.json({ success: true, medications });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Update medication stock
router.put('/admin/medications/:medicationId', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const { medicationId } = req.params;
        const { stock_quantity } = req.body;
        
        await db.query(
            'UPDATE medications SET stock_quantity = ? WHERE id = ?',
            [stock_quantity, medicationId]
        );
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get staff attendance
router.get('/admin/staff-attendance', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const [attendance] = await db.query(
            `SELECT sa.*, u.username, u.first_name, u.last_name, u.role
             FROM staff_attendance sa
             JOIN users u ON sa.user_id = u.id
             ORDER BY sa.attendance_date DESC LIMIT 50`
        );
        
        res.json({ success: true, attendance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// SHARED ENDPOINTS
// ============================================

// Get all medications (shared)
router.get('/medications', authMiddleware, async (req, res) => {
    try {
        const [medications] = await db.query('SELECT * FROM medications ORDER BY name');
        res.json({ success: true, medications });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all doctors (for scheduling)
router.get('/doctors', authMiddleware, async (req, res) => {
    try {
        const [doctors] = await db.query(
            `SELECT d.id, d.specialization, d.department, u.first_name, u.last_name, u.email
             FROM doctors d
             JOIN users u ON d.user_id = u.id
             ORDER BY u.first_name`
        );
        
        res.json({ success: true, doctors });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get dashboard summary for current user
router.get('/dashboard-summary', authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        const role = req.user?.role;
        
        let summary = {};
        
        if (role === 'doctor') {
            const [doctors] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
            if (doctors.length > 0) {
                const doctorId = doctors[0].id;
                const [patients] = await db.query(
                    `SELECT COUNT(DISTINCT patient_id) as count FROM appointments WHERE doctor_id = ?`,
                    [doctorId]
                );
                const [appointments] = await db.query(
                    `SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ?`,
                    [doctorId]
                );
                const [diagnoses] = await db.query(
                    `SELECT COUNT(*) as count FROM diagnoses WHERE doctor_id = ?`,
                    [doctorId]
                );
                summary = {
                    patientCount: patients[0]?.count || 0,
                    upcomingAppointments: appointments[0]?.count || 0,
                    diagnosesCount: diagnoses[0]?.count || 0
                };
            }
        } else if (role === 'patient') {
            const [patient] = await db.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
            if (patient.length > 0) {
                const patientId = patient[0].id;
                const [appointments] = await db.query(
                    `SELECT COUNT(*) as count FROM appointments WHERE patient_id = ?`,
                    [patientId]
                );
                const [diagnoses] = await db.query(
                    `SELECT COUNT(*) as count FROM diagnoses WHERE patient_id = ?`,
                    [patientId]
                );
                const [prescriptions] = await db.query(
                    `SELECT COUNT(*) as count FROM prescriptions WHERE patient_id = ?`,
                    [patientId]
                );
                summary = {
                    upcomingAppointments: appointments[0]?.count || 0,
                    diagnosesCount: diagnoses[0]?.count || 0,
                    prescriptionsCount: prescriptions[0]?.count || 0
                };
            }
        } else if (role === 'admin') {
            const [users] = await db.query('SELECT COUNT(*) as count FROM users');
            const [patients] = await db.query('SELECT COUNT(*) as count FROM patients');
            const [appointments] = await db.query('SELECT COUNT(*) as count FROM appointments');
            summary = {
                totalUsers: users[0]?.count || 0,
                totalPatients: patients[0]?.count || 0,
                pendingAppointments: appointments[0]?.count || 0
            };
        }
        
        res.json({ success: true, summary });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// PATIENT DOCUMENT MANAGEMENT
// ============================================

// Patient: Upload document
router.post('/patient/documents/upload', authMiddleware, roleMiddleware('patient'), async (req, res) => {
    try {
        const { userId } = req.user;
        const { documentType, filename, fileContent, description } = req.body;

        // Get patient ID
        const [patients] = await db.query('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
        if (patients.length === 0) {
            return res.status(404).json({ error: 'Patient record not found' });
        }

        const patientId = patients[0].id;

        // Insert document record
        const [result] = await db.query(
            `INSERT INTO patient_documents (patient_id, document_type, filename, file_path, description, upload_date) 
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [patientId, documentType, filename, filename, description]
        );

        res.json({ success: true, message: 'Document uploaded', documentId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Patient: Get their documents
router.get('/patient/documents', authMiddleware, roleMiddleware('patient'), async (req, res) => {
    try {
        const [patients] = await db.query('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
        if (patients.length === 0) {
            return res.json({ success: true, documents: [] });
        }

        const patientId = patients[0].id;
        const [documents] = await db.query(
            `SELECT * FROM patient_documents WHERE patient_id = ? ORDER BY upload_date DESC`,
            [patientId]
        );

        res.json({ success: true, documents });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Patient: Download document
router.get('/patient/documents/:documentId', authMiddleware, roleMiddleware('patient'), async (req, res) => {
    try {
        const [documents] = await db.query(
            `SELECT pd.* FROM patient_documents pd
             JOIN patients p ON pd.patient_id = p.id
             WHERE pd.id = ? AND p.user_id = ?`,
            [req.params.documentId, req.user.id]
        );

        if (documents.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.json({ success: true, document: documents[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Doctor: View patient documents
router.get('/doctor/patient/:patientId/documents', authMiddleware, roleMiddleware('doctor'), async (req, res) => {
    try {
        const [documents] = await db.query(
            `SELECT * FROM patient_documents WHERE patient_id = ? ORDER BY upload_date DESC`,
            [req.params.patientId]
        );

        res.json({ success: true, documents });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// ROUTE ALIASES FOR COMPATIBILITY
// ============================================

// Nurse aliases
router.get('/nurse/assigned-patients', authMiddleware, roleMiddleware('nurse'), async (req, res) => {
    return axios.get('http://localhost:5000/api/nurse/patients', {
        headers: { Authorization: `Bearer ${req.headers.authorization?.split(' ')[1]}` }
    }).then(r => res.json(r.data)).catch(e => res.status(500).json({ error: e.message }));
});

router.get('/nurse/vitals', authMiddleware, roleMiddleware('nurse'), async (req, res) => {
    try {
        const [userId] = await db.query('SELECT id FROM nurses WHERE user_id = ?', [req.user.id]);
        if (userId.length === 0) return res.json({ success: true, vitals: [] });
        
        const [vitals] = await db.query(
            `SELECT * FROM vital_signs WHERE created_by = ? ORDER BY recorded_at DESC LIMIT 50`,
            [userId[0].id]
        );
        res.json({ success: true, vitals });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Patient aliases
router.get('/patient/my-appointments', authMiddleware, roleMiddleware('patient'), async (req, res) => {
    return axios.get('http://localhost:5000/api/patient/appointments', {
        headers: { Authorization: `Bearer ${req.headers.authorization?.split(' ')[1]}` }
    }).then(r => res.json(r.data)).catch(e => res.status(500).json({ error: e.message }));
});

router.get('/patient/medical-records', authMiddleware, roleMiddleware('patient'), async (req, res) => {
    return axios.get('http://localhost:5000/api/patient/my-records', {
        headers: { Authorization: `Bearer ${req.headers.authorization?.split(' ')[1]}` }
    }).then(r => res.json(r.data)).catch(e => res.status(500).json({ error: e.message }));
});

// Lab technician aliases
router.get('/lab-technician/requests', authMiddleware, roleMiddleware('lab_technician'), async (req, res) => {
    return axios.get('http://localhost:5000/api/lab-technician/requests', {
        headers: { Authorization: `Bearer ${req.headers.authorization?.split(' ')[1]}` }
    }).then(r => res.json(r.data)).catch(e => res.status(500).json({ error: e.message }));
});

// Receptionist aliases
router.get('/receptionist/patients', authMiddleware, roleMiddleware('receptionist'), async (req, res) => {
    return axios.get('http://localhost:5000/api/receptionist/patients', {
        headers: { Authorization: `Bearer ${req.headers.authorization?.split(' ')[1]}` }
    }).then(r => res.json(r.data)).catch(e => res.status(500).json({ error: e.message }));
});

// Pharmacist aliases
router.get('/pharmacist/prescriptions', authMiddleware, roleMiddleware('pharmacist'), async (req, res) => {
    return axios.get('http://localhost:5000/api/pharmacist/prescriptions', {
        headers: { Authorization: `Bearer ${req.headers.authorization?.split(' ')[1]}` }
    }).then(r => res.json(r.data)).catch(e => res.status(500).json({ error: e.message }));
});

module.exports = router;
