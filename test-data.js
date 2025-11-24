const mysql = require('mysql2/promise');

async function testData() {
    const config = {
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'hospital_management_system'
    };

    let conn;
    try {
        conn = await mysql.createConnection(config);
        
        // Get dr_rajesh's user ID and doctor ID
        console.log('\n=== Checking Dr. Rajesh ===');
        const [rajeshUsers] = await conn.query('SELECT id, username, role FROM users WHERE username = "dr_rajesh"');
        console.log('Dr. Rajesh User:', rajeshUsers);
        
        if (rajeshUsers.length > 0) {
            const userId = rajeshUsers[0].id;
            const [doctors] = await conn.query('SELECT id, user_id, specialization FROM doctors WHERE user_id = ?', [userId]);
            console.log('Dr. Rajesh Doctor records:', doctors);
            
            if (doctors.length > 0) {
                const doctorId = doctors[0].id;
                
                // Check appointments for this doctor
                console.log('\n=== Checking Appointments ===');
                const [appointments] = await conn.query(
                    'SELECT a.id, a.doctor_id, a.patient_id, a.appointment_date, a.reason, a.status, u.first_name, u.last_name FROM appointments a JOIN patients p ON a.patient_id = p.id JOIN users u ON p.user_id = u.id WHERE a.doctor_id = ?',
                    [doctorId]
                );
                console.log(`Found ${appointments.length} appointments:`, appointments);
                
                // Check diagnoses
                console.log('\n=== Checking Diagnoses ===');
                const [diagnoses] = await conn.query(
                    'SELECT id, patient_id, doctor_id, diagnosis_name, severity FROM diagnoses WHERE doctor_id = ?',
                    [doctorId]
                );
                console.log(`Found ${diagnoses.length} diagnoses:`, diagnoses);
                
                // Check all appointments regardless of doctor
                console.log('\n=== All Appointments ===');
                const [allAppts] = await conn.query('SELECT COUNT(*) as count FROM appointments');
                console.log('Total appointments in DB:', allAppts);
                
                // Check all diagnoses
                console.log('\n=== All Diagnoses ===');
                const [allDiag] = await conn.query('SELECT COUNT(*) as count FROM diagnoses');
                console.log('Total diagnoses in DB:', allDiag);
            }
        }
        
        await conn.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

testData();
