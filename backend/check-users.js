const pool = require('./db');

async function checkUsers() {
  try {
    const result = await pool.query('SELECT id, name, email, role FROM users');
    console.log(JSON.stringify(result.rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUsers();
