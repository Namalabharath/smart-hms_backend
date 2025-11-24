const axios = require('axios');

(async () => {
  try {
    // Login first
    console.log('1️⃣  Logging in as receptionist_priya...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'receptionist_priya',
      password: 'Receptionist@123'
    });
    
    const token = loginRes.data.token;
    console.log('✅ Login successful, got token\n');
    
    const headers = { Authorization: `Bearer ${token}` };
    
    // Test patients endpoint
    console.log('2️⃣  Testing /api/receptionist/patients...');
    try {
      const patientsRes = await axios.get('http://localhost:5000/api/receptionist/patients', { headers });
      console.log('✅ Status:', patientsRes.status);
      console.log('✅ Patients found:', patientsRes.data.patients?.length);
      if (patientsRes.data.patients?.length > 0) {
        console.log('Sample patient:', patientsRes.data.patients[0].first_name);
      }
    } catch (e) {
      console.error('❌ Patients endpoint error:', e.response?.status, e.response?.data);
    }
    
    console.log();
    
    // Test doctors endpoint
    console.log('3️⃣  Testing /api/receptionist/doctors/available...');
    try {
      const doctorsRes = await axios.get('http://localhost:5000/api/receptionist/doctors/available', { headers });
      console.log('✅ Status:', doctorsRes.status);
      console.log('✅ Doctors found:', doctorsRes.data.doctors?.length);
      if (doctorsRes.data.doctors?.length > 0) {
        console.log('Sample doctor:', doctorsRes.data.doctors[0].first_name);
      }
    } catch (e) {
      console.error('❌ Doctors endpoint error:', e.response?.status, e.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.response?.data || error.message);
  }
})();
