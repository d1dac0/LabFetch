const winston = require('winston');

// Determine log level based on environment
const level = process.env.NODE_ENV === 'production' ? 'warn' : 'debug';

// Basic logger configuration
const logger = winston.createLogger({
    level: level,
    format: winston.format.combine(
        winston.format.timestamp({
           format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }), // Log stack traces
        winston.format.splat(),
        winston.format.json() // Log in JSON format
    ),
    transports: [
        // Log to the console
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple() // Use simple format for console readability
            )
        })
        // Add file transport for production if desired
        // new winston.transports.File({ filename: 'error.log', level: 'error' }),
        // new winston.transports.File({ filename: 'combined.log' })
    ],
});

logger.info(`Logger initialized with level: ${level}`);

module.exports = logger; 