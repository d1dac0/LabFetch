const express = require('express');
const pool = require('../db'); // Assuming db.js is in the parent directory
const authenticateAdmin = require('../middleware/authMiddleware');
const logger = require('../config/logger');

const router = express.Router();

// --- Public Route --- 
// GET /api/settings/public/pickup-schedule-message - Get only the public schedule message
router.get('/public/pickup-schedule-message', async (req, res) => {
    try {
        const key = 'pickup_schedule_message';
        const result = await pool.query('SELECT setting_value FROM settings WHERE setting_key = $1', [key]);
        if (result.rows.length > 0) {
            // Return the value directly, maybe in a simple object
            res.json({ value: result.rows[0].setting_value }); 
        } else {
            logger.warn(`Public setting key '${key}' not found.`);
            res.status(404).json({ message: 'Configuración no encontrada' });
        }
    } catch (err) {
        logger.error(`Error fetching public setting '${key}':`, err.message);
        res.status(500).json({ message: 'Error al obtener la configuración' });
    }
});

// --- Admin Routes (Protected) ---

// Apply auth middleware ONLY to the routes below this line
router.use(authenticateAdmin);

// GET all settings
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT setting_key, setting_value FROM settings');
        // Convert array of {setting_key: k, setting_value: v} to {k: v} object
        const settings = result.rows.reduce((acc, row) => {
            acc[row.setting_key] = row.setting_value;
            return acc;
        }, {});
        res.json(settings);
    } catch (err) {
        console.error('Error fetching settings:', err.message);
        res.status(500).json({ message: 'Error fetching settings' });
    }
});


// PUT (update) multiple settings
router.put('/', async (req, res) => {
    const settingsToUpdate = req.body; // Expects { key1: value1, key2: value2, ... }

    if (typeof settingsToUpdate !== 'object' || settingsToUpdate === null) {
        return res.status(400).json({ message: 'Cuerpo de solicitud inválido: Se esperaba un objeto de configuración.' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        for (const [key, value] of Object.entries(settingsToUpdate)) {
            // Use INSERT ... ON CONFLICT DO UPDATE for simplicity
            // This handles both existing and potentially new (though unlikely in this context) keys
            const query = `
                INSERT INTO settings (setting_key, setting_value) 
                VALUES ($1, $2)
                ON CONFLICT (setting_key) 
                DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP
            `;
            await client.query(query, [key, value]);
        }

        await client.query('COMMIT');
        res.json({ message: 'Configuración actualizada exitosamente' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating settings:', err.message);
        res.status(500).json({ message: 'Error al actualizar la configuración' });
    } finally {
        client.release();
    }
});

module.exports = router; 