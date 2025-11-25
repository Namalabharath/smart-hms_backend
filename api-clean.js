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

console.log('Database pool created');

// GET ALL PATIENTS
app.get('/api/receptionist/patients', async (req, res) => {
    try {
        console.log('📡 Fetching patients...');
        const conn = await pool.getConnection();
        const [patients] = await conn.query(`
            SELECT p.id, u.first_name, u.last_name, u.email, p.blood_group, p.gender, p.phone
            FROM patients p
            JOIN users u ON p.user_id = u.id
            LIMIT 100
        `);
        conn.release();
        console.log(`✅ Found ${patients.length} patients`);
        res.json({ success: true, patients });
    } catch (error) {
        console.error('❌ Patients Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// GET ALL DOCTORS
app.get('/api/receptionist/doctors/available', async (req, res) => {
    try {
        console.log('📡 Fetching doctors...');
        const conn = await pool.getConnection();
        const [doctors] = await conn.query(`
            SELECT d.id, u.first_name, u.last_name, u.email, d.specialization
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            LIMIT 100
        `);
        conn.release();
        console.log(`✅ Found ${doctors.length} doctors`);
        res.json({ success: true, doctors });
    } catch (error) {
        console.error('❌ Doctors Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// BOOK APPOINTMENT
app.post('/api/receptionist/appointments/book', async (req, res) => {
    try {
        const { patientId, doctorId, appointmentDate, reason } = req.body;
        console.log('📅 Booking appointment:', { patientId, doctorId, appointmentDate, reason });
        console.log('   Types:', { patientId: typeof patientId, doctorId: typeof doctorId });

        // Validate input
        if (!patientId || !doctorId || !appointmentDate || !reason) {
            console.log('❌ Missing fields');
            return res.status(400).json({ error: 'All fields required' });
        }

        const conn = await pool.getConnection();

        // Verify patient exists
        console.log(`   Checking patient ${patientId}...`);
        const [patientRows] = await conn.query('SELECT id FROM patients WHERE id = ?', [patientId]);
        if (!patientRows || patientRows.length === 0) {
            conn.release();
            console.log(`❌ Patient ${patientId} not found`);
            return res.status(400).json({ error: `Patient ${patientId} not found` });
        }
        console.log(`   ✓ Patient ${patientId} found`);

        // Verify doctor exists (doctorId is from doctors table, not users)
        console.log(`   Checking doctor ${doctorId}...`);
        const [doctorRows] = await conn.query('SELECT id FROM doctors WHERE id = ?', [doctorId]);
        console.log(`   Doctor query result:`, doctorRows);
        if (!doctorRows || doctorRows.length === 0) {
            conn.release();
            console.log(`❌ Doctor ${doctorId} not found in doctors table`);
            // List all doctors for debugging
            const [allDoctors] = await conn.query('SELECT id FROM doctors');
            console.log('   Available doctor IDs:', allDoctors.map(d => d.id));
            return res.status(400).json({ error: `Doctor ${doctorId} not found. Available: ${allDoctors.map(d => d.id).join(', ')}` });
        }
        console.log(`   ✓ Doctor ${doctorId} found`);

        // Book appointment
        const [result] = await conn.query(
            'INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason, status) VALUES (?, ?, ?, ?, ?)',
            [patientId, doctorId, appointmentDate, reason, 'scheduled']
        );

        conn.release();
        console.log('✅ Appointment booked! ID:', result.insertId);
        res.json({ success: true, appointmentId: result.insertId, message: 'Appointment booked!' });
    } catch (error) {
        console.error('❌ Booking Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`✅ API running on port ${PORT}`);
});
