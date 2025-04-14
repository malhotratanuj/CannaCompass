import { db } from './db';
import { users, userPreferences, savedStrains } from '@shared/schema';

async function main() {
  console.log('Setting up database tables...');
  
  try {
    // Create users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `);
    console.log('✅ Created users table');
    
    // Create user preferences table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        mood TEXT,
        experience_level TEXT,
        effects TEXT[],
        flavors TEXT[],
        consumption_method TEXT[]
      );
    `);
    console.log('✅ Created user_preferences table');
    
    // Create saved strains table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS saved_strains (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        strain_id TEXT NOT NULL,
        saved_at TEXT NOT NULL
      );
    `);
    console.log('✅ Created saved_strains table');
    
    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

main();