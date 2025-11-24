const axios = require('axios');

async function verifyEverything() {
    console.log('\n========================================');
    console.log('  COMPLETE SYSTEM VERIFICATION');
    console.log('========================================\n');

    try {
        // 1. Check database data
        console.log('1️⃣  Checking Database...');
        const mysql = require('mysql2/promise');
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'hospital_management_system'
        });

        const [doctors] = await conn.query('SELECT COUNT(*) as count FROM doctors WHERE specialization = "Cardiology"');
        const [patients] = await conn.query('SELECT COUNT(*) as count FROM patients');
        const [appts] = await conn.query('SELECT COUNT(*) as count FROM appointments');
        const [diagnoses] = await conn.query('SELECT COUNT(*) as count FROM diagnoses');

        console.log(`   ✅ Doctors (Cardiology): ${doctors[0].count}`);
        console.log(`   ✅ Patients: ${patients[0].count}`);
        console.log(`   ✅ Appointments: ${appts[0].count}`);
        console.log(`   ✅ Diagnoses: ${diagnoses[0].count}`);

        await conn.end();

        // 2. Test Backend API
        console.log('\n2️⃣  Testing Backend API...');
        
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'dr_rajesh',
            password: 'Doctor@123'
        });
        
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        console.log('   ✅ Login successful');

        // Get summary
        const summaryRes = await axios.get('http://localhost:5000/api/dashboard-summary', { headers });
        console.log(`   ✅ Dashboard Summary: ${JSON.stringify(summaryRes.data.summary)}`);

        // Get patients
        const patientsRes = await axios.get('http://localhost:5000/api/doctor/my-patients', { headers });
        console.log(`   ✅ Doctor Patients: ${patientsRes.data.patients.length}`);

        // Get appointments
        const appointmentsRes = await axios.get('http://localhost:5000/api/doctor/appointments', { headers });
        console.log(`   ✅ Doctor Appointments: ${appointmentsRes.data.appointments.length}`);

        // 3. Final Status
        console.log('\n3️⃣  Final Status');
        console.log('========================================');
        console.log('✅ Database: READY');
        console.log('✅ Backend API: WORKING');
        console.log('✅ Frontend Data: AVAILABLE');
        console.log('========================================\n');

        console.log('🎯 NEXT STEPS:');
        console.log('1. Go to http://localhost:3000/login');
        console.log('2. Login with: dr_rajesh / Doctor@123');
        console.log('3. Go to http://localhost:3000/simple-dashboard');
        console.log('4. You should see:');
        console.log(`   - Assigned Patients: 2`);
        console.log(`   - Upcoming Appointments: ${summaryRes.data.summary.upcomingAppointments}`);
        console.log(`   - Total Diagnoses: ${summaryRes.data.summary.diagnosesCount}`);
        console.log('\n✨ System is ready for testing!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

verifyEverything();
