const db = require('../config/database');

class PatientController {
    /**
     * Register new patient
     */
    static async registerPatient(req, res) {
        try {
            const { userId, dateOfBirth, gender, bloodGroup, phone, address, city, state, postalCode, emergencyContactName, emergencyContactPhone } = req.body;
            
            const [result] = await db.query(
                `INSERT INTO patients 
                (user_id, date_of_birth, gender, blood_group, phone, address, city, state, postal_code, emergency_contact_name, emergency_contact_phone)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, dateOfBirth, gender, bloodGroup, phone, address, city, state, postalCode, emergencyContactName, emergencyContactPhone]
            );
            
            res.status(201).json({
                success: true,
                message: 'Patient registered successfully',
                patientId: result.insertId
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to register patient: ' + error.message });
        }
    }

    /**
     * Get patient details
     */
    static async getPatientDetails(req, res) {
        try {
            const { patientId } = req.params;
            
            const [results] = await db.query(
                `SELECT u.*, p.* FROM users u
                 JOIN patients p ON u.id = p.user_id
                 WHERE p.id = ?`,
                [patientId]
            );
            
            if (results.length === 0) {
                return res.status(404).json({ error: 'Patient not found' });
            }
            
            res.json({
                success: true,
                patient: results[0]
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get patient: ' + error.message });
        }
    }

    /**
     * Get all patients (for doctor/admin)
     */
    static async getAllPatients(req, res) {
        try {
            const [results] = await db.query(
                `SELECT u.id, u.username, u.email, u.first_name, u.last_name,
                        p.id as patient_id, p.date_of_birth, p.gender, p.blood_group, p.phone
                 FROM users u
                 JOIN patients p ON u.id = p.user_id
                 ORDER BY u.first_name`
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
     * Get patient medical records
     */
    static async getPatientRecords(req, res) {
        try {
            const { patientId } = req.params;
            
            const [records] = await db.query(
                `SELECT * FROM diagnoses WHERE patient_id = ? ORDER BY created_at DESC`,
                [patientId]
            );
            
            const [vitals] = await db.query(
                `SELECT * FROM vital_signs WHERE patient_id = ? ORDER BY recorded_at DESC LIMIT 10`,
                [patientId]
            );
            
            res.json({
                success: true,
                diagnoses: records,
                vital_signs: vitals
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get records: ' + error.message });
        }
    }
}

module.exports = PatientController;
