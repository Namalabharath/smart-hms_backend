const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'hospital_management_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Simple auth middleware (just check if token exists for now)
const auth = (req, res, next) => {
    // Skip auth for now - just let it through
    next();
};

// GET ALL PATIENTS
app.get('/api/receptionist/patients', auth, async (req, res) => {
    try {
        console.log('📡 Fetching patients from database...');
        const conn = await pool.getConnection();
        const [patients] = await conn.query(`
            SELECT p.id, u.first_name, u.last_name, u.email, p.blood_group, p.gender, p.phone
            FROM patients p
            JOIN users u ON p.user_id = u.id
            LIMIT 100
        `);
        await conn.release();
        console.log(`✅ Found ${patients.length} patients`);
        res.json({ success: true, patients });
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// GET ALL DOCTORS
app.get('/api/receptionist/doctors/available', auth, async (req, res) => {
    try {
        console.log('📡 Fetching doctors from database...');
        const conn = await pool.getConnection();
        const [doctors] = await conn.query(`
            SELECT d.id, u.first_name, u.last_name, u.email, d.specialization
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            LIMIT 100
        `);
        await conn.release();
        console.log(`✅ Found ${doctors.length} doctors`);
        // Return doctor.id (from doctors table), not user.id
        res.json({ success: true, doctors });
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
});

// BOOK APPOINTMENT
app.post('/api/receptionist/appointments/book', auth, async (req, res) => {
    try {
        const { patientId, doctorId, appointmentDate, reason } = req.body;
        console.log('📅 Booking appointment:', { patientId, doctorId, appointmentDate, reason });

        if (!patientId || !doctorId || !appointmentDate || !reason) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const conn = await pool.getConnection();

        // doctorId from frontend is the user_id, we need to find the doctor table id
        const [doctorRows] = await conn.query(
            'SELECT id FROM doctors WHERE user_id = ?',
            [doctorId]
        );

        if (doctorRows.length === 0) {
            await conn.release();
            return res.status(400).json({ error: `Doctor with user_id ${doctorId} not found` });
        }

        const actualDoctorId = doctorRows[0].id;
        console.log(`Mapped user_id ${doctorId} to doctor table id ${actualDoctorId}`);

        // Verify patient exists
        const [patientRows] = await conn.query(
            'SELECT id FROM patients WHERE id = ?',
            [patientId]
        );

        if (patientRows.length === 0) {
            await conn.release();
            return res.status(400).json({ error: `Patient with id ${patientId} not found` });
        }

        const [result] = await conn.query(
            `INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason, status)
             VALUES (?, ?, ?, ?, 'scheduled')`,
            [patientId, actualDoctorId, appointmentDate, reason]
        );
        await conn.release();

        console.log('✅ Appointment booked! ID:', result.insertId);
        res.json({ success: true, appointmentId: result.insertId, message: 'Appointment booked successfully!' });
    } catch (error) {
        console.error('❌ Error booking appointment:', error.message);
        res.status(500).json({ error: error.message });
    }
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
});
