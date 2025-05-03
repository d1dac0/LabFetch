const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/authMiddleware');
const logger = require('../config/logger');

// GET /api/settings/:key - Fetch a specific setting value (Publicly accessible)
router.get('/:key', async (req, res, next) => {
  const { key } = req.params;
  logger.debug(`Fetching setting with key: ${key}`);

  try {
    const query = 'SELECT setting_value FROM settings WHERE setting_key = $1';
    const result = await db.query(query, [key]);

    if (result.rows.length === 0) {
      logger.warn(`Setting with key '${key}' not found.`);
      // Return a default or empty value instead of 404? Decide based on frontend needs.
      // For now, return 404 for clarity if the key is explicitly missing.
      return res.status(404).json({ message: `Configuración '${key}' no encontrada.` });
    }

    logger.debug(`Fetched setting '${key}'`);
    // Send only the value
    res.status(200).json({ value: result.rows[0].setting_value });

  } catch (error) {
    logger.error(`Error fetching setting '${key}':`, { error });
    next(error); // Pass to global error handler
  }
});

// PUT /api/settings/:key - Update a specific setting value (Admin Only)
router.put('/:key', authenticateToken, async (req, res, next) => {
  const { key } = req.params;
  const { value } = req.body; // Expecting { "value": "new message" }

  logger.debug(`Received PUT request for setting key: ${key}`, { body: req.body });

  if (value === undefined || value === null || typeof value !== 'string') {
    logger.warn(`Invalid value provided for PUT request on setting '${key}'`);
    return res.status(400).json({ message: 'Se requiere un valor (setting_value) de tipo texto.' });
  }

  try {
    // Use INSERT ... ON CONFLICT ... UPDATE to handle both inserting and updating
    const query = `
      INSERT INTO settings (setting_key, setting_value) 
      VALUES ($1, $2) 
      ON CONFLICT (setting_key) 
      DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW() 
      RETURNING setting_key, setting_value, updated_at;
    `;
    const result = await db.query(query, [key, value]);

    if (result.rows.length === 0) {
       // This shouldn't typically happen with ON CONFLICT DO UPDATE
       logger.error(`Failed to update or insert setting '${key}'.`);
       return res.status(500).json({ message: 'Error al guardar la configuración.' });
    }

    logger.info(`Setting '${key}' updated successfully.`);
    res.status(200).json({
      message: 'Configuración actualizada exitosamente.',
      setting: result.rows[0]
    });

  } catch (error) {
    logger.error(`Error updating setting '${key}':`, { error });
    next(error); // Pass to global error handler
  }
});

module.exports = router; 