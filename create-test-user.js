const crypto = require('crypto');
const mysql = require('mysql2/promise');

const g = 2n;
const p = 1000000000000000007n;

function modularExponentiation(base, exponent, modulus) {
    let result = 1n;
    base = base % modulus;
    while (exponent > 0n) {
        if (exponent % 2n === 1n) {
            result = (result * base) % modulus;
        }
        exponent = exponent >> 1n;
        base = (base * base) % modulus;
    }
    return result;
}

async function createTestUser() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'hospital_management_system'
    });

    try {
        // Test user details
        const testUser = {
            username: 'testuser',
            email: 'testuser@hospital.com',
            password: 'Test@123456',
            role: 'patient',
            firstName: 'Test',
            lastName: 'User'
        };

        // Generate ZKP credentials
        const hash = crypto.createHash('sha256').update(testUser.password).digest('hex');
        const secret_x = BigInt('0x' + hash);
        const public_key = modularExponentiation(g, secret_x, p);
        const encrypted = secret_x.toString(16);

        console.log('🔐 Creating test user with ZKP credentials...\n');
        console.log('User Details:');
        console.log('  Username:', testUser.username);
        console.log('  Email:', testUser.email);
        console.log('  Password:', testUser.password);
        console.log('  Role:', testUser.role);
        console.log('  First Name:', testUser.firstName);
        console.log('  Last Name:', testUser.lastName);

        // Insert user
        const [userResult] = await connection.query(
            `INSERT INTO users (username, email, role, first_name, last_name, auth_type)
             VALUES (?, ?, ?, ?, ?, 'zkp')`,
            [testUser.username, testUser.email, testUser.role, testUser.firstName, testUser.lastName]
        );

        const userId = userResult.insertId;
        console.log('\n✓ User created with ID:', userId);

        // Insert ZKP credentials
        await connection.query(
            `INSERT INTO zkp_credentials (user_id, public_key, base, prime, secret_encrypted, salt, iv)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                public_key.toString(),
                '2',
                '1000000000000000007',
                encrypted,
                '0000000000000000',
                '0000000000000000'
            ]
        );

        console.log('✓ ZKP credentials stored in database');
        
        console.log('\n' + '='.repeat(60));
        console.log('🎯 LOGIN CREDENTIALS:');
        console.log('='.repeat(60));
        console.log('Username: ' + testUser.username);
        console.log('Password: ' + testUser.password);
        console.log('='.repeat(60));
        
        console.log('\nZKP Details (for verification):');
        console.log('  Secret x (SHA-256 hash):', hash);
        console.log('  Public key y (2^x mod p):', public_key.toString());
        console.log('  Base (g):', g.toString());
        console.log('  Prime (p):', p.toString());

        console.log('\n✅ Test user ready! Use the credentials above to login at http://localhost:3000');

        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await connection.end();
    }
}

createTestUser();
