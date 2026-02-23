const dotenv = require('dotenv');
dotenv.config();

console.log('Testing server startup...');
console.log('DATABASE_URL is', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

try {
  const app = require('./server.js');
  console.log('✅ Server file loaded successfully!');
  console.log('Server should be running on port', process.env.PORT || 5000);
} catch (err) {
  console.error('❌ Error loading server:', err.message);
  console.error(err.stack);
}
