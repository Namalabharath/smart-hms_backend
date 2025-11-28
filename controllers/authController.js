const db = require('../config/database');
const jwt = require('jsonwebtoken');
const SimpleHashAuth = require('../services/simpleHashAuth');

class AuthController {
    /**
     * Register a new user
     */
    static async registerUser(req, res) {
        try {
            const { username, email, password, role, firstName, lastName } = req.body;

            // Validate required fields
            if (!username || !email || !password || !role) {
                return res.status(400).json({ error: 'All fields are required' });
            }

            // Check if user already exists
            const [existing] = await db.query(
                'SELECT id FROM users WHERE username = ? OR email = ?',
                [username, email]
            );

            if (existing.length > 0) {
                return res.status(400).json({ error: 'Username or email already exists' });
            }

            // Hash password
            const passwordHash = SimpleHashAuth.generatePasswordHash(password);

            // Insert user
            const [result] = await db.query(
                `INSERT INTO users (username, email, password_hash, role, first_name, last_name) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [username, email, passwordHash, role, firstName || username, lastName || '']
            );

            const userId = result.insertId;

            // Create role-specific record
            try {
                if (role === 'patient') {
                    await db.query('INSERT INTO patients (user_id) VALUES (?)', [userId]);
                } else if (role === 'doctor') {
                    await db.query('INSERT INTO doctors (user_id) VALUES (?)', [userId]);
                } else if (role === 'nurse') {
                    await db.query('INSERT INTO nurses (user_id) VALUES (?)', [userId]);
                } else if (role === 'pharmacist') {
                    await db.query('INSERT INTO pharmacists (user_id) VALUES (?)', [userId]);
                } else if (role === 'lab_technician') {
                    await db.query('INSERT INTO lab_technicians (user_id) VALUES (?)', [userId]);
                } else if (role === 'receptionist') {
                    await db.query('INSERT INTO receptionists (user_id) VALUES (?)', [userId]);
                }
            } catch (roleErr) {
                console.warn('Role record creation warning:', roleErr.message);
            }

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                user: { id: userId, username, email, role }
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Registration failed: ' + error.message });
        }
    }

    /**
     * Login user
     */
    static async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password are required' });
            }

            // Find user
            const [users] = await db.query(
                'SELECT id, username, email, password_hash, role, first_name, last_name FROM users WHERE username = ?',
                [username]
            );

            if (users.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const user = users[0];

            // Verify password
            const isValid = SimpleHashAuth.verifyPassword(password, user.password_hash);
            
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                    role: user.role
                },
                process.env.JWT_SECRET || 'your_jwt_secret_key',
                { expiresIn: process.env.TOKEN_EXPIRY || '24h' }
            );

            res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    firstName: user.first_name,
                    lastName: user.last_name
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed: ' + error.message });
        }
    }

    /**
     * Logout user (client-side token removal, server just acknowledges)
     */
    static async logout(req, res) {
        res.json({ success: true, message: 'Logged out successfully' });
    }

    /**
     * Get current user info
     */
    static async getCurrentUser(req, res) {
        try {
            const [users] = await db.query(
                'SELECT id, username, email, role, first_name, last_name FROM users WHERE id = ?',
                [req.user.id]
            );

            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ success: true, user: users[0] });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = AuthController;
