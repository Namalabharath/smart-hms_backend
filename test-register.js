const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testRegister() {
    console.log('🔍 Testing Registration Endpoint...\n');

    const testData = {
        username: 'testuser_' + Date.now(),
        email: 'test_' + Date.now() + '@example.com',
        password: 'TestPassword@123',
        role: 'patient',
        firstName: 'Test',
        lastName: 'User'
    };

    console.log('📝 Registration Data:', testData);
    console.log('');

    try {
        console.log('📤 Sending POST request to /auth/register...');
        const response = await axios.post(`${API_URL}/auth/register`, testData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Registration Successful!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        console.log('\nNew user created:');
        console.log('  ID:', response.data.user?.id);
        console.log('  Username:', response.data.user?.username);
        console.log('  Role:', response.data.user?.role);

        // Try to login with the new account
        console.log('\n🔐 Testing login with new account...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            username: testData.username,
            password: testData.password
        });

        console.log('✅ Login Successful!');
        console.log('Token received:', loginResponse.data.token?.substring(0, 20) + '...');
        console.log('User info:', loginResponse.data.user);

    } catch (error) {
        console.error('❌ Error:', error.response?.status, error.response?.statusText);
        console.error('Error message:', error.response?.data);
        console.error('Full error:', error.message);
    }
}

testRegister();
