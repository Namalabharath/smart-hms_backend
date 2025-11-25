const axios = require('axios');

// Simple test - just check if the endpoints are accessible and what they return
(async () => {
  try {
    console.log('🧪 Testing Receptionist APIs...\n');
    
    // First, let's just try to call the endpoints WITHOUT auth to see if they respond
    console.log('TEST 1: Patients endpoint (no auth)');
    try {
      const res = await axios.get('http://localhost:5000/api/receptionist/patients', { timeout: 5000 });
      console.log('✅ Response:', res.data);
    } catch (e) {
      console.log('❌ Error:', e.response?.status, e.response?.data);
    }

    console.log('\nTEST 2: Doctors endpoint (no auth)');
    try {
      const res = await axios.get('http://localhost:5000/api/receptionist/doctors/available', { timeout: 5000 });
      console.log('✅ Response:', res.data);
    } catch (e) {
      console.log('❌ Error:', e.response?.status, e.response?.data);
    }

    console.log('\nTEST 3: Testing base API');
    try {
      const res = await axios.get('http://localhost:5000/api', { timeout: 5000 });
      console.log('✅ Response:', res.data);
    } catch (e) {
      console.log('❌ Error:', e.response?.status, e.response?.data);
    }

    console.log('\nTEST 4: Testing health check');
    try {
      const res = await axios.get('http://localhost:5000/health', { timeout: 5000 });
      console.log('✅ Response:', res.data);
    } catch (e) {
      console.log('❌ Error:', e.response?.status, e.response?.data);
    }

  } catch (error) {
    console.error('Fatal error:', error.message);
  }
})();
