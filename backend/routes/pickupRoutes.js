const express = require('express');
const router = express.Router();
const db = require('../db'); // Import the database connection utility
const authenticateToken = require('../middleware/authMiddleware'); // Import auth middleware
const logger = require('../config/logger'); // Import logger

// Import status values from frontend config (adjust path if needed)
// NOTE: Ideally, this would be in a shared config/package, but for simplicity:
let statusValues = [];
try {
  // Adjust the path based on your actual project structure relative to this file
  statusValues = require('../../frontend/src/config/pickupStatuses').statusValues;
} catch (err) {
  logger.error("Failed to load status values from frontend config. Using default.", err);
  // Define fallback/default statuses here if loading fails
  statusValues = ['pendiente', 'asignado', 'recogido', 'cancelado'];
}

// --- Store connected SSE clients --- 
let sseClients = [];

// Define allowed values based on frontend constants (ideally share/sync these)
const validViaTypes = [
  'Autopista', 'Avenida', 'Bulevar', 'Calle', 'Carrera', 'Carretera', 'Circular',
  'Circunvalar', 'Corregimiento', 'Diagonal', 'Kilometro', 'Transversal', 'Troncal',
  'Variante', 'Vereda', 'Via'
];
const validLetters = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
  'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH',
  'BA', 'BB', 'BC', 'BD', 'BE', 'BF', 'BG', 'BH',
  'CA', 'CB', 'CC', 'CD', 'CE', 'CF', 'CG', 'CH',
  'DA', 'DB', 'DC', 'DD', 'DE', 'DF', 'DG', 'DH',
  'EA', 'EB', 'EC', 'ED', 'EE', 'EF', 'EG', 'EH',
  'FA', 'FB', 'FC', 'FD', 'FE', 'FF', 'FG', 'FH',
  'GA', 'GB', 'GC', 'GD', 'GE', 'GF', 'GG', 'GH',
  'HA', 'HB', 'HC', 'HD', 'HE', 'HF', 'HG', 'HH'
];
const validQuadrants = ['Este', 'Norte', 'Oeste', 'Sur'];

// Helper function to generate the full address string (similar to frontend)
const generateFullAddress = (data) => {
  let preview = '';
  if (data.tipoVia) preview += `${data.tipoVia} `;
  if (data.numViaP1) preview += `${data.numViaP1} `;
  if (data.letraVia) preview += `${data.letraVia} `;
  if (data.bis) {
      preview += `Bis `;
      if (data.letraBis) preview += `${data.letraBis} `;
  }
  if (data.sufijoCardinal1) preview += `${data.sufijoCardinal1} `;
  // Separator for the plaque number part
  if (data.numVia2 || data.letraVia2 || data.sufijoCardinal2 || data.num3) {
      preview += `# `;
  }
  if (data.numVia2) preview += `${data.numVia2} `;
  if (data.letraVia2) preview += `${data.letraVia2} `;
  if (data.sufijoCardinal2) preview += `${data.sufijoCardinal2} `;
  if (data.num3) preview += `- ${data.num3} `;

  // Add complemento at the end
  if (data.complemento) preview += ` (${data.complemento.trim()}) `;

  // Add City and Department
  if (data.ciudad) preview += `${data.ciudad}, `;
  if (data.departamento) preview += `${data.departamento}`;

  return preview.trim().replace(/ +/g, ' '); // Clean up extra spaces
};

// --- SSE Stream Route --- 
router.get('/stream', (req, res) => {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Flush headers immediately

    const clientId = Date.now(); // Simple ID for this client
    const newClient = {
        id: clientId,
        res: res // Store the response object to send events
    };
    sseClients.push(newClient);
    logger.info(`SSE Client connected: ${clientId}`);

    // Optional: Send a confirmation message
    res.write(`event: connected\ndata: ${JSON.stringify({ message: "SSE Connection Established" })}\n\n`);

    // Handle client disconnect
    req.on('close', () => {
        logger.info(`SSE Client disconnected: ${clientId}`);
        sseClients = sseClients.filter(client => client.id !== clientId);
        res.end(); // End the response when client closes connection
    });
});

// Function to send update to all SSE clients
const sendSseUpdate = (data) => {
    const eventData = JSON.stringify(data);
    sseClients.forEach(client => {
        client.res.write(`event: new_pickup\ndata: ${eventData}\n\n`);
    });
};

