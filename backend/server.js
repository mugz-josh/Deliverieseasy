const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Database connection
const dbPath = path.join(__dirname, process.env.DATABASE_URL || 'deliveries.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

// Initialize database tables
const initDatabase = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'rider', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      rider_id INTEGER,
      pickup_address TEXT NOT NULL,
      delivery_address TEXT NOT NULL,
      package_description TEXT NOT NULL,
      package_weight REAL,
      delivery_fee REAL,
      payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'mobile_money')),
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
      current_location_lat REAL,
      current_location_lng REAL,
      estimated_delivery_time DATETIME,
      actual_delivery_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users (id),
      FOREIGN KEY (rider_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS delivery_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      delivery_id INTEGER,
      old_status TEXT,
      new_status TEXT NOT NULL,
      changed_by INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (delivery_id) REFERENCES deliveries (id),
      FOREIGN KEY (changed_by) REFERENCES users (id)
    );

    -- Insert sample data if tables are empty
    INSERT OR IGNORE INTO users (id, name, email, phone, password_hash, role) VALUES
    (1, 'John Customer', 'john@example.com', '+256700000000', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjYLC7hZwOu', 'customer'),
    (2, 'Jane Rider', 'jane@example.com', '+256711111111', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjYLC7hZwOu', 'rider'),
    (3, 'Admin User', 'admin@example.com', '+256722222222', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjYLC7hZwOu', 'admin');

    INSERT OR IGNORE INTO deliveries (id, customer_id, pickup_address, delivery_address, package_description, package_weight, delivery_fee, status) VALUES
    (1, 1, 'Kampala Road, Plot 123', 'Nakawa, Plot 456', 'Documents and small package', 2.5, 15000, 'pending');
  `;

  db.exec(sql, (err) => {
    if (err) {
      console.error('Error initializing database:', err.message);
    } else {
      console.log('Database initialized successfully');
    }
  });
};

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

// API Routes (to be implemented)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/deliveries', require('./routes/deliveries'));
app.use('/api/users', require('./routes/users'));

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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
