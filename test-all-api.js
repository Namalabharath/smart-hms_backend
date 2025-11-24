const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let adminToken = '';
let doctorToken = '';
let patientToken = '';
let testData = {};

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║      HOSPITAL MANAGEMENT SYSTEM - API TEST SUITE         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  let passCount = 0;
  let totalCount = 0;

  // ============================================
  // AUTHENTICATION TESTS
  // ============================================
  console.log('\n📝 AUTHENTICATION TESTS');
  console.log('─'.repeat(60));

  totalCount++;
  if (await test('Login as Admin', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    adminToken = res.data.token;
    testData.adminId = res.data.user.id;
  })) passCount++;

  totalCount++;
  if (await test('Login as Doctor', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'doctor1',
      password: 'Doctor@123'
    });
    doctorToken = res.data.token;
    testData.doctorUserId = res.data.user.id;
  })) passCount++;

  totalCount++;
  if (await test('Login as Patient', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'patient1',
      password: 'Patient@123'
    });
    patientToken = res.data.token;
    testData.patientUserId = res.data.user.id;
  })) passCount++;

  // Get doctor ID from database using doctor user ID
  totalCount++;
  if (await test('Verify Current User', async () => {
    const res = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.data.user) throw new Error('No user data returned');
  })) passCount++;

  // ============================================
  // PATIENT TESTS
  // ============================================
  console.log('\n📝 PATIENT TESTS');
  console.log('─'.repeat(60));

  totalCount++;
  if (await test('Get Patient Profile', async () => {
    const res = await axios.get(`${BASE_URL}/patients/profile`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    testData.patientId = res.data.patient?.id;
    if (!res.data.patient) throw new Error('No patient profile found');
  })) passCount++;

  totalCount++;
  if (await test('Get Patient Appointments', async () => {
    const res = await axios.get(`${BASE_URL}/patients/appointments`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    if (!Array.isArray(res.data.appointments)) throw new Error('Invalid response');
  })) passCount++;

  totalCount++;
  if (await test('Get Patient Prescriptions', async () => {
    const res = await axios.get(`${BASE_URL}/patients/prescriptions`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    if (!Array.isArray(res.data.prescriptions)) throw new Error('Invalid response');
  })) passCount++;

  totalCount++;
  if (await test('Get Patient Diagnoses', async () => {
    const res = await axios.get(`${BASE_URL}/patients/diagnoses`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    if (!Array.isArray(res.data.diagnoses)) throw new Error('Invalid response');
  })) passCount++;

  totalCount++;
  if (await test('Get Patient Lab Results', async () => {
    const res = await axios.get(`${BASE_URL}/patients/lab-results`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    if (!Array.isArray(res.data.labResults)) throw new Error('Invalid response');
  })) passCount++;

  // ============================================
  // DOCTOR TESTS
  // ============================================
  console.log('\n📝 DOCTOR TESTS');
  console.log('─'.repeat(60));

  totalCount++;
  if (await test('Doctor - Get My Patients', async () => {
    const res = await axios.get(`${BASE_URL}/doctors/patients`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    if (!Array.isArray(res.data.patients)) throw new Error('Invalid response');
  })) passCount++;

  totalCount++;
  if (await test('Doctor - Get Appointments', async () => {
    const res = await axios.get(`${BASE_URL}/doctors/appointments`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    if (!Array.isArray(res.data.appointments)) throw new Error('Invalid response');
  })) passCount++;

  totalCount++;
  if (await test('Doctor - Add Diagnosis', async () => {
    if (!testData.patientId) {
      // Get a patient ID
      const [patientRes] = await axios.get(`${BASE_URL}/appointments`, {
        headers: { Authorization: `Bearer ${doctorToken}` }
      });
      testData.patientId = 1;
    }
    
    const res = await axios.post(`${BASE_URL}/doctors/diagnosis`, {
      patientId: testData.patientId || 1,
      diagnosisName: 'Test Diagnosis',
      icdCode: 'TEST123',
      severity: 'mild',
      description: 'Test diagnosis added by API'
    }, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    if (!res.data.success) throw new Error('Failed to add diagnosis');
  })) passCount++;

  // ============================================
  // APPOINTMENT TESTS
  // ============================================
  console.log('\n📝 APPOINTMENT TESTS');
  console.log('─'.repeat(60));

  totalCount++;
  if (await test('Get All Appointments', async () => {
    const res = await axios.get(`${BASE_URL}/appointments`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!Array.isArray(res.data.appointments)) throw new Error('Invalid response');
  })) passCount++;

  totalCount++;
  if (await test('Schedule Appointment', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    
    const res = await axios.post(`${BASE_URL}/appointments`, {
      patientId: 1,
      doctorId: 1,
      appointmentDate: futureDate.toISOString().slice(0, 19).replace('T', ' '),
      reason: 'Follow-up consultation',
      status: 'scheduled'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.data.success) throw new Error('Failed to schedule appointment');
  })) passCount++;

  // ============================================
  // MEDICATION TESTS
  // ============================================
  console.log('\n📝 MEDICATION TESTS');
  console.log('─'.repeat(60));

  totalCount++;
  if (await test('Get All Medications', async () => {
    const res = await axios.get(`${BASE_URL}/medications`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!Array.isArray(res.data.medications)) throw new Error('Invalid response');
  })) passCount++;

  totalCount++;
  if (await test('Get Low Stock Medications', async () => {
    const res = await axios.get(`${BASE_URL}/medications/low-stock`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!Array.isArray(res.data.medications)) throw new Error('Invalid response');
  })) passCount++;

  // ============================================
  // PRESCRIPTION TESTS
  // ============================================
  console.log('\n📝 PRESCRIPTION TESTS');
  console.log('─'.repeat(60));

  totalCount++;
  if (await test('Get Prescriptions', async () => {
    const res = await axios.get(`${BASE_URL}/prescriptions`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!Array.isArray(res.data.prescriptions)) throw new Error('Invalid response');
  })) passCount++;

  totalCount++;
  if (await test('Update Prescription Status', async () => {
    const res = await axios.put(`${BASE_URL}/prescriptions/1`, {
      status: 'dispensed'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.data.success && res.status !== 404) throw new Error('Failed to update prescription');
  })) passCount++;

  // ============================================
  // LAB TESTS
  // ============================================
  console.log('\n📝 LAB TESTS');
  console.log('─'.repeat(60));

  totalCount++;
  if (await test('Get Lab Requests', async () => {
    const res = await axios.get(`${BASE_URL}/lab-requests`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!Array.isArray(res.data.labRequests)) throw new Error('Invalid response');
  })) passCount++;

  totalCount++;
  if (await test('Get Lab Results', async () => {
    const res = await axios.get(`${BASE_URL}/lab-results`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!Array.isArray(res.data.labResults)) throw new Error('Invalid response');
  })) passCount++;

  // ============================================
  // VITAL SIGNS TESTS
  // ============================================
  console.log('\n📝 VITAL SIGNS TESTS');
  console.log('─'.repeat(60));

  totalCount++;
  if (await test('Get Vital Signs', async () => {
    const res = await axios.get(`${BASE_URL}/vital-signs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!Array.isArray(res.data.vitalSigns)) throw new Error('Invalid response');
  })) passCount++;

  totalCount++;
  if (await test('Record Vital Signs', async () => {
    const res = await axios.post(`${BASE_URL}/vital-signs`, {
      patientId: 1,
      temperature: 98.6,
      heartRate: 72,
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      oxygenSaturation: 98.5,
      glucoseLevel: 110,
      weight: 75.5,
      height: 175
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.data.success && res.status !== 404) throw new Error('Failed to record vital signs');
  })) passCount++;

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n' + '═'.repeat(60));
  console.log(`\n📊 TEST SUMMARY`);
  console.log(`   Passed: ${passCount}/${totalCount}`);
  console.log(`   Failed: ${totalCount - passCount}/${totalCount}`);
  console.log(`   Success Rate: ${Math.round((passCount / totalCount) * 100)}%\n`);
  
  if (passCount === totalCount) {
    console.log('🎉 ALL TESTS PASSED! System is fully functional.');
  } else {
    console.log(`⚠️  ${totalCount - passCount} test(s) failed. Check the errors above.`);
  }
  
  console.log('\n' + '═'.repeat(60) + '\n');
  
  process.exit(passCount === totalCount ? 0 : 1);
}

// Run tests
runTests().catch(err => {
  console.error('Test suite error:', err.message);
  process.exit(1);
});
