const crypto = require('crypto');

// Simulate login flow
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

// Test login with admin password
const password = 'admin123';
const secret_x = BigInt('0x' + crypto.createHash('sha256').update(password).digest('hex'));
const y_stored = BigInt('430094055752197614'); // From DB

console.log('=== VERIFICATION ===');
console.log('Stored y:', y_stored.toString());

// Check if y = 2^x mod p
const y_computed = modularExponentiation(g, secret_x, p);
console.log('Computed y = 2^x mod p:', y_computed.toString());
console.log('Match:', y_stored === y_computed ? '✓ YES' : '✗ NO');

// Simulate proof generation
console.log('\n=== PROOF GENERATION ===');
const random_r = 12345n; // Fixed for test
const challenge_c = 67890n; // Fixed for test

// Client computes t = 2^r mod p
const t = modularExponentiation(g, random_r, p);
console.log('t = 2^r mod p:', t.toString());

// Client computes s = r + c*x
const s = random_r + (challenge_c * secret_x);
console.log('s = r + c*x:', s.toString());

// Server verifies: g^s = t * y^c (mod p)
console.log('\n=== SERVER VERIFICATION ===');
const left_side = modularExponentiation(g, s, p);
console.log('g^s mod p:', left_side.toString());

const y_power_c = modularExponentiation(y_stored, challenge_c, p);
const right_side = (t * y_power_c) % p;
console.log('t * y^c mod p:', right_side.toString());

console.log('Verification:', left_side === right_side ? '✓ PASS' : '✗ FAIL');
