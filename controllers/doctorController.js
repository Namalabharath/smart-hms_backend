const db = require('../config/database');

class DoctorController {
    /**
     * Get doctor's patients
     */
    static async getDoctorPatients(req, res) {
        try {
            const doctorId = req.user.user_id;
            
            const [results] = await db.query(
                `SELECT DISTINCT p.*, u.username, u.email, u.first_name, u.last_name
                 FROM patients p
                 JOIN users u ON p.user_id = u.id
                 JOIN appointments a ON p.id = a.patient_id
                 JOIN doctors d ON a.doctor_id = d.id
                 WHERE d.user_id = ?
                 ORDER BY u.first_name`,
                [doctorId]
            );
            
            res.json({
                success: true,
                patients: results,
                total: results.length
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get patients: ' + error.message });
        }
    }

    /**
     * Add diagnosis for patient
     */
    static async addDiagnosis(req, res) {
        try {
            const doctorId = req.user.user_id;
            const { patientId, diagnosisName, icdCode, severity, description } = req.body;
            
            // Verify doctor owns this patient
            const [docCheck] = await db.query(
                `SELECT d.id FROM doctors d WHERE d.user_id = ?`,
                [doctorId]
            );
            
            if (docCheck.length === 0) {
                return res.status(403).json({ error: 'Not authorized' });
            }
            
            const doctorRecord = docCheck[0];
            
            const [result] = await db.query(
                `INSERT INTO diagnoses (patient_id, doctor_id, diagnosis_name, icd_code, severity, description)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [patientId, doctorRecord.id, diagnosisName, icdCode, severity, description]
            );
            
            res.status(201).json({
                success: true,
                message: 'Diagnosis added successfully',
                diagnosisId: result.insertId
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to add diagnosis: ' + error.message });
        }
    }

    /**
     * Create prescription
     */
    static async createPrescription(req, res) {
        try {
            const doctorId = req.user.user_id;
            const { patientId, medicationId, dosage, frequency, duration, quantity, notes } = req.body;
            
            const [docCheck] = await db.query(
                `SELECT d.id FROM doctors d WHERE d.user_id = ?`,
                [doctorId]
            );
            
            if (docCheck.length === 0) {
                return res.status(403).json({ error: 'Not authorized' });
            }
            
            const doctorRecord = docCheck[0];
            
            const [result] = await db.query(
                `INSERT INTO prescriptions (patient_id, doctor_id, medication_id, dosage, frequency, duration, quantity, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [patientId, doctorRecord.id, medicationId, dosage, frequency, duration, quantity, notes]
            );
            
            res.status(201).json({
                success: true,
                message: 'Prescription created successfully',
                prescriptionId: result.insertId
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to create prescription: ' + error.message });
        }
    }

    /**
     * Get available appointments
     */
    static async getAvailableSlots(req, res) {
        try {
            const doctorId = req.user.user_id;
            const { date } = req.query;
            
            if (!date) {
                return res.status(400).json({ error: 'Date required' });
            }
            
            const [results] = await db.query(
                `SELECT * FROM appointments
                 WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = ?)
                 AND DATE(appointment_date) = ?
                 AND status = 'scheduled'`,
                [doctorId, date]
            );
            
            res.json({
                success: true,
                appointments: results,
                total: results.length
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get appointments: ' + error.message });
        }
    }

    /**
     * Get doctor's profile
     */
    static async getDoctorProfile(req, res) {
        try {
            const doctorId = req.user.user_id;
            
            const [results] = await db.query(
                `SELECT u.*, d.* FROM users u
                 JOIN doctors d ON u.id = d.user_id
                 WHERE u.id = ?`,
                [doctorId]
            );
            
            if (results.length === 0) {
                return res.status(404).json({ error: 'Doctor not found' });
            }
            
            res.json({
                success: true,
                doctor: results[0]
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get profile: ' + error.message });
        }
    }
}

module.exports = DoctorController;
