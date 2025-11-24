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
    if (!adminToken) throw new Error('No token received');
  })) passCount++;

  totalCount++;
  if (await test('Login as Doctor', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'doctor1',
      password: 'Doctor@123'
    });
    doctorToken = res.data.token;
    testData.doctorUserId = res.data.user.id;
    if (!doctorToken) throw new Error('No token received');
  })) passCount++;

  totalCount++;
  if (await test('Login as Patient', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'patient1',
      password: 'Patient@123'
    });
    patientToken = res.data.token;
    testData.patientUserId = res.data.user.id;
    if (!patientToken) throw new Error('No token received');
  })) passCount++;

  totalCount++;
  if (await test('Verify Current User (Admin)', async () => {
    const res = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.data.user) throw new Error('No user data returned');
  })) passCount++;

  // ============================================
  // PATIENT MANAGEMENT TESTS
  // ============================================
  console.log('\n📝 PATIENT MANAGEMENT TESTS');
  console.log('─'.repeat(60));

  totalCount++;
  if (await test('Get All Patients', async () => {
    const res = await axios.get(`${BASE_URL}/patients`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!Array.isArray(res.data.patients)) throw new Error('Invalid response format');
    testData.totalPatients = res.data.patients.length;
  })) passCount++;

  totalCount++;
  if (await test('Get Patient Details', async () => {
    const res = await axios.get(`${BASE_URL}/patients/1`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.data.patient) throw new Error('No patient data');
  })) passCount++;

  totalCount++;
  if (await test('Get Patient Medical Records', async () => {
    const res = await axios.get(`${BASE_URL}/patients/1/medical-records`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.data.diagnoses) throw new Error('No diagnoses data');
  })) passCount++;

  // ============================================
  // DOCTOR TESTS
  // ============================================
  console.log('\n📝 DOCTOR MANAGEMENT TESTS');
  console.log('─'.repeat(60));

  totalCount++;
  if (await test('Get All Doctors', async () => {
    const res = await axios.get(`${BASE_URL}/doctors`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!Array.isArray(res.data.doctors)) throw new Error('Invalid response');
    testData.totalDoctors = res.data.doctors.length;
  })) passCount++;

  totalCount++;
  if (await test('Get Doctor Details', async () => {
    const res = await axios.get(`${BASE_URL}/doctors/1`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.data.doctor) throw new Error('No doctor data');
  })) passCount++;

  totalCount++;
  if (await test('Doctor Get My Patients', async () => {
    const res = await axios.get(`${BASE_URL}/doctors/my-patients`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    if (!Array.isArray(res.data.patients)) throw new Error('Invalid response');
  })) passCount++;

  // ============================================
  // APPOINTMENT TESTS
  // ============================================
  console.log('\n📝 APPOINTMENT MANAGEMENT TESTS');
  console.log('─'.repeat(60));

  totalCount++;
  if (await test('Get All Appointments', async () => {
    const res = await axios.get(`${BASE_URL}/appointments`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!Array.isArray(res.data.appointments)) throw new Error('Invalid response');
    testData.totalAppointments = res.data.appointments.length;
  })) passCount++;

  totalCount++;
  if (await test('Create New Appointment', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().slice(0, 19).replace('T', ' ');
    
    const res = await axios.post(`${BASE_URL}/appointments`, {
      patientId: 1,
      doctorId: 1,
      appointmentDate: dateStr,
      reason: 'Follow-up consultation',
      status: 'scheduled'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.data.success) throw new Error('Failed to create');
    testData.newAppointmentId = res.data.appointmentId;
  })) passCount++;

  totalCount++;
  if (await test('Update Appointment Status', async () => {
    const appointId = testData.newAppointmentId || 1;
    const res = await axios.put(`${BASE_URL}/appointments/${appointId}`, {
      status: 'completed'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.data.success) throw new Error('Failed to update');
  })) passCount++;

  // ============================================
  // DIAGNOSIS TESTS
  // ============================================
  console.log('\n📝 DIAGNOSIS MANAGEMENT TESTS');
  console.log('─'.repeat(60));

  totalCount++;
  if (await test('Get Patient Diagnoses', async () => {
    const res = await axios.get(`${BASE_URL}/patients/1/diagnoses`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!Array.isArray(res.data.diagnoses)) throw new Error('Invalid response');
  })) passCount++;

  totalCount++;
  if (await test('Add Diagnosis by Doctor', async () => {
    const res = await axios.post(`${BASE_URL}/diagnoses`, {
      patientId: 1,
      diagnosisName: 'New Test Diagnosis',
      icdCode: 'TEST001',
      severity: 'mild',
      description: 'Test diagnosis for API testing'
    }, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    if (!res.data.success) throw new Error('Failed to add diagnosis');
  })) passCount++;

  // ============================================
  // PRESCRIPTION TESTS
  // ============================================
  console.log('\n📝 PRESCRIPTION MANAGEMENT TESTS');
  console.log('─'.repeat(60));

  totalCount++;
  if (await test('Get All Prescriptions', async () => {
    const res = await axios.get(`${BASE_URL}/prescriptions`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!Array.isArray(res.data.prescriptions)) throw new Error('Invalid response');
  })) passCount++;

  totalCount++;
  if (await test('Create New Prescription', async () => {
    const res = await axios.post(`${BASE_URL}/prescriptions`, {
      patientId: 1,
      doctorId: 1,
      medicationId: 1,
      dosage: '1 tablet',
      frequency: 'Once daily',
      duration: '7 days',
      quantity: 7
    }, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    if (!res.data.success) throw new Error('Failed to create');
  })) passCount++;

  totalCount++;
  if (await test('Update Prescription Status', async () => {
    const res = await axios.put(`${BASE_URL}/prescriptions/1`, {
      status: 'dispensed'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.data.success) throw new Error('Failed to update');
  })) passCount++;

  // ============================================
  // MEDICATION TESTS
  // ============================================
  console.log('\n📝 MEDICATION INVENTORY TESTS');
  console.log('─'.repeat(60));

  totalCount++;
  if (await test('Get All Medications', async () => {
    const res = await axios.get(`${BASE_URL}/medications`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!Array.isArray(res.data.medications)) throw new Error('Invalid response');
    testData.totalMedications = res.data.medications.length;
  })) passCount++;

  totalCount++;
  if (await test('Get Low Stock Medications', async () => {
    const res = await axios.get(`${BASE_URL}/medications/low-stock`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!Array.isArray(res.data.medications)) throw new Error('Invalid response');
  })) passCount++;

  totalCount++;
  if (await test('Update Medication Stock', async () => {
    const res = await axios.put(`${BASE_URL}/medications/1`, {
      stockQuantity: 150
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.data.success) throw new Error('Failed to update stock');
  })) passCount++;

  // ============================================
  // VITAL SIGNS TESTS
  // ============================================
  console.log('\n📝 VITAL SIGNS MANAGEMENT TESTS');
  console.log('─'.repeat(60));

  totalCount++;
  if (await test('Get Patient Vital Signs', async () => {
    const res = await axios.get(`${BASE_URL}/vital-signs?patientId=1`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!Array.isArray(res.data.vitalSigns)) throw new Error('Invalid response');
  })) passCount++;

  totalCount++;
  if (await test('Record New Vital Signs', async () => {
    const res = await axios.post(`${BASE_URL}/vital-signs`, {
      patientId: 1,
      temperature: 98.6,
      heartRate: 72,
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      oxygenSaturation: 98.5,
      glucoseLevel: 105,
      weight: 75.5,
      height: 175
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.data.success) throw new Error('Failed to record vital signs');
  })) passCount++;

  // ============================================
  // LAB TESTS
  // ============================================
  console.log('\n📝 LAB REQUEST MANAGEMENT TESTS');
  console.log('─'.repeat(60));

  totalCount++;
  if (await test('Get Lab Requests', async () => {
    const res = await axios.get(`${BASE_URL}/lab-requests`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!Array.isArray(res.data.labRequests)) throw new Error('Invalid response');
  })) passCount++;

  totalCount++;
  if (await test('Create Lab Request', async () => {
    const res = await axios.post(`${BASE_URL}/lab-requests`, {
      patientId: 1,
      doctorId: 1,
      testName: 'Complete Blood Count',
      testType: 'Blood Test',
      reason: 'Routine checkup'
    }, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    if (!res.data.success) throw new Error('Failed to create');
  })) passCount++;

  totalCount++;
  if (await test('Get Lab Results', async () => {
    const res = await axios.get(`${BASE_URL}/lab-results`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!Array.isArray(res.data.labResults)) throw new Error('Invalid response');
  })) passCount++;

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n' + '═'.repeat(60));
  console.log(`\n📊 TEST SUMMARY`);
  console.log(`   Passed: ${passCount}/${totalCount}`);
  console.log(`   Failed: ${totalCount - passCount}/${totalCount}`);
  console.log(`   Success Rate: ${Math.round((passCount / totalCount) * 100)}%`);
  
  console.log(`\n📈 DATA OVERVIEW:`);
  console.log(`   Total Patients: ${testData.totalPatients || 'N/A'}`);
  console.log(`   Total Doctors: ${testData.totalDoctors || 'N/A'}`);
  console.log(`   Total Appointments: ${testData.totalAppointments || 'N/A'}`);
  console.log(`   Total Medications: ${testData.totalMedications || 'N/A'}\n`);
  
  if (passCount === totalCount) {
    console.log('🎉 ALL TESTS PASSED! System is fully functional.');
  } else {
    console.log(`⚠️  ${totalCount - passCount} test(s) failed. See errors above.`);
  }
  
  console.log('\n' + '═'.repeat(60) + '\n');
  
  process.exit(passCount === totalCount ? 0 : 1);
}

// Run tests
runTests().catch(err => {
  console.error('Test suite error:', err.message);
  process.exit(1);
});
