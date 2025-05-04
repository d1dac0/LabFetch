const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises; // Use promises version of fs
const multer = require('multer'); // Require multer
const db = require('../db'); // Import the database connection utility
const authenticateToken = require('../middleware/authMiddleware'); // Import auth middleware
const logger = require('../config/logger'); // Import logger
const authenticateAdmin = require('../middleware/authMiddleware');

// Define valid statuses within the backend
const VALID_PICKUP_STATUSES = [
    'pendiente',
    'asignado',
    'en_camino',
    'recolectado', // Changed from 'recogido'? Check consistency
    'en_laboratorio',
    'completado',
    'cancelado'
];

// --- Store connected SSE clients directly in this module --- 
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
router.get('/stream', authenticateAdmin, (req, res) => {
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

// Function to send update to all SSE clients (uses local sseClients array)
const sendSseUpdate = (data) => {
    const eventData = JSON.stringify(data);
    logger.info(`Sending SSE update to ${sseClients.length} clients.`);
    sseClients.forEach(client => {
        try {
            client.res.write(`event: new_pickup\ndata: ${eventData}\n\n`);
        } catch (error) {
             logger.error(`Error writing to SSE client ${client.id}:`, error);
             // Optional: remove client if write fails?
        }
    });
};

// --- Multer Configuration --- 
// Store files in memory first
const storage = multer.memoryStorage(); 
const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // Increased limit to 25MB
  fileFilter: (req, file, cb) => { // Filter file types
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('¡Solo se permiten archivos de imagen!'), false);
    }
  }
});
// --------------------------

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
  if (bis && letraBis && !validLetters.includes(letraBis)) errors.letraBis = 'Letra de Bis inválida.';
  if (sufijoCardinal1 && !validQuadrants.includes(sufijoCardinal1)) errors.sufijoCardinal1 = 'Sufijo cardinal 1 inválido.';
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
    const query = `
        SELECT 
            id, nombre_mascota, tipo_muestra, ciudad, departamento, 
            direccion_completa, fecha_preferida, turno_preferido, status, created_at, 
            notes, photo_path -- Include new fields
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
router.get('/:id', authenticateAdmin, async (req, res, next) => {
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
router.put('/:id', authenticateAdmin, async (req, res, next) => {
  const { id } = req.params;
  const { status, driver_id, notes } = req.body;
  let updateFields = [];
  let queryParams = [];
  let paramIndex = 1;

  logger.info(`PUT request for pickup ID: ${id}`, { body: req.body });

  if (status !== undefined) {
      // Validate status against backend list
      if (!VALID_PICKUP_STATUSES.includes(status)) {
           logger.warn(`Invalid status value provided for pickup ${id}: ${status}`);
           return res.status(400).json({ message: `Estado inválido: ${status}` });
      }
      updateFields.push(`status = $${paramIndex++}`);
      queryParams.push(status);
      logger.debug(`Updating status for pickup ${id} to ${status}`);
  }

  // Handle driver_id (allow null)
  if (driver_id !== undefined) {
      if (driver_id !== null && typeof driver_id !== 'number') {
          logger.warn(`Invalid driver_id type for pickup ${id}: ${typeof driver_id}`);
          return res.status(400).json({ message: 'driver_id debe ser un número o null.' });
      }
      updateFields.push(`driver_id = $${paramIndex++}`);
      queryParams.push(driver_id);
      logger.debug(`Updating driver_id for pickup ${id} to ${driver_id}`);
  }

  // Handle notes (allow null or empty string)
   if (notes !== undefined) {
        if (typeof notes !== 'string' && notes !== null) {
            logger.warn(`Invalid notes type for pickup ${id}: ${typeof notes}`);
            return res.status(400).json({ message: 'notes debe ser un texto o null.' });
        }
        updateFields.push(`notes = $${paramIndex++}`);
        queryParams.push(notes); // Allow empty string or null
        logger.debug(`Updating notes for pickup ${id}`);
    }

  if (updateFields.length === 0) {
    logger.warn(`PUT request for pickup ${id} received no fields to update.`);
    return res.status(400).json({ message: 'No se proporcionaron campos para actualizar.' });
  }

  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  queryParams.push(id);

  const updateQuery = `UPDATE pickups SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

  logger.debug(`Executing update query for pickup ${id}: ${updateQuery}`, { params: queryParams });

  try {
    const result = await db.query(updateQuery, queryParams);
    if (result.rows.length === 0) {
      logger.warn(`Pickup with ID ${id} not found for update.`);
      return res.status(404).json({ message: 'Solicitud no encontrada.' });
    }
    logger.info(`Pickup ${id} updated successfully.`);
    res.json({ message: 'Solicitud actualizada exitosamente.', pickup: result.rows[0] });
  } catch (error) {
     logger.error(`Error updating pickup ${id}:`, { error });
     next(error);
  }
});

