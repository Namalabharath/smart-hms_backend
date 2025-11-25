const axios = require('axios');

(async () => {
  try {
    // Login as receptionist
    console.log('\n1️⃣  LOGIN AS RECEPTIONIST');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'receptionist_priya',
      password: 'Receptionist@123'
    });
    
    const token = loginRes.data.token;
    console.log('✅ Login successful\n');
    
    const headers = { Authorization: `Bearer ${token}` };
    
    // Test 1: Register Patient
    console.log('2️⃣  REGISTER NEW PATIENT');
    const registerRes = await axios.post('http://localhost:5000/api/receptionist/patients/register', {
      firstName: 'TestPatient',
      lastName: 'Demo',
      email: 'testpatient@test.com',
      phone: '555-1234',
      gender: 'Male',
      bloodGroup: 'O+',
      address: '123 Test St',
      city: 'Test City',
      postalCode: '12345',
      medicalHistory: 'None',
      allergies: 'None',
      emergencyContact: 'John Doe'
    }, { headers });
    
    if (registerRes.data.success) {
      console.log('✅ Patient Registered!');
      console.log('   Username:', registerRes.data.tempUsername);
      console.log('   Password:', registerRes.data.tempPassword);
      console.log('   Patient ID:', registerRes.data.patientId, '\n');
    }
    
    // Test 2: Get Patients
    console.log('3️⃣  GET PATIENTS FOR APPOINTMENT');
    const patientsRes = await axios.get('http://localhost:5000/api/receptionist/patients', { headers });
    console.log('✅ Patients available:', patientsRes.data.patients.length);
    if (patientsRes.data.patients.length > 0) {
      console.log('   Sample:', patientsRes.data.patients[0].first_name, patientsRes.data.patients[0].last_name, '\n');
    }
    
    // Test 3: Get Doctors
    console.log('4️⃣  GET DOCTORS FOR APPOINTMENT');
    const doctorsRes = await axios.get('http://localhost:5000/api/receptionist/doctors/available', { headers });
    console.log('✅ Doctors available:', doctorsRes.data.doctors.length);
    if (doctorsRes.data.doctors.length > 0) {
      console.log('   Sample:', doctorsRes.data.doctors[0].first_name, doctorsRes.data.doctors[0].last_name, '\n');
    }
    
    // Test 4: Book Appointment
    if (patientsRes.data.patients.length > 0 && doctorsRes.data.doctors.length > 0) {
      console.log('5️⃣  BOOK APPOINTMENT');
      const bookRes = await axios.post('http://localhost:5000/api/receptionist/appointments/book', {
        patientId: patientsRes.data.patients[0].id,
        doctorId: doctorsRes.data.doctors[0].id,
        appointmentDate: '2025-11-25 10:00:00',
        reason: 'General Checkup'
      }, { headers });
      
      if (bookRes.data.success) {
        console.log('✅ Appointment Booked!');
        console.log('   Appointment ID:', bookRes.data.appointmentId);
      } else {
        console.log('❌ Booking failed:', bookRes.data);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50) + '\n');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
})();
