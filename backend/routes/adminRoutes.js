const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Database connection utility
const router = express.Router();
const logger = require('../config/logger'); // Import logger
const authenticateToken = require('../middleware/authMiddleware'); // Import auth middleware

require('dotenv').config(); // Ensure JWT_SECRET is loaded

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    logger.error("FATAL ERROR: JWT_SECRET is not defined. Exiting.");
    process.exit(1); // Exit if secret is missing
}

// POST /api/admin/login
router.post('/login', async (req, res, next) => {
    // logger.debug('Entered POST /login handler'); // REMOVED
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Se requieren usuario y contraseña.' });
    }

    try {
        // Find admin by username
        const query = 'SELECT * FROM admins WHERE username = $1';
        const result = await db.query(query, [username]);
        const admin = result.rows[0];

        if (!admin) {
            logger.warn(`Login attempt failed for non-existent user: ${username}`);
            return res.status(401).json({ message: 'Usuario no encontrado' }); // Translated
        }

        // Compare provided password with stored hash
        const isMatch = await bcrypt.compare(password, admin.password_hash);

        if (!isMatch) {
            logger.warn(`Login attempt failed for user: ${username} (invalid password)`);
            return res.status(401).json({ message: 'Credenciales inválidas' }); // Translated
        }

        // Passwords match - Generate JWT
        const payload = {
            adminId: admin.id,
            username: admin.username
            // Add other relevant admin details if needed, but keep payload small
        };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1h' }, // Token expiration time (e.g., 1 hour)
            (err, token) => {
                if (err) {
                    logger.error('Error signing JWT:', { error: err });
                    return next(err); // Pass JWT signing error to global handler
                }
                logger.info(`Admin '${username}' logged in successfully.`);
                res.status(200).json({ 
                    message: 'Inicio de sesión exitoso.',
                    token: token 
                });
            }
        );

    } catch (error) {
        logger.error('Error during user login:', { error: error });
        next(error); // Pass DB or other errors to global handler
    }
});

// Protect subsequent routes
router.use(authenticateToken); // Re-enabled authentication

// Example protected route (Add real admin routes here later)
router.get('/protected-data', (req, res) => {
    // Access admin info from req.admin (set by authMiddleware)
    logger.info(`Accessing protected data by user: ${req.admin.username}`);
    res.json({ message: "This is protected data!", admin: req.admin });
});

// TODO: Add other admin routes here (e.g., fetching pickups, updating status)
// Remember to protect these routes using JWT middleware later.

module.exports = router; 