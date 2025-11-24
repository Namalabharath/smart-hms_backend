const crypto = require('crypto');

/**
 * Simple SHA-256 based authentication
 * Same formula on client and server
 */
class SimpleHashAuth {
    /**
     * Generate password hash: SHA256(SHA256(password) + salt)
     */
    static generatePasswordHash(password, salt = 'hospital2025') {
        // First hash the password
        const step1 = crypto.createHash('sha256').update(password).digest('hex');
        
        // Then hash it again with salt
        const step2 = crypto.createHash('sha256').update(step1 + salt).digest('hex');
        
        return step2;
    }

    /**
     * Verify password
     */
    static verifyPassword(password, storedHash, salt = 'hospital2025') {
        const computedHash = this.generatePasswordHash(password, salt);
        return computedHash === storedHash;
    }
}

module.exports = SimpleHashAuth;
