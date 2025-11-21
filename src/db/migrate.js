#!/usr/bin/env node

/**
 * Database migration script
 * Run with: node src/db/migrate.js
 */

require('dotenv').config();
const { initializeSchema, testConnection, closePool, query } = require('./connection');

async function runMigration() {
  console.log('Starting database migration...');
  try {
    const reset = process.argv.includes('--reset') || process.argv.includes('reset');
    const connected = await testConnection();
    if (!connected) {
      console.error('Failed to connect to database. Please check your DATABASE_URL environment variable.');
      process.exit(1);
    }
    if (reset) {
      console.log('Resetting database schema...');
      await query('DROP TABLE IF EXISTS alerts CASCADE');
      await query('DROP TABLE IF EXISTS snapshots CASCADE');
      await query('DROP TABLE IF EXISTS sessions CASCADE');
      await query('DROP TABLE IF EXISTS users CASCADE');
    }
    await initializeSchema();
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
