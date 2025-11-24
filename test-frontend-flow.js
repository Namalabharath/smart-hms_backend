const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testFrontendFlow() {
    console.log('🔍 Simulating Frontend Registration Flow...\n');

    const testData = {
        username: 'frontend_test_' + Date.now(),
        email: 'frontend_' + Date.now() + '@test.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'patient',
        firstName: 'Frontend',
        lastName: 'Test'
    };

    console.log('📝 Form Data:', testData);
    console.log('\n1️⃣ Validating on frontend (simulated)...');
    
    // Simulate frontend validation
    if (!testData.username || !testData.email || !testData.password) {
        console.log('❌ Frontend validation failed: Missing fields');
        return;
    }

    if (testData.password !== testData.confirmPassword) {
        console.log('❌ Frontend validation failed: Passwords do not match');
        return;
    }

    if (testData.password.length < 6) {
        console.log('❌ Frontend validation failed: Password too short');
        return;
    }

    console.log('✅ Frontend validation passed\n');

    console.log('2️⃣ Sending registration request to /auth/register...');

    try {
        const response = await axios.post(`${API_URL}/auth/register`, {
            username: testData.username,
            email: testData.email,
            password: testData.password,
            role: testData.role,
            firstName: testData.firstName,
            lastName: testData.lastName
        });

        console.log('✅ SUCCESS! User registered');
        console.log('Response:', response.data);
        console.log('\n📋 User Details:');
        console.log('  - ID:', response.data.user.id);
        console.log('  - Username:', response.data.user.username);
        console.log('  - Role:', response.data.user.role);
        console.log('\n3️⃣ Frontend would now redirect to login page after 2 seconds');

    } catch (error) {
        console.error('❌ REGISTRATION FAILED');
        console.error('Status:', error.response?.status);
        console.error('Error:', error.response?.data?.error || error.message);
        if (error.response?.data) {
            console.error('Full response:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testFrontendFlow();
