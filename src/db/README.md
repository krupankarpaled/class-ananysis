# Database Setup

This directory contains the database schema and connection management for the Emotion-Aware Classroom Analyzer.

## Prerequisites

- PostgreSQL 12 or higher installed and running
- Node.js environment with required dependencies

## Setup Instructions

### 1. Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE classroom_analyzer;

# Create user (optional)
CREATE USER classroom_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE classroom_analyzer TO classroom_user;

# Exit psql
\q
```

### 3. Configure Environment

Copy `.env.example` to `.env` and update the DATABASE_URL:

```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL=postgresql://classroom_user:your_password@localhost:5432/classroom_analyzer
```

### 4. Run Migration

```bash
npm run migrate
```

This will create all necessary tables and indexes.

## Files

- **schema.sql** - Complete database schema with tables and indexes
- **connection.js** - Database connection pool and query utilities
- **migrate.js** - Migration script to initialize the database

## Connection Pool

The connection pool is configured with:
- Maximum 20 connections
- 30 second idle timeout
- 2 second connection timeout

## Usage in Code

```javascript
const { query, getClient } = require('./db/connection');

// Simple query
const result = await query('SELECT * FROM users WHERE email = $1', [email]);

// Transaction
const client = await getClient();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO users...');
  await client.query('INSERT INTO sessions...');
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}
```

## Troubleshooting

**Connection refused:**
- Ensure PostgreSQL is running: `pg_isready`
- Check DATABASE_URL format
- Verify firewall settings

**Permission denied:**
- Grant proper privileges to your database user
- Check pg_hba.conf for authentication settings

**Schema errors:**
- Drop and recreate database if needed
- Run migration again: `npm run migrate`
