const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    // This check should ideally be done at application startup
    console.error("FATAL ERROR: JWT_SECRET is not defined.");
    // process.exit(1); // Avoid exiting in middleware, handle at startup
}

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) {
        console.log('Auth Error: No token provided');
        return res.status(401).json({ message: 'Acceso no autorizado: Token no proporcionado.' }); // if there isn't any token
    }

    jwt.verify(token, JWT_SECRET, (err, admin) => {
        if (err) {
            console.log('Auth Error: Invalid/Expired token', err.message);
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Acceso no autorizado: Token expirado.' });
            }
            return res.status(403).json({ message: 'Acceso prohibido: Token inválido.' }); // Forbidden if token is invalid
        }

        // If token is valid, save the decoded admin info to request object
        // So downstream routes can access it (e.g., req.admin.adminId)
        req.admin = admin;
        console.log(`Authenticated admin: ${admin.username}`);
        next(); // pass the execution to the downstream handler
    });
};

module.exports = authenticateToken; 