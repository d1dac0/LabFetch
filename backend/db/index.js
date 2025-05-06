const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, 
  // Optional: Add SSL configuration for production environments
  /*
  ssl: {
    rejectUnauthorized: false // Adjust based on your SSL certificate setup
  }
  */
});

pool.on('connect', () => {
  console.log('Connected to the Database via pool');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
/* {
  query: (text, params) => pool.query(text, params),
  // Add other specific database functions if needed
  // e.g., getClient: () => pool.connect(),
}; */ 