const axios = require('axios');

async function fullTest() {
    try {
        // Step 1: Login
        console.log('Step 1: Login...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'dr_rajesh',
            password: 'Doctor@123'
        });
        
        const token = loginRes.data.token;
        const user = loginRes.data.user;
        console.log('✅ Login successful');
        console.log('Token:', token.substring(0, 50) + '...');
        console.log('User:', user);
        
        // Step 2: Make API call with token (like frontend does)
        console.log('\nStep 2: Call dashboard-summary with token...');
        const headers = { Authorization: `Bearer ${token}` };
        const summaryRes = await axios.get('http://localhost:5000/api/dashboard-summary', { headers });
        
        console.log('✅ API call successful');
        console.log('Response:', JSON.stringify(summaryRes.data, null, 2));
        
        // Step 3: Call my-patients (like frontend does)
        console.log('\nStep 3: Call doctor/my-patients with token...');
        const patientsRes = await axios.get('http://localhost:5000/api/doctor/my-patients', { headers });
        
        console.log('✅ Patients API call successful');
        console.log(`Number of patients: ${patientsRes.data.patients?.length || 0}`);
        if (patientsRes.data.patients?.length > 0) {
            console.log('First patient:', patientsRes.data.patients[0]);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

fullTest();
