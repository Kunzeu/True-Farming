require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log("Connected to Supabase DB.");
    
    // Check constraints
    const res = await client.query(`
      SELECT constraint_name 
      FROM information_schema.key_column_usage 
      WHERE table_name = 'users' AND column_name = 'gw2_api_key'
    `);
    console.log("Constraints on gw2_api_key:", res.rows);
    
    // Drop known unique constraint names
    const constraintsToDrop = [
      'users_gw2_api_key_key',
      'users_gw2_api_key_unique',
      'users_gw2_api_key_idx'
    ];
    
    for (const constraint of res.rows) {
      if (!constraintsToDrop.includes(constraint.constraint_name)) {
        constraintsToDrop.push(constraint.constraint_name);
      }
    }
    
    for (const cName of constraintsToDrop) {
      try {
        await client.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS "${cName}"`);
        console.log("Dropped constraint:", cName);
      } catch (e) {
        console.log("Could not drop constraint:", cName, e.message);
      }
    }

    // It might also be an index
    try {
      await client.query(`DROP INDEX IF EXISTS users_gw2_api_key_key`);
      console.log("Dropped index users_gw2_api_key_key");
    } catch(e){}

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
