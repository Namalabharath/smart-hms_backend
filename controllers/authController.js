const db = require('../config/database');
const jwt = require('jsonwebtoken');
const SimpleHashAuth = require('../services/simpleHashAuth');

class AuthController {
    /**
     * Register new user with simple hash authentication
     */
    static async registerUser(req, res) {
        try {
            const { username, email, password, role, firstName, lastName } = req.body;
            
            if (!username || !email || !password || !role) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            const [existing] = await db.query(
                'SELECT id FROM users WHERE username = ? OR email = ?',
                [username, email]
            );
            
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Username or email already exists' });
            }
            
            // Generate password hash using SHA-256
            const passwordHash = SimpleHashAuth.generatePasswordHash(password);
            
            const [userResult] = await db.query(
                `INSERT INTO users (username, email, role, first_name, last_name, auth_type, password_hash)
                 VALUES (?, ?, ?, ?, ?, 'simple_hash', ?)`,
                [username, email, role, firstName || username, lastName || 'User', passwordHash]
            );
            
            // Create role-specific records
            const userId = userResult.insertId;
            
            try {
                if (role === 'receptionist') {
                    await db.query(
                        `INSERT INTO receptionists (user_id) VALUES (?)`,
                        [userId]
                    );
                } else if (role === 'doctor') {
                    await db.query(
                        `INSERT INTO doctors (user_id) VALUES (?)`,
                        [userId]
                    );
                } else if (role === 'nurse') {
                    await db.query(
                        `INSERT INTO nurses (user_id) VALUES (?)`,
                        [userId]
                    );
                } else if (role === 'pharmacist') {
                    await db.query(
                        `INSERT INTO pharmacists (user_id) VALUES (?)`,
                        [userId]
                    );
                } else if (role === 'lab_technician') {
                    await db.query(
                        `INSERT INTO lab_technicians (user_id) VALUES (?)`,
                        [userId]
                    );
                }
            } catch (roleError) {
                // Log role-specific table creation errors but don't fail registration
                console.warn(`Warning: Could not create ${role} record:`, roleError.message);
            }
            
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                user: {
                    id: userId,
                    username,
                    role
                }
            });
            
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Registration failed: ' + error.message });
        }
    }

    /**
     * Login - direct password verification
     */
    static async login(req, res) {
        try {
            const { username, password } = req.body;
            
            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password required' });
            }
            
            // Get user and password hash
            const [users] = await db.query(
                'SELECT id, username, role, password_hash FROM users WHERE username = ?',
                [username]
            );
            
            if (users.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            const user = users[0];
            
            // Verify password by comparing hashes
            const isValid = SimpleHashAuth.verifyPassword(password, user.password_hash);
            
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            // Create JWT token
            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                    role: user.role
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.TOKEN_EXPIRY || '24h' }
            );
            
            res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });
            
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed: ' + error.message });
        }
    }

    /**
     * Logout
     */
    static async logout(req, res) {
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }

    /**
     * Get current user info
     */
    static async getCurrentUser(req, res) {
        try {
            const userId = req.user.user_id;
            
            const [users] = await db.query(
                'SELECT id, username, email, role, first_name, last_name FROM users WHERE id = ?',
                [userId]
            );
            
            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.json({
                success: true,
                user: users[0]
            });
            
        } catch (error) {
            res.status(500).json({ error: 'Failed to get user: ' + error.message });
        }
    }
}

module.exports = AuthController;
