const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { Pool } = require('pg');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://deliveries-app-v1o9.vercel.app',
      'https://deliveries-app.vercel.app',
      'https://safe-app-woad.vercel.app',
      'https://safe-powmb9asg-mugisha-joshuas-projects.vercel.app',
      'https://safe-cbzxpy50p-mugisha-joshuas-projects.vercel.app'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(morgan('combined')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Parse DATABASE_URL to extract connection parameters
// Format: postgres://username:password@host:port/database or postgresql://username:password@host/database (Neon format)
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

// Test database connection and initialize tables
const initDatabase = async () => {
  try {
    // Test the connection
    const client = await pool.connect();
    console.log('✅ Connected to Neon database');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        password_hash VARCHAR(255),
        role VARCHAR(50) DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created successfully (or already exists)');
    
    // Create deliveries table
    await client.query(`
      CREATE TABLE IF NOT EXISTS deliveries (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES users(id),
        rider_id INTEGER REFERENCES users(id),
        pickup_address TEXT NOT NULL,
        delivery_address TEXT NOT NULL,
        package_description TEXT,
        package_weight DECIMAL(10,2),
        delivery_fee DECIMAL(10,2),
        payment_method VARCHAR(50) DEFAULT 'cash',
        status VARCHAR(50) DEFAULT 'pending',
        current_location_lat DECIMAL(10,8),
        current_location_lng DECIMAL(11,8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Deliveries table created successfully (or already exists)');
    
    // Release the client back to the pool
    client.release();
    
    console.log('✅ All tables initialized successfully');
  } catch (err) {
    console.error('❌ Error initializing database:', err.message);
    // Try to continue even if there's an error - the tables might already exist
  }
};

// Initialize database tables
initDatabase();

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Deliveries App API',
    version: '1.0.0',
    status: 'running'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Database connection status endpoint - verifies Neon database connection
app.get('/api/db-status', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    client.release();
    
    res.json({
      success: true,
      connected: true,
    message: 'Successfully connected to Neon database',
      database_time: result.rows[0].current_time,
      postgres_version: result.rows[0].pg_version
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      connected: false,
      message: 'Failed to connect to Neon database',
      error: err.message
    });
  }
});

// API Routes (to be implemented)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/deliveries', require('./routes/deliveries'));
app.use('/api/users', require('./routes/users'));
app.use('/api/bookings', require('./routes/bookings'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown - close database connection
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down gracefully...');
  await pool.end();
  console.log('✅ Database connection closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down gracefully...');
  await pool.end();
  console.log('✅ Database connection closed');
  process.exit(0);
});

module.exports = app;
