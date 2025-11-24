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

async function testLoginFlow() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'hospital_management_system'
    });

    try {
        console.log('📋 FULL LOGIN FLOW TEST\n');
        
        // Test with testuser
        const username = 'testuser';
        const password = 'Test@123456';
        
        console.log('🔐 Step 1: Get user from DB');
        const [users] = await conn.query('SELECT id FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            console.log('❌ User not found');
            return;
        }
        const userId = users[0].id;
        console.log('✓ User ID:', userId);
        
        console.log('\n🔐 Step 2: Get ZKP credentials from DB');
        const [creds] = await conn.query('SELECT public_key, base, prime, secret_encrypted FROM zkp_credentials WHERE user_id = ?', [userId]);
        if (creds.length === 0) {
            console.log('❌ Credentials not found');
            return;
        }
        const y_stored = BigInt(creds[0].public_key);
        console.log('✓ Stored public key (y):', y_stored.toString());
        
        console.log('\n🔐 Step 3: Client derives secret from password');
        const hash = crypto.createHash('sha256').update(password).digest('hex');
        const secret_x = BigInt('0x' + hash);
        console.log('✓ Secret x (from password):', secret_x.toString());
        
        console.log('\n🔐 Step 4: Verify secret matches');
        const y_computed = modularExponentiation(g, secret_x, p);
        console.log('✓ Computed y = 2^x mod p:', y_computed.toString());
        console.log('✓ Stored y from DB:', y_stored.toString());
        console.log('Match:', y_computed === y_stored ? '✅ YES' : '❌ NO');
        
        if (y_computed !== y_stored) {
            console.log('\n⚠️ CREDENTIALS MISMATCH! Database has wrong public key.');
            console.log('Should be:', y_computed.toString());
            console.log('Actually is:', y_stored.toString());
            await conn.end();
            return;
        }
        
        console.log('\n🔐 Step 5: Simulate login initiate (server generates random r and challenge)');
        const random_r_server = BigInt('98765432109876543210');
        const t = modularExponentiation(g, random_r_server, p);
        const challenge_c = BigInt('111222333444555666');
        console.log('✓ Server random r:', random_r_server.toString());
        console.log('✓ Server computed t = 2^r mod p:', t.toString());
        console.log('✓ Server challenge c:', challenge_c.toString());
        
        console.log('\n🔐 Step 6: Client generates proof');
        const random_r_client = BigInt('555444333222111000');
        const t_client = modularExponentiation(g, random_r_client, p);
        const s = random_r_client + (challenge_c * secret_x);
        console.log('✓ Client random r:', random_r_client.toString());
        console.log('✓ Client computed t = 2^r mod p:', t_client.toString());
        console.log('✓ Client proof s = r + c*x:', s.toString());
        
        console.log('\n🔐 Step 7: Server verification (g^s = t * y^c mod p)');
        const left = modularExponentiation(g, s, p);
        const y_power_c = modularExponentiation(y_stored, challenge_c, p);
        const right = (t_client * y_power_c) % p;
        
        console.log('✓ g^s mod p:', left.toString());
        console.log('✓ (t * y^c) mod p:', right.toString());
        console.log('Verification:', left === right ? '✅ PASS' : '❌ FAIL');
        
        if (left === right) {
            console.log('\n✅ LOGIN WOULD SUCCEED with client-computed t!');
        } else {
            console.log('\n⚠️ Trying with server-computed t...');
            const right2 = (t * y_power_c) % p;
            console.log('✓ (server_t * y^c) mod p:', right2.toString());
            console.log('Verification:', left === right2 ? '✅ PASS' : '❌ FAIL');
        }
        
        await conn.end();
    } catch (error) {
        console.error('Error:', error.message);
        await conn.end();
    }
}

testLoginFlow();
