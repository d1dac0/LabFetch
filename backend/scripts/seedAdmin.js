const bcrypt = require('bcrypt');
const db = require('../db'); // Import the database pool

// --- Configuration ---
const defaultUsername = 'admin';
const defaultPassword = 'password123'; // CHANGE THIS!
const saltRounds = 10; // Standard salt rounds for bcrypt
// -------------------

const seedAdmin = async () => {
  if (!defaultPassword || defaultPassword === 'password123') {
      console.warn('\n*** WARNING: Using default insecure password for admin seeding. Please change defaultPassword in seedAdmin.js ***\n');
  }
  try {
    console.log(`Hashing password for user: ${defaultUsername}...`);
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);
    console.log('Password hashed successfully.');

    // --- Update the database directly ---
    console.log(`Attempting to update password hash for user '${defaultUsername}' in the database...`);
    const updateResult = await db.query(
      'UPDATE admins SET password_hash = $1 WHERE username = $2',
      [hashedPassword, defaultUsername]
    );

    if (updateResult.rowCount > 0) {
      console.log(`Successfully updated password hash for user '${defaultUsername}'.`);
    } else {
      // If update failed (user might not exist), try inserting
      console.log(`User '${defaultUsername}' not found for update. Attempting to insert...`);
      const insertResult = await db.query(
        'INSERT INTO admins (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING',
        [defaultUsername, hashedPassword]
      );
      if (insertResult.rowCount > 0) {
          console.log(`Successfully inserted user '${defaultUsername}' with new password hash.`);
      } else {
          console.log(`User '${defaultUsername}' already exists, and update failed. Check manually.`);
      }
    }
    // ------------------------------------

    /* Remove old SQL generation
    const insertStatement = `
    // ... SQL string ...
    `;

    console.log('\nCopy and run the following SQL statement in your database:');
    console.log('------------------------------------------------------');
    console.log(insertStatement);
    console.log('------------------------------------------------------');
    */

  } catch (error) {
    console.error('Error hashing password or updating database:', error);
  } finally {
    // Optionally, close the pool if the script is standalone and finishes
    // await db.pool.end(); // Uncomment if needed
  }
};

seedAdmin(); 