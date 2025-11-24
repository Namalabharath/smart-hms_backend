#!/usr/bin/env node

/**
 * Lab Technician API Test Script
 * Tests all new lab technician endpoints
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m'
};

let authToken = null;
let testResults = { passed: 0, failed: 0 };

// Helper functions
const log = (message, color = 'reset') => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

const success = (message) => log(`✓ ${message}`, 'green');
const error = (message) => log(`✗ ${message}`, 'red');
const info = (message) => log(`ℹ ${message}`, 'blue');
const warn = (message) => log(`⚠ ${message}`, 'yellow');

// Login and get auth token
async function login() {
    try {
        info('Testing Lab Technician Login...');
        
        // Note: Replace with actual lab technician credentials
        const response = await axios.post(`${API_BASE}/auth/login`, {
            username: 'lab_technician', // Replace with actual username
            password: 'password123'      // Replace with actual password
        });

        if (response.data.token) {
            authToken = response.data.token;
            success(`Login successful. Token: ${authToken.substring(0, 20)}...`);
            testResults.passed++;
            return true;
        } else {
            error('No token received from login');
            testResults.failed++;
            return false;
        }
    } catch (err) {
        error(`Login failed: ${err.response?.data?.message || err.message}`);
        testResults.failed++;
        return false;
    }
}

// Test endpoints
async function testGetSamples() {
    try {
        info('Testing GET /api/lab-technician/samples');
        
        const response = await axios.get(`${API_BASE}/lab-technician/samples`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.data.success) {
            success(`Retrieved ${response.data.samples?.length || 0} samples`);
            testResults.passed++;
        }
    } catch (err) {
        error(`GET samples failed: ${err.response?.status} ${err.response?.data?.error}`);
        testResults.failed++;
    }
}

async function testGetPatients() {
    try {
        info('Testing GET /api/lab-technician/patients');
        
        const response = await axios.get(`${API_BASE}/lab-technician/patients`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.data.success) {
            success(`Retrieved ${response.data.patients?.length || 0} patients`);
            testResults.passed++;
        }
    } catch (err) {
        error(`GET patients failed: ${err.response?.status} ${err.response?.data?.error}`);
        testResults.failed++;
    }
}

async function testGetTestRequests() {
    try {
        info('Testing GET /api/lab-technician/test-requests');
        
        const response = await axios.get(`${API_BASE}/lab-technician/test-requests`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.data.success) {
            success(`Retrieved ${response.data.requests?.length || 0} test requests`);
            testResults.passed++;
        }
    } catch (err) {
        error(`GET test-requests failed: ${err.response?.status} ${err.response?.data?.error}`);
        testResults.failed++;
    }
}

async function testCollectSample() {
    try {
        info('Testing POST /api/lab-technician/samples/collect');
        
        const response = await axios.post(`${API_BASE}/lab-technician/samples/collect`, 
            {
                patientId: 1,
                sampleType: 'blood',
                collectionDate: new Date().toISOString().split('T')[0],
                notes: 'Test sample collection'
            },
            {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }
        );

        if (response.data.success) {
            success(`Sample collected. Sample ID: ${response.data.sampleId}`);
            testResults.passed++;
        }
    } catch (err) {
        if (err.response?.status === 404 || err.response?.data?.error?.includes('patient')) {
            warn(`POST collect-sample: Patient may not exist (create test data first)`);
        } else {
            error(`POST collect-sample failed: ${err.response?.status} ${err.response?.data?.error}`);
        }
        testResults.failed++;
    }
}

async function testUpdateSampleStatus() {
    try {
        info('Testing PUT /api/lab-technician/samples/:id/status');
        
        const response = await axios.put(`${API_BASE}/lab-technician/samples/1/status`,
            { status: 'processing' },
            {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }
        );

        if (response.data.success) {
            success('Sample status updated to processing');
            testResults.passed++;
        }
    } catch (err) {
        if (err.response?.status === 404) {
            warn('PUT sample status: Sample ID 1 does not exist (create samples first)');
        } else {
            error(`PUT sample status failed: ${err.response?.status} ${err.response?.data?.error}`);
        }
        testResults.failed++;
    }
}

async function testGetDashboardStats() {
    try {
        info('Testing GET /api/lab-technician/dashboard/stats');
        
        const response = await axios.get(`${API_BASE}/lab-technician/dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.data.success) {
            success(`Got dashboard stats: Pending: ${response.data.stats.pendingTests}, Completed: ${response.data.stats.completedTests}`);
            testResults.passed++;
        }
    } catch (err) {
        error(`GET dashboard/stats failed: ${err.response?.status} ${err.response?.data?.error}`);
        testResults.failed++;
    }
}

// Main test runner
async function runTests() {
    console.log('\n' + '='.repeat(60));
    log('LAB TECHNICIAN API TEST SUITE', 'yellow');
    console.log('='.repeat(60) + '\n');

    // Login first
    if (!await login()) {
        error('Cannot proceed without authentication');
        return;
    }

    console.log('\n' + '-'.repeat(60));
    log('ENDPOINT TESTS', 'blue');
    console.log('-'.repeat(60) + '\n');

    // Run endpoint tests
    await testGetSamples();
    console.log();
    
    await testGetPatients();
    console.log();
    
    await testGetTestRequests();
    console.log();
    
    await testGetDashboardStats();
    console.log();
    
    await testCollectSample();
    console.log();
    
    await testUpdateSampleStatus();

    // Print summary
    console.log('\n' + '='.repeat(60));
    log('TEST SUMMARY', 'yellow');
    console.log('='.repeat(60));
    success(`${testResults.passed} tests passed`);
    error(`${testResults.failed} tests failed`);
    const total = testResults.passed + testResults.failed;
    const percentage = total > 0 ? Math.round((testResults.passed / total) * 100) : 0;
    info(`Success rate: ${percentage}%`);
    console.log('='.repeat(60) + '\n');
}

// Run tests
runTests().catch(err => {
    error(`Test suite error: ${err.message}`);
    process.exit(1);
});