// POST /api/pickups - Handle new pickup request submission
router.post('/', async (req, res, next) => {
  logger.debug('Received pickup request body:', { body: req.body });

  // Destructure updated fields
  const {
    nombreMascota,
    tipoMuestra,
    departamento,
    ciudad,
    tipoVia,
    numViaP1,
    letraVia,
    bis,
    letraBis,
    sufijoCardinal1,
    numVia2,
    letraVia2,
    sufijoCardinal2,
    num3,
    complemento,
    fechaPreferida,   // NEW: Expecting YYYY-MM-DD string or null
    turnoPreferido   // NEW: Expecting 'mañana', 'tarde', or null
  } = req.body;

  // --- Enhanced Backend Validation --- 
  const errors = {};

  // Basic required fields
  if (!nombreMascota?.trim()) errors.nombreMascota = 'Nombre del solicitante requerido.'; // Updated label
  if (!tipoMuestra?.trim()) errors.tipoMuestra = 'Número de contacto requerido.'; // Updated label
  if (!departamento?.trim()) errors.departamento = 'Departamento requerido.';
  if (!ciudad?.trim()) errors.ciudad = 'Ciudad requerida.';
  if (!tipoVia?.trim()) {
      errors.tipoVia = 'Tipo de vía requerido.';
  } else if (!validViaTypes.includes(tipoVia)) {
      errors.tipoVia = 'Tipo de vía inválido.';
  }
  if (!numViaP1?.trim()) errors.numViaP1 = 'Número de vía principal requerido.';
  if (!numVia2?.trim()) errors.numVia2 = 'Número de vía generadora requerido.';
  if (!num3?.trim()) errors.num3 = 'Número de placa requerido.';

  // Optional field validations (if provided)
  if (letraVia && !validLetters.includes(letraVia)) errors.letraVia = 'Letra de vía inválida.';
  if (bis && letraBis && !validLetters.includes(letraBis)) errors.letraBis = 'Letra de Bis inválida.';
  if (sufijoCardinal1 && !validQuadrants.includes(sufijoCardinal1)) errors.sufijoCardinal1 = 'Sufijo cardinal 1 inválido.';
  if (letraVia2 && !validLetters.includes(letraVia2)) errors.letraVia2 = 'Letra de vía 2 inválida.';
  if (sufijoCardinal2 && !validQuadrants.includes(sufijoCardinal2)) errors.sufijoCardinal2 = 'Sufijo cardinal 2 inválido.';

  // Date and Shift validation
  if (fechaPreferida) {
      // Basic YYYY-MM-DD format check (simple regex, consider library for robust validation)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaPreferida)) {
          errors.fechaPreferida = 'Formato de fecha inválido (esperado YYYY-MM-DD).';
      } else {
          try {
              const selectedDate = new Date(fechaPreferida + 'T00:00:00'); // Parse as UTC start of day
              const today = new Date();
              today.setHours(0, 0, 0, 0); // Compare date part only
              if (isNaN(selectedDate.getTime())) {
                  errors.fechaPreferida = 'Fecha inválida.';
              } else if (selectedDate < today) {
                  errors.fechaPreferida = 'La fecha no puede ser pasada.';
              }
          } catch (e) {
               errors.fechaPreferida = 'Error al procesar la fecha.';
          }
      }
      // If date is provided, shift must also be provided and valid
      if (!turnoPreferido || !['mañana', 'tarde'].includes(turnoPreferido)) {
          errors.turnoPreferido = 'Se requiere un turno (mañana/tarde) si se especifica fecha.';
      }
  } else if (turnoPreferido) {
      // Cannot have shift without date
       errors.fechaPreferida = 'Se requiere una fecha para seleccionar un turno.';
  }

  // Check if any errors were found
  if (Object.keys(errors).length > 0) {
      logger.warn('Pickup request validation failed', { errors: errors });
      return res.status(400).json({ message: 'Datos inválidos o incompletos.', errors });
  }
  // --------------------------------

  try {
    // Generate the full address string for storage
    const direccionCompleta = generateFullAddress(req.body);

    // Update the SQL query for insertion
    const insertQuery = `
      INSERT INTO pickups (
        nombre_mascota, tipo_muestra, departamento, ciudad, 
        tipo_via, num_via_p1, letra_via, bis, letra_bis, sufijo_cardinal1, 
        num_via2, letra_via2, sufijo_cardinal2, num3, complemento, 
        direccion_completa, fecha_preferida, turno_preferido -- Use new columns
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) -- 18 params
      RETURNING *;
    `;

    // Update the values array for the parameterized query
    const values = [
      nombreMascota,
      tipoMuestra,
      departamento,
      ciudad,
      tipoVia,
      numViaP1,
      letraVia || null,
      bis || false,
      letraBis || null,
      sufijoCardinal1 || null,
      numVia2,
      letraVia2 || null,
      sufijoCardinal2 || null,
      num3,
      complemento || null,
      direccionCompleta,
      fechaPreferida,   // Pass date string directly (PostgreSQL will cast)
      turnoPreferido   // Pass shift string or null
    ];

    // Execute the query
    logger.info('Executing DB Insert...');
    const result = await db.query(insertQuery, values);
    const newPickup = result.rows[0];
    logger.info('New pickup created successfully', { pickupId: newPickup.id });

    // --- Send update to connected SSE clients --- 
    sendSseUpdate(newPickup);
    // --------------------------------------------

    // TODO: Send confirmation email to user (will require email service setup)

    // Respond with the created pickup data
    res.status(201).json({
        message: 'Solicitud de recogida creada exitosamente.',
        pickup: newPickup
    });

  } catch (error) {
    logger.error('Error saving pickup request to DB:', { error: error });
    next(error); // Pass to global handler
  }
});

