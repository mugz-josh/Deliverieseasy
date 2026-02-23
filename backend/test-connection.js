const { Pool } = require('pg');
require('dotenv').config();

console.log('🔍 Debug: DATABASE_URL is', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

if (process.env.DATABASE_URL) {
  console.log('🔍 Debug: First 50 chars:', process.env.DATABASE_URL.substring(0, 50));
}

// Parse DATABASE_URL to extract connection parameters
// Format: postgres://username:password@host:port/database
function parseDatabaseUrl(url) {
  try {
    // Try format with port: postgres://user:pass@host:port/db
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
    // Try format without port (like Neon): postgres://user:pass@host/db
    match = url.match(/postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)/);
    if (match) {
      const databasePart = match[4].split('?')[0];
      return {
        user: decodeURIComponent(match[1]),
        password: decodeURIComponent(match[2]),
        host: match[3],
        port: 5432,
        database: databasePart
      };
    }
    console.log('⚠️ Could not parse DATABASE_URL format');
    return null;
  } catch (err) {
    console.error('Error parsing DATABASE_URL:', err.message);
  }
  return null;
}

const dbParams = parseDatabaseUrl(process.env.DATABASE_URL);

console.log('🔍 Debug: Parsed params:', dbParams);

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

let output = '🔄 Testing Neon database connection...\n\n';

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  output += '❌ ERROR: DATABASE_URL is not set!\n';
  output += 'Please create a .env file in the backend folder and add:\n';
  output += 'DATABASE_URL=postgresql://username:password@host.neon.tech/dbname?sslmode=require\n\n';
  output += 'Or get your connection string from Neon dashboard:\n';
  output += '1. Go to https://neon.tech\n';
  output += '2. Select your project\n';
  output += '3. Go to Connection Details\n';
  output += '4. Copy the "Connection string"\n';
  console.log(output);
  process.exit(1);
}

async function testConnection() {
  try {
    console.log('🔄 Attempting to connect to database...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    
    output += '✅ SUCCESS! Connected to Neon database!\n';
    output += '📅 Database Time: ' + result.rows[0].current_time + '\n';
    output += '🗄️  PostgreSQL Version: ' + result.rows[0].pg_version + '\n';
    
    client.release();
    await pool.end();
  } catch (err) {
    output += '❌ FAILED! Could not connect to Neon database\n';
    output += 'Error: ' + err.message + '\n\n';
    
    if (err.message.includes('ENOTFOUND')) {
      output += '🔧 TROUBLESHOOTING:\n';
      output += 'The database hostname could not be resolved.\n';
      output += '1. Check if your Neon host is correct\n';
      output += '2. The DATABASE_URL is incorrect - Check for typos in your .env file\n\n';
    } else if (err.message.includes('password authentication failed')) {
      output += '🔧 TROUBLESHOOTING:\n';
      output += 'The password in your DATABASE_URL is incorrect.\n';
      output += 'Update your .env file with the correct password.\n';
    } else if (err.message.includes('ECONNREFUSED')) {
      output += '🔧 TROUBLESHOOTING:\n';
      output += 'The connection was refused. The database might be down.\n';
      output += 'Check if your Neon service is active.\n';
    } else if (err.message.includes('sslmode') || err.message.includes('SSL')) {
      output += '🔧 TROUBLESHOOTING:\n';
      output += 'SSL connection issue. Make sure your DATABASE_URL includes ?sslmode=require\n';
    }
    
    output += '\n📝 Need help? Check your Neon connection settings.';
  }
  
  const fs = require('fs');
  fs.writeFileSync('connection-result.txt', output);
  console.log(output);
}

testConnection();
