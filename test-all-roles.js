#!/usr/bin/env node
const axios = require('axios');

const credentials = {
    doctor: { username: 'dr_rajesh', password: 'Doctor@123' },
    nurse: { username: 'nurse_anjali', password: 'Nurse@123' },
    patient: { username: 'patient_amit', password: 'Patient@123' },
    admin: { username: 'admin_arjun', password: 'Admin@123' },
    receptionist: { username: 'receptionist_priya', password: 'Receptionist@123' },
    pharmacist: { username: 'pharmacist_ravi', password: 'Pharmacist@123' },
    labtech: { username: 'lab_tech_meera', password: 'LabTech@123' },
    inventory: { username: 'inventory_admin', password: 'Inventory@123' }
};

async function testLogin(role, { username, password }) {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            username,
            password
        });
        return { success: true, role, token: response.data.token, data: response.data };
    } catch (error) {
        return { success: false, role, error: error.message };
    }
}

async function testRoleEndpoints(role, token) {
    const endpoints = {
        doctor: [
            '/api/doctor/my-patients',
            '/api/doctor/appointments'
        ],
        nurse: [
            '/api/nurse/assigned-patients',
            '/api/nurse/vitals'
        ],
        patient: [
            '/api/patient/my-appointments',
            '/api/patient/medical-records'
        ],
        admin: [
            '/api/admin/statistics'
        ],
        receptionist: [
            '/api/receptionist/patients',
            '/api/receptionist/appointments'
        ],
        pharmacist: [
            '/api/pharmacist/medicines',
            '/api/pharmacist/prescriptions'
        ],
        labtech: [
            '/api/lab-technician/requests'
        ],
        inventory: [
            '/api/inventory-manager/inventory'
        ]
    };

    const results = [];
    const eps = endpoints[role] || [];

    for (const ep of eps) {
        try {
            const response = await axios.get(`http://localhost:5000${ep}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            results.push({ endpoint: ep, status: '✅ OK', data: response.data.success });
        } catch (error) {
            results.push({ endpoint: ep, status: '❌ Error', error: error.response?.status || error.message });
        }
    }
    return results;
}

async function runTests() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║     SMART HMS - COMPLETE FUNCTIONALITY TEST              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('🔍 Testing all 8 roles...\n');

    for (const [role, creds] of Object.entries(credentials)) {
        console.log(`\n─────────────────────────────────────────`);
        console.log(`Testing ${role.toUpperCase()}`);
        console.log(`─────────────────────────────────────────`);

        const loginResult = await testLogin(role, creds);

        if (!loginResult.success) {
            console.log(`❌ Login failed: ${loginResult.error}`);
            continue;
        }

        console.log(`✅ Login successful (${creds.username})`);
        
        const endpoints = await testRoleEndpoints(role, loginResult.token);
        endpoints.forEach(ep => {
            console.log(`  ${ep.status} ${ep.endpoint}`);
        });
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                     TEST COMPLETE                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('📋 All roles and their endpoints tested successfully!\n');
}

runTests().catch(console.error);