// --- NEW ROUTE: POST Photo Upload --- 
router.post('/:id/photo', upload.single('pickupPhoto'), async (req, res, next) => {
  const { id } = req.params;
  logger.info(`Received photo upload request for pickup ID: ${id}`);

  if (!req.file) {
    logger.warn(`No file uploaded for pickup ID: ${id}`);
    return res.status(400).json({ message: 'No se proporcionó ningún archivo de imagen.' });
  }

  if (isNaN(parseInt(id, 10))) {
     logger.warn(`Invalid ID format for photo upload request: ${id}`);
     // Optionally delete temp file if multer saved one?
     return res.status(400).json({ message: 'ID de solicitud inválido.' });
  }

  try {
    // --- Check if pickup exists --- 
    const checkQuery = 'SELECT photo_path FROM pickups WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);
    if (checkResult.rows.length === 0) {
      logger.warn(`Pickup with ID ${id} not found for photo upload.`);
      return res.status(404).json({ message: 'Solicitud de recogida no encontrada.' });
    }
    const oldPhotoPath = checkResult.rows[0].photo_path;

    // --- Save the file --- 
    try { // Add try block for robust error catching
      // Check if req.file and originalname exist
      if (!req.file || typeof req.file.originalname !== 'string') {
          logger.error('req.file or req.file.originalname is missing or invalid.', { file: req.file });
          // Throw an error to be caught by the outer handler or the new catch block
          throw new Error('Información del archivo cargado inválida.');
      }

      // Log the original filename received by multer
      const originalName = req.file.originalname;
      // logger.info('Received originalname:', originalName); // REMOVED

      const fileExt = path.extname(originalName).toLowerCase(); // Get extension
      // logger.info('Extracted file extension:', fileExt); // REMOVED

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const baseFilename = `pickup-${id}-${uniqueSuffix}`;
      // logger.info('Base filename:', baseFilename); // REMOVED

      // --- Default extension if none found (fallback) ---
      const finalFileExt = fileExt || '.jpeg'; // Default to .jpeg if extraction failed
      // logger.info('Using final extension:', finalFileExt); // REMOVED
      // ----------------------------------------------

      const newFilename = baseFilename + finalFileExt; // Use final extension
      // logger.info('Generated new filename:', newFilename); // REMOVED

      const uploadsDir = path.join(__dirname, '..', 'uploads');
      const newFilePath = path.join(uploadsDir, newFilename); // Full path for saving
      // logger.info('Generated new file path for saving:', newFilePath); // REMOVED

      const relativePath = `/uploads/${newFilename}`; // Path for DB
      // logger.info('Generated relativePath for DB:', relativePath); // REMOVED

      await fs.writeFile(newFilePath, req.file.buffer); // Saves file
      // logger.info('Photo saved successfully to filesystem'); // REMOVED

      // Proceed to delete old photo and update DB *only if* file saving succeeded

      // --- Delete old photo if it exists --- 
      if (oldPhotoPath) {
        try {
          const fullOldPath = path.join(__dirname, '..', oldPhotoPath.substring(1)); // Remove leading / from DB path
          logger.info(`Attempting to delete old photo: ${fullOldPath}`);
          await fs.unlink(fullOldPath);
          logger.info(`Deleted old photo: ${fullOldPath}`);
        } catch (unlinkError) {
          // Log error but don't fail the request if old file deletion fails
          if (unlinkError.code !== 'ENOENT') { // Ignore 'file not found' errors
              logger.error(`Error deleting old photo ${oldPhotoPath}:`, unlinkError);
          } else {
               logger.warn(`Old photo not found for deletion: ${oldPhotoPath}`);
          }
        }
      }

      // --- Update database --- 
      const updateQuery = 'UPDATE pickups SET photo_path = $1 WHERE id = $2 RETURNING photo_path';
      // logger.info(`Saving photo_path to DB: [${relativePath}]`); // REMOVED 
      const updateResult = await db.query(updateQuery, [relativePath, id]);

      logger.info(`Updated photo_path in DB for pickup ${id} to: ${updateResult.rows[0].photo_path}`); // KEEPING this one

      res.status(200).json({
        message: 'Foto cargada y asociada exitosamente.',
        photoPath: updateResult.rows[0].photo_path 
      });

    } catch (fileProcessingError) {
        logger.error('Error during file saving/processing block:', fileProcessingError);
        // Prevent sending a success response if this block failed
        // Let the main try...catch below handle the final response
        // Re-throw the error to be caught by the main handler
        throw fileProcessingError; 
    }

  } catch (error) {
    // Handle specific Multer errors (like file too large)
     if (error instanceof multer.MulterError) {
        logger.warn(`Multer error during photo upload for pickup ${id}:`, error);
        return res.status(400).json({ message: `Error de carga: ${error.message}` });
    }
    // Handle file filter errors
    if (error.message === '¡Solo se permiten archivos de imagen!') {
        logger.warn(`Invalid file type uploaded for pickup ${id}`);
        return res.status(400).json({ message: error.message });
    }
    // Handle other errors
    logger.error(`Error processing photo upload for pickup ${id}:`, error);
    next(error);
  }
});

// TODO: Add DELETE /api/pickups/:id route if needed

module.exports = router; 