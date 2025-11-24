const crypto = require('crypto');

const password = 'Test@123456';
const hash = crypto.createHash('sha256').update(password).digest('hex');
const g = 2n;
const p = 1000000000000000007n;
const sx = BigInt('0x' + hash);

function me(b,e,m) {
  let r = 1n;
  b = b % m;
  while (e > 0n) {
    if (e % 2n === 1n) r = (r * b) % m;
    e = e >> 1n;
    b = (b * b) % m;
  }
  return r;
}

const yk = me(g, sx, p);
console.log('Password:', password);
console.log('Public key:', yk.toString());
console.log('Hash:', hash);
console.log('\nSQL Update:');
console.log(`UPDATE zkp_credentials SET public_key='${yk.toString()}', secret_encrypted='${hash}' WHERE user_id=16;`);
