const axios = require('axios');

async function testDoctorAPI() {
    try {
        console.log('🔐 Step 1: Logging in as dr_rajesh...');
        
        // Login
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'dr_rajesh',
            password: 'Doctor@123'
        });
        
        console.log('✅ Login successful');
        console.log('Token:', loginRes.data.token);
        console.log('User:', loginRes.data.user);
        
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        
        // Decode token to see what's inside
        const parts = token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log('\n📋 JWT Payload:', payload);
        
        // Dashboard Summary
        console.log('\n📊 Step 2: Calling /api/dashboard-summary...');
        const summaryRes = await axios.get('http://localhost:5000/api/dashboard-summary', { headers });
        console.log('Summary Response:', JSON.stringify(summaryRes.data, null, 2));
        
        // My Patients
        console.log('\n👥 Step 3: Calling /api/doctor/my-patients...');
        const patientsRes = await axios.get('http://localhost:5000/api/doctor/my-patients', { headers });
        console.log('Patients Response:', JSON.stringify(patientsRes.data, null, 2));
        
        // Appointments
        console.log('\n📅 Step 4: Calling /api/doctor/appointments...');
        const appointmentsRes = await axios.get('http://localhost:5000/api/doctor/appointments', { headers });
        console.log('Appointments Response:', JSON.stringify(appointmentsRes.data, null, 2));
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testDoctorAPI();
