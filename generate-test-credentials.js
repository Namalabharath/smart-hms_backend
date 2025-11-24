const crypto = require('crypto');

// ZKP Parameters
const g = 2n;
const p = 1000000000000000007n;

// Test user: admin, password: admin123
const password = 'admin123';

// Step 1: Derive secret from password (SHA-256)
const hash = crypto.createHash('sha256').update(password).digest('hex');
const secret_x = BigInt('0x' + hash);
console.log('Secret x (hex):', hash);
console.log('Secret x (bigint):', secret_x.toString());

// Step 2: Calculate public key y = 2^x mod p
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

const public_key = modularExponentiation(g, secret_x, p);
console.log('Public key y = 2^x mod p:', public_key.toString());

// Step 3: Encrypt secret (simple - just store hex)
const encrypted = secret_x.toString(16);
console.log('\nSQL INSERT for admin user (id=1):');
console.log(`INSERT INTO zkp_credentials (user_id, public_key, base, prime, secret_encrypted, salt, iv)
VALUES (1, '${public_key.toString()}', '2', '1000000000000000007', '${encrypted}', '0000000000000000', '0000000000000000');`);
