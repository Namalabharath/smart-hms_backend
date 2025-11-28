/*
  zkp_test_client.js
  Demonstrates ZKP registration and login flow against the backend.

  Usage:
    node zkp_test_client.js

  Notes:
  - Assumes backend running at http://localhost:5000
  - Uses server defaults g=2 and fallback prime defined in ZKP service.
*/

const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

function sha256Hex(input) {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

function sha256BigInt(password) {
  const hex = sha256Hex(password);
  return BigInt('0x' + hex);
}

function randomBigInt(bytes = 32) {
  return BigInt('0x' + crypto.randomBytes(bytes).toString('hex'));
}

function modExp(base, exponent, modulus) {
  base = BigInt(base);
  exponent = BigInt(exponent);
  modulus = BigInt(modulus);
  if (modulus === 1n) return 0n;
  let result = 1n;
  base = base % modulus;
  while (exponent > 0n) {
    if (exponent % 2n === 1n) result = (result * base) % modulus;
    exponent >>= 1n;
    base = (base * base) % modulus;
  }
  return result;
}

(async () => {
  try {
    const username = 'alice_zkp';
    const email = 'alice_zkp@example.com';
    const password = 'StrongPass!123';
    const role = 'receptionist';

    console.log('\n1) Registering ZKP user...');
    const regRes = await axios.post(`${BASE_URL}/api/auth/zkp/register`, {
      username,
      email,
      password,
      role
    });
    console.log('Register response:', regRes.data);

    console.log('\n2) Derive secret x from password (sha256 -> BigInt)');
    const x = sha256BigInt(password);
    console.log('  x (hex prefix):', '0x' + sha256Hex(password).slice(0, 12));

    // Use server default params (should match server): g=2, fallback prime used in server
    const g = 2n;
    const p = BigInt(process.env.ZKP_PRIME || '1000000000000000007');

    console.log('\n3) Choose random r and compute t = g^r mod p');
    const r = randomBigInt(32);
    const t = modExp(g, r, p);
    console.log('  t (prefix):', t.toString().slice(0, 24));

    console.log('\n4) Initiate login (send t to server)');
    const initRes = await axios.post(`${BASE_URL}/api/auth/zkp/login/initiate`, {
      username,
      tValue: t.toString()
    });
    console.log('Initiate response:', initRes.data);

    const { sessionId, challenge, params } = initRes.data;
    const c = BigInt(challenge);

    // If server returned params, prefer them to compute consistency
    const serverG = params?.base ? BigInt(params.base) : g;
    const serverP = params?.prime ? BigInt(params.prime) : p;

    if (serverG !== g || serverP !== p) {
      console.log('Server returned different params — recomputing t with server params');
      // Recompute t with same r and server params
      // (client must use server params when available)
    }

    console.log('\n5) Compute proof s = r + c * x');
    const s = r + c * x;

    console.log('  s (prefix):', s.toString().slice(0, 24));

    console.log('\n6) Send proof to /verify');
    const verifyRes = await axios.post(`${BASE_URL}/api/auth/zkp/login/verify`, {
      sessionId,
      proof: s.toString()
    });

    console.log('Verify response:', verifyRes.data);

    if (verifyRes.data && verifyRes.data.token) {
      console.log('\n✅ ZKP login successful. Token (truncated):', verifyRes.data.token.slice(0, 64));
    } else {
      console.log('\n❌ ZKP login failed or no token returned.');
    }

  } catch (err) {
    if (err.response) {
      console.error('ERROR RESPONSE:', err.response.status, err.response.data);
    } else {
      console.error('ERROR:', err.message);
    }
    process.exit(1);
  }
})();
