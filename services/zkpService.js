const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

class ZKPService {
    // ZKP Parameters
    static ZKP_PARAMS = {
        g: BigInt(2),
        p: BigInt(process.env.ZKP_PRIME || 1000000000000000007)
    };

    /**
     * REGISTRATION: Generate ZKP Credentials from password
     */
    static registerUserWithZKP(userId, password) {
        try {
            // Step 1: Derive secret from password using SHA-256
            const secret_x = this.deriveSecretFromPassword(password);
            
            // Step 2: Calculate public key y = g^x mod p
            const public_key = this.calculatePublicKey(secret_x);
            
            // Step 3: Encrypt secret for local storage
            const encrypted = this.encryptSecret(secret_x, password);
            
            return {
                user_id: userId,
                public_key: public_key.toString(),
                base: this.ZKP_PARAMS.g.toString(),
                prime: this.ZKP_PARAMS.p.toString(),
                secret_encrypted: encrypted.encrypted,
                salt: encrypted.salt,
                iv: encrypted.iv
            };
        } catch (error) {
            throw new Error(`ZKP Registration failed: ${error.message}`);
        }
    }

    /**
     * Derive secret x from password
     */
    static deriveSecretFromPassword(password) {
        const hash = crypto.createHash('sha256');
        hash.update(password);
        const hexOutput = hash.digest('hex');
        return BigInt('0x' + hexOutput);
    }

    /**
     * Calculate public key y = g^x mod p
     */
    static calculatePublicKey(secret_x) {
        const g = this.ZKP_PARAMS.g;
        const p = this.ZKP_PARAMS.p;
        return this.modularExponentiation(g, secret_x, p);
    }

