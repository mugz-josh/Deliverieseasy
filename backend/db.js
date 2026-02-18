const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Parse DATABASE_URL to extract connection parameters
// Format: postgres://username:password@host:port/database or postgresql://username:password@host/database
function parseDatabaseUrl(url) {
  try {
    // Try to match postgres:// or postgresql:// format with port
    let match = url.match(/postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (match) {
      return {
        user: decodeURIComponent(match[1]),
        password: decodeURIComponent(match[2]),
        host: match[3],
        port: parseInt(match[4]),
        database: match[5]
      };
    }
    // Try to match format without port (like Neon)
    match = url.match(/postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)/);
    if (match) {
      const databasePart = match[4].split('?')[0]; // Remove query params if any
      return {
        user: decodeURIComponent(match[1]),
        password: decodeURIComponent(match[2]),
        host: match[3],
        port: 5432, // Default PostgreSQL port
        database: databasePart
      };
    }
  } catch (err) {
    console.error('Error parsing DATABASE_URL:', err.message);
  }
  return null;
}

const dbParams = parseDatabaseUrl(process.env.DATABASE_URL);

// PostgreSQL Database connection
const pool = new Pool(dbParams ? {
  host: dbParams.host,
  port: dbParams.port,
  database: dbParams.database,
  user: dbParams.user,
  password: dbParams.password,
  ssl: {
    rejectUnauthorized: false
  }
} : {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;
