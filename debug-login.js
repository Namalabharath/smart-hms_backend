const axios = require('axios');

async function debugLogin() {
    try {
        console.log('\n=== LOGIN TEST ===');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'dr_rajesh',
            password: 'Doctor@123'
        });
        
        console.log('Login Response:', JSON.stringify(loginRes.data, null, 2));
        const token = loginRes.data.token;
        const user = loginRes.data.user;
        
        console.log('\n=== TOKEN AND USER DATA ===');
        console.log('Token:', token);
        console.log('User:', user);
        
        const headers = { Authorization: `Bearer ${token}` };
        
        console.log('\n=== DASHBOARD SUMMARY ===');
        try {
            const summaryRes = await axios.get('http://localhost:5000/api/dashboard-summary', { headers });
            console.log('Dashboard Summary:', JSON.stringify(summaryRes.data, null, 2));
        } catch (e) {
            console.log('Error:', e.response?.data || e.message);
        }
        
        console.log('\n=== MY PATIENTS ===');
        try {
            const patientsRes = await axios.get('http://localhost:5000/api/doctor/my-patients', { headers });
            console.log('My Patients:', JSON.stringify(patientsRes.data, null, 2));
        } catch (e) {
            console.log('Error:', e.response?.data || e.message);
        }
        
        console.log('\n=== APPOINTMENTS ===');
        try {
            const appointmentsRes = await axios.get('http://localhost:5000/api/doctor/appointments', { headers });
            console.log('Appointments:', JSON.stringify(appointmentsRes.data, null, 2));
        } catch (e) {
            console.log('Error:', e.response?.data || e.message);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

debugLogin();
