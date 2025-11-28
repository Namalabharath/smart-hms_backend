ZKP (Schnorr) Authentication - README

This file documents the ZKP-based authentication endpoints already present in the backend and provides example curl and Node.js usage.

Overview
--------
The backend exposes Schnorr-style ZKP endpoints under `/api/auth/zkp/*` alongside the existing username/password auth. These are separate and non-invasive.

Endpoints
---------
1) Register ZKP user
   - POST /api/auth/zkp/register
   - Body: { username, email, password, role, firstName?, lastName? }
   - Behavior: Creates a `users` row (auth_type='zkp'), stores a SHA-256 derived secret (encrypted) and the public key `y = g^x mod p` in `zkp_credentials`.

   Example curl:
   ```bash
   curl -X POST http://localhost:5000/api/auth/zkp/register \
     -H "Content-Type: application/json" \
     -d '{"username":"alice","email":"alice@example.com","password":"Passw0rd!","role":"receptionist"}'
   ```

2) Initiate ZKP login (client sends commitment t)
   - POST /api/auth/zkp/login/initiate
   - Body: { username, tValue }
   - Behavior: Server stores the `t_value` and generates a short challenge `c` and `sessionId`. It returns `{ sessionId, challenge, params: { base, prime } }` to the client.
   - Note: The server returns `base` and `prime` in response; the client can (and should) compute `t = g^r mod p` using the same `base` and `prime`. In practice, clients may use the server defaults (g=2 and configured prime) to compute `t` before the first call.

   Example curl:
   ```bash
   # Use a JS client (recommended) to compute t correctly using the same base/prime.
   curl -X POST http://localhost:5000/api/auth/zkp/login/initiate \
     -H "Content-Type: application/json" \
     -d '{"username":"alice","tValue":"<t in decimal string>"}'
   ```

3) Verify ZKP proof
   - POST /api/auth/zkp/login/verify
   - Body: { sessionId, proof }
   - Behavior: Server verifies `g^s mod p ?= t × y^c mod p`. If correct, server returns a JWT token (same structure as regular login).

   Example curl:
   ```bash
   curl -X POST http://localhost:5000/api/auth/zkp/login/verify \
     -H "Content-Type: application/json" \
     -d '{"sessionId":"zkp_xxx","proof":"<s decimal string>"}'
   ```

Client-side notes
-----------------
- The server code derives `x` from the password as `x = BigInt('0x' + sha256(password))`.
- To follow the protocol:
  1. Client computes `x` from password (sha256 hex -> BigInt).
  2. Client chooses random `r` (secure random bytes -> BigInt).
  3. Client computes `t = g^r mod p` using same `g` and `p` as server.
  4. Client sends `t` in `/zkp/login/initiate`.
  5. Server returns `c` (challenge) and a `sessionId`.
  6. Client computes `s = r + c*x` and sends it to `/zkp/login/verify`.

- The server uses `g=2` by default and a prime from the environment `ZKP_PRIME` (fallback: 1000000000000000007). The server returns `base` and `prime` in `/initiate` response.

Example Node.js test client
---------------------------
See `zkp_test_client.js` (in same folder) for a runnable example that:
 - registers a ZKP user,
 - computes `t` using default params (g=2, p fallback),
 - initiates login, receives challenge, computes `s`, verifies and prints the returned JWT.

Security & Caveats
------------------
- The simple derivation `x = SHA256(password)` is acceptable for a demo but use a stronger KDF (scrypt/argon2) in production.
- This README is intended to document and demonstrate the non-invasive ZKP option. The regular username/password flow remains intact.

