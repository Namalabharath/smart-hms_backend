const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login with plain password...\n');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'receptionist_priya',
      password: 'Receptionist@123'
    });
    
    console.log('✅ Login successful!');
    console.log('Token:', response.data.token?.substring(0, 50) + '...');
    console.log('User:', response.data.user);
    
    // Now test the API calls
    const token = response.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('\n📡 Testing /receptionist/patients endpoint...');
    const patientsRes = await axios.get('http://localhost:5000/api/receptionist/patients', { headers });
    console.log('✅ Patients:', patientsRes.data.patients?.length || 'None');
    if (patientsRes.data.patients?.length > 0) {
      console.log('   Sample:', patientsRes.data.patients[0].first_name, patientsRes.data.patients[0].last_name);
    }
    
    console.log('\n📡 Testing /receptionist/doctors/available endpoint...');
    const doctorsRes = await axios.get('http://localhost:5000/api/receptionist/doctors/available', { headers });
    console.log('✅ Doctors:', doctorsRes.data.doctors?.length || 'None');
    if (doctorsRes.data.doctors?.length > 0) {
      console.log('   Sample:', doctorsRes.data.doctors[0].first_name, doctorsRes.data.doctors[0].last_name);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testLogin();