    /**
     * Encrypt secret using AES-256-CBC
     */
    static encryptSecret(secret_x, password) {
        const salt = crypto.randomBytes(16);
        const encryptionKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
        let encrypted = cipher.update(secret_x.toString(), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return {
            encrypted,
            salt: salt.toString('hex'),
            iv: iv.toString('hex')
        };
    }

    /**
     * LOGIN STEP 1: Initiate ZKP proof
     */
    static initiateZKPProof(userId) {
        try {
            const random_r = this.generateRandomNumber();
            const t = this.modularExponentiation(
                this.ZKP_PARAMS.g,
                random_r,
                this.ZKP_PARAMS.p
            );
            
            return {
                t_value: t.toString(),
                random_r: random_r
            };
        } catch (error) {
            throw new Error(`Failed to initiate ZKP proof: ${error.message}`);
        }
    }

    /**
     * LOGIN STEP 2: Generate challenge on server
     */
    static generateChallenge(userId, t_value) {
        try {
            const challenge = this.generateRandomNumber();
            const sessionId = this.generateSessionId();
            
            return {
                challenge: challenge.toString(),
                session_id: sessionId
            };
        } catch (error) {
            throw new Error(`Failed to generate challenge: ${error.message}`);
        }
    }

    /**
     * LOGIN STEP 3: Verify proof
     */
    static async verifyProof(sessionId, proofS, clientT) {
        try {
            console.log('\n🔍 VERIFICATION REQUEST:');
            console.log('Session ID:', sessionId);
            console.log('Proof S type:', typeof proofS, 'value:', proofS?.substring?.(0, 50));
            console.log('Client T type:', typeof clientT, 'value:', clientT?.substring?.(0, 50));
            
            // Get session and user info
            const query = `
                SELECT 
                    u.id, u.username, u.role, 
                    zkp.public_key, zkp.base, zkp.prime
                FROM users u
                JOIN zkp_credentials zkp ON u.id = zkp.user_id
                JOIN zkp_sessions zs ON u.id = zs.user_id
                WHERE zs.id = ? AND zs.expires_at > NOW()
            `;
            
            const [results] = await db.query(query, [sessionId]);
            
            if (results.length === 0) {
                console.log('❌ Session not found or expired');
                return { success: false, error: 'Session not found or expired' };
            }
            
            const user = results[0];
            console.log('✓ Found user:', user.username, 'ID:', user.id);
            
            // Get session data to retrieve challenge and t_value
            const sessionQuery = 'SELECT * FROM zkp_sessions WHERE id = ?';
            const [sessions] = await db.query(sessionQuery, [sessionId]);
            
            if (sessions.length === 0) {
                console.log('❌ Invalid session');
                return { success: false, error: 'Invalid session' };
            }
            
            const session = sessions[0];
            console.log('✓ Challenge:', session.challenge.toString().substring(0, 50));
            
            // Verify equation: g^s = t × y^c (mod p)
            // Using the t_value provided by CLIENT (computed as t = 2^r mod p)
            const t = BigInt(clientT);
            const c = BigInt(session.challenge);
            const y = BigInt(user.public_key);
            const g = this.ZKP_PARAMS.g;
            const p = this.ZKP_PARAMS.p;
            const s = BigInt(proofS);
            
            console.log('📊 Values:');
            console.log('  t (client):', t.toString().substring(0, 50));
            console.log('  c (challenge):', c.toString().substring(0, 50));
            console.log('  y (public_key):', y.toString().substring(0, 50));
            console.log('  s (proof):', s.toString().substring(0, 50));
            
            // Compute left side: g^s mod p
            const leftSide = this.modularExponentiation(g, s, p);
            
            // Compute right side: (t × y^c) mod p
            const y_power_c = this.modularExponentiation(y, c, p);
            const rightSide = (t * y_power_c) % p;
            
            console.log('📐 Verification Math:');
            console.log('  g^s mod p:', leftSide.toString().substring(0, 50));
            console.log('  (t × y^c) mod p:', rightSide.toString().substring(0, 50));
            console.log('  Match:', leftSide === rightSide ? '✅ YES' : '❌ NO');
            
            if (leftSide !== rightSide) {
                console.log('❌ VERIFICATION FAILED');
                // Increment attempts
                await db.query(
                    'UPDATE zkp_sessions SET attempts = attempts + 1 WHERE id = ?',
                    [sessionId]
                );
                
                return { success: false, error: 'Proof verification failed' };
            }
            
            console.log('✅ VERIFICATION PASSED');
            
            // Delete session
            await db.query('DELETE FROM zkp_sessions WHERE id = ?', [sessionId]);
            
            // Create JWT token
            const token = jwt.sign(
                {
                    user_id: user.id,
                    username: user.username,
                    role: user.role
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.TOKEN_EXPIRY || '24h' }
            );
            
            return {
                success: true,
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            };
            
        } catch (error) {
            console.error('Proof verification error:', error);
            return { success: false, error: 'Verification failed' };
        }
    }

    /**
     * Generate cryptographically secure random BigInt
     */
    static generateRandomNumber() {
        const randomBytes = crypto.randomBytes(32);
        return BigInt('0x' + randomBytes.toString('hex'));
    }

    /**
     * Generate unique session ID
     */
    static generateSessionId() {
        return 'zkp_' + crypto.randomBytes(16).toString('hex');
    }

    /**
     * Efficient modular exponentiation: (base^exponent) mod modulus
     */
    static modularExponentiation(base, exponent, modulus) {
        if (modulus === 1n) return 0n;
        
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

    /**
     * Decrypt secret
     */
    static decryptSecret(encryptedSecret, salt, iv, password) {
        try {
            const key = crypto.pbkdf2Sync(
                password,
                Buffer.from(salt, 'hex'),
                100000,
                32,
                'sha256'
            );
            
            const decipher = crypto.createDecipheriv(
                'aes-256-cbc',
                key,
                Buffer.from(iv, 'hex')
            );
            
            let decrypted = decipher.update(encryptedSecret, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return BigInt(decrypted);
        } catch (error) {
            throw new Error('Failed to decrypt secret: Wrong password or corrupted data');
        }
    }
}

module.exports = ZKPService;
