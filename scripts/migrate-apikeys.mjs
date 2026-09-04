import { config as loadDotenv } from 'dotenv';
import pg from 'pg';
import crypto from 'crypto';

loadDotenv();

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("No DATABASE_URL or POSTGRES_URL found in .env");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: /localhost|127\.0\.0\.1/i.test(connectionString) ? false : { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log("Starting API Key Migration...");

    // Find all users who have a gw2_api_key set
    const result = await client.query(`
      SELECT id, gw2_api_key, preferences 
      FROM users 
      WHERE gw2_api_key IS NOT NULL AND gw2_api_key != ''
    `);

    const users = result.rows;
    console.log(`Found ${users.length} users with a gw2_api_key.`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
      const prefs = user.preferences || {};
      const apiKeys = prefs.apiKeys || [];
      const legacyKey = user.gw2_api_key;

      // Check if the key is already in their preferences
      const exists = apiKeys.some(k => k.key === legacyKey);
      
      if (!exists) {
        console.log(`Migrating user ${user.id}...`);
        try {
          // Push it into apiKeys
          const newApiKeys = [...apiKeys, {
            id: crypto.randomUUID(),
            name: "Main Account (Legacy)",
            key: legacyKey
          }];

          const newPrefs = { ...prefs, apiKeys: newApiKeys };

          // Update user
          await client.query(`
            UPDATE users
            SET preferences = $1
            WHERE id = $2
          `, [JSON.stringify(newPrefs), user.id]);

          migrated++;
        } catch (e) {
          console.error(`Error migrating user ${user.id}:`, e);
          errors++;
        }
      } else {
        skipped++;
      }
    }

    console.log("Migration Complete!");
    console.log(`Migrated: ${migrated}`);
    console.log(`Skipped (Already migrated): ${skipped}`);
    console.log(`Errors: ${errors}`);
  } finally {
    client.release();
    pool.end();
  }
}

runMigration().catch(console.error);
