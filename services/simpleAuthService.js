const crypto = require('crypto');

class SimpleAuthService {
    /**
     * Simple Math-Based Authentication
     * Formula: hash = SHA256(password + salt)
     * Storage: Store hash in database
     * Login: Compute same hash and compare
     */

    static computePasswordHash(password, salt = 'HOSPITAL_HMS_2025') {
        const combined = password + salt;
        const hash = crypto.createHash('sha256').update(combined).digest('hex');
        return hash;
    }

    static registerUser(userId, password) {
        const passwordHash = this.computePasswordHash(password);
        return {
            user_id: userId,
            password_hash: passwordHash,
            salt: 'HOSPITAL_HMS_2025'
        };
    }

    static verifyPassword(storedHash, password) {
        const computedHash = this.computePasswordHash(password);
        return storedHash === computedHash;
    }
}

module.exports = SimpleAuthService;
