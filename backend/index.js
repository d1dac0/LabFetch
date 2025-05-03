const express = require('express');
const cors = require('cors');
require('dotenv').config();
const logger = require('./config/logger'); // Import logger
const path = require('path');
const db = require('./db'); // Import the database connection utility

// Import routes
const pickupRoutes = require('./routes/pickupRoutes');
const adminRoutes = require('./routes/adminRoutes'); // Import admin routes
const settingsRoutes = require('./routes/settingsRoutes'); // Require the new settings routes

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies

// Basic route
app.get('/', (req, res) => {
  res.send('LabFetch Backend is running!');
});

// API Routes
app.use('/api/pickups', pickupRoutes); // Mount pickup routes
app.use('/api/admin', adminRoutes); // Mount admin routes
app.use('/api/settings', settingsRoutes); // Use the settings routes

// --- Global Error Handling Middleware --- 
// Should be defined AFTER all other app.use() and routes calls
app.use((err, req, res, next) => {
  logger.error("[Global Error Handler]", { error: err, stack: err.stack }); // Log error object
  
  // Check for specific error types if needed (e.g., validation errors)
  // if (err instanceof MyCustomError) { ... }

  // Send generic error response
  // Avoid sending stack trace in production environment
  const statusCode = err.statusCode || 500; // Use error status code or default to 500
  const message = process.env.NODE_ENV === 'production' 
                  ? 'Ocurrió un error interno en el servidor.' 
                  : err.message || 'Internal Server Error';

  res.status(statusCode).json({ message: message });
});
// -------------------------------------

app.listen(port, () => {
  logger.info(`Server listening on port ${port}`); // Use logger
}); 