// --- ADMIN ROUTES (Protected by authenticateToken middleware) --- 

// Apply middleware to all subsequent routes in this file
router.use(authenticateToken);

// GET /api/pickups - Fetch all pickup requests (Admin Only)
router.get('/', async (req, res, next) => {
  logger.debug('Fetching all pickups (Admin)');
  try {
    // Select relevant columns for the list view initially
    const query = `
        SELECT 
            id, nombre_mascota, tipo_muestra, ciudad, departamento, 
            direccion_completa, fecha_hora_preferida, tipo_recogida, status, created_at
        FROM pickups 
        ORDER BY created_at DESC;`; 
    
    const result = await db.query(query);
    logger.debug(`Fetched ${result.rows.length} pickups`);
    res.status(200).json(result.rows);

  } catch (error) {
    logger.error('Error fetching pickups:', { error: error });
    next(error); // Pass to global handler
  }
});

// GET /api/pickups/:id - Fetch a single pickup request by ID (Admin Only)
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  logger.debug(`Fetching pickup with ID: ${id} (Admin)`);

  if (isNaN(parseInt(id, 10))) { // Basic validation for ID format
     return res.status(400).json({ message: 'ID de solicitud inválido.' });
  }

  try {
    const query = 'SELECT * FROM pickups WHERE id = $1';
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      logger.warn(`Pickup with ID ${id} not found for GET request.`);
      return res.status(404).json({ message: 'Solicitud de recogida no encontrada.' });
    }

    logger.debug(`Fetched pickup details for ID: ${id}`);
    res.status(200).json(result.rows[0]);

  } catch (error) {
    logger.error(`Error fetching pickup with ID ${id}:`, { error: error });
    next(error); // Pass to global handler
  }
});

// PUT /api/pickups/:id - Update a pickup request (Admin Only)
router.put('/:id', async (req, res, next) => {
  const { id } = req.params;
  const { status, driver_id } = req.body; // Expecting status and/or driver_id in the body

  logger.debug(`Received PUT request for pickup ID: ${id}`, { body: req.body });

  if (isNaN(parseInt(id, 10))) {
     logger.warn(`Invalid ID format for PUT request: ${id}`);
     return res.status(400).json({ message: 'ID de solicitud inválido.' });
  }

  // Basic validation for update payload
  if (status === undefined && driver_id === undefined) {
    logger.warn(`Empty payload for PUT request on ID: ${id}`);
    return res.status(400).json({ message: 'Se requiere al menos un campo para actualizar (status o driver_id).' });
  }

  // *** Add validation for allowed status values ***
  if (status !== undefined && !statusValues.includes(status)) {
      logger.warn(`Invalid status value provided for PUT request on ID ${id}: ${status}`);
      return res.status(400).json({ 
          message: `Valor de estado inválido: ${status}. Estados permitidos: ${statusValues.join(', ')}` 
      });
  }

  // TODO: Add validation for driver_id if drivers table exists (e.g., check if driver ID is valid)
  if (driver_id !== undefined && driver_id !== null && isNaN(parseInt(driver_id, 10))) {
    logger.warn(`Invalid driver_id format for PUT request on ID ${id}: ${driver_id}`);
    return res.status(400).json({ message: 'ID de Conductor debe ser un número o nulo.'});
  }

  try {
    // Build the update query dynamically based on provided fields
    let updateFields = [];
    let values = [];
    let valueIndex = 1;

    if (status !== undefined) {
      updateFields.push(`status = $${valueIndex++}`);
      values.push(status);
    }
    if (driver_id !== undefined) {
      updateFields.push(`driver_id = $${valueIndex++}`);
      values.push(driver_id); // Allow null to unassign?
    }

    // Always update the updated_at timestamp (handled by trigger, but good practice)
    // The trigger handles updated_at automatically, no need to set it here if trigger exists.
    // updateFields.push(`updated_at = CURRENT_TIMESTAMP`); 

    if (updateFields.length === 0) {
         // Should have been caught by earlier validation, but as a safeguard
        return res.status(400).json({ message: 'No hay campos válidos para actualizar.' });
    }

    values.push(id); // Add the id for the WHERE clause
    const query = `UPDATE pickups SET ${updateFields.join(', ')} WHERE id = $${valueIndex} RETURNING *`;

    logger.info("Update Query:", query);
    logger.info("Update Values:", values);

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      logger.warn(`Pickup with ID ${id} not found for PUT request.`);
      return res.status(404).json({ message: 'Solicitud de recogida no encontrada para actualizar.' });
    }

    logger.info(`Pickup with ID ${id} updated successfully.`);
    res.status(200).json({
      message: 'Solicitud actualizada exitosamente.',
      pickup: result.rows[0]
    });

  } catch (error) {
    logger.error(`Error updating pickup with ID ${id}:`, { error: error });
    next(error); // Pass to global handler
  }
});

// TODO: Add DELETE /api/pickups/:id route if needed

module.exports = router; 
module.exports = router; 