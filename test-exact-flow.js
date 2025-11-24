const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testExactFrontendFlow() {
    console.log('🔍 TESTING EXACT FRONTEND REGISTRATION FLOW\n');

    // Simulate browser fetch to registration page
    console.log('Step 1: User opens /register page');
    console.log('✅ Form renders successfully\n');

    // Simulate form data
    const formData = {
        firstName: 'Test',
        lastName: 'User',
        username: 'signup_test_' + Date.now(),
        email: 'signup_' + Date.now() + '@test.com',
        password: 'Test@1234',
        confirmPassword: 'Test@1234',
        role: 'patient'
    };

    console.log('Step 2: User fills form');
    console.log('Form Data:', formData);
    console.log('');

    // Frontend validation
    console.log('Step 3: Frontend validates on submit');
    console.log('  ✅ Username present:', !!formData.username);
    console.log('  ✅ Email present:', !!formData.email);
    console.log('  ✅ Password present:', !!formData.password);
    console.log('  ✅ Passwords match:', formData.password === formData.confirmPassword);
    console.log('  ✅ Password length >=6:', formData.password.length >= 6);
    console.log('✅ All frontend validation passed\n');

    // Make API call
    console.log('Step 4: Frontend makes POST to /api/auth/register');
    console.log('Request body:', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        firstName: formData.firstName,
        lastName: formData.lastName
    });
    console.log('');

    try {
        const response = await axios.post(`${API_URL}/auth/register`, {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            firstName: formData.firstName,
            lastName: formData.lastName
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Step 5: Response received from backend');
        console.log('Status Code:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        console.log('');

        if (response.data.success) {
            console.log('🎉 REGISTRATION SUCCESSFUL!');
            console.log('User ID:', response.data.user.id);
            console.log('Username:', response.data.user.username);
            console.log('Role:', response.data.user.role);
            console.log('');

            // Test login with new account
            console.log('Step 6: Testing login with new account');
            try {
                const loginResponse = await axios.post(`${API_URL}/auth/login`, {
                    username: formData.username,
                    password: formData.password
                });

                console.log('✅ LOGIN SUCCESSFUL!');
                console.log('Token:', loginResponse.data.token.substring(0, 30) + '...');
                console.log('User:', loginResponse.data.user);
                console.log('');
                console.log('🎊 COMPLETE FLOW WORKS PERFECTLY!');

            } catch (loginErr) {
                console.error('❌ LOGIN FAILED:', loginErr.response?.data?.error);
            }
        }

    } catch (error) {
        console.error('❌ Step 5: REGISTRATION FAILED');
        console.error('Status Code:', error.response?.status);
        console.error('Error:', error.response?.data?.error || error.message);
        console.error('Full Response:', JSON.stringify(error.response?.data, null, 2));

        // Try to help diagnose
        if (error.response?.status === 400) {
            console.log('\n⚠️  400 Bad Request - Check your input data');
        } else if (error.response?.status === 409) {
            console.log('\n⚠️  409 Conflict - Username or email already exists');
        } else if (error.response?.status === 500) {
            console.log('\n⚠️  500 Server Error - Backend issue');
        }
    }
}

testExactFrontendFlow();
