const pool = require('./db');

async function verifyData() {
  try {
    console.log('🔍 Verifying sample data in Neon database...\n');

    // Check users
    const users = await pool.query('SELECT * FROM users ORDER BY id');
    console.log('📋 Users table:');
    users.rows.forEach(user => {
      console.log(`   ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
    });

    // Check deliveries
    const deliveries = await pool.query('SELECT * FROM deliveries ORDER BY id');
    console.log('\n📦 Deliveries table:');
    deliveries.rows.forEach(delivery => {
      console.log(`   ID: ${delivery.id}, From: ${delivery.pickup_address}, To: ${delivery.delivery_address}, Status: ${delivery.status}`);
    });

    console.log('\n✅ Data verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying data:', error.message);
    process.exit(1);
  }
}

verifyData();
