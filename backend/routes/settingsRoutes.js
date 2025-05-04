const express = require('express');
const pool = require('../db'); // Assuming db.js is in the parent directory
const authenticateAdmin = require('../middleware/authMiddleware');
const logger = require('../config/logger');

const router = express.Router();

// GET all settings
router.get('/', authenticateAdmin, async (req, res) => {
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
router.put('/', authenticateAdmin, async (req, res) => {
    const settingsToUpdate = req.body; // Expects { key1: value1, key2: value2, ... }

    if (typeof settingsToUpdate !== 'object' || settingsToUpdate === null) {
        return res.status(400).json({ message: 'Invalid request body: Expected an object of settings.' });
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
        res.json({ message: 'Settings updated successfully' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating settings:', err.message);
        res.status(500).json({ message: 'Error updating settings' });
    } finally {
        client.release();
    }
});

module.exports = router; 