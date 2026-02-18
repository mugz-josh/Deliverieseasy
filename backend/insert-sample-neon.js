const pool = require('./db');

async function insertSampleData() {
  try {
    console.log('🔄 Inserting sample data into Neon database...\n');

    // Insert sample users
    const usersResult = await pool.query(`
      INSERT INTO users (name, email, phone, password_hash, role)
      VALUES 
        ('John Customer', 'john@example.com', '+256701234567', 'hashed_password_1', 'customer'),
        ('Jane Rider', 'jane@example.com', '+256701234568', 'hashed_password_2', 'rider'),
        ('Admin User', 'admin@example.com', '+256701234569', 'hashed_password_3', 'admin')
      RETURNING id, name, email, role
    `);
    
    console.log('✅ Sample users inserted:');
    usersResult.rows.forEach(user => {
      console.log(`   - ${user.name} (${user.role}) - ID: ${user.id}`);
    });

    // Insert sample deliveries
    const deliveriesResult = await pool.query(`
      INSERT INTO deliveries (
        customer_id, rider_id, pickup_address, delivery_address,
        package_description, package_weight, delivery_fee,
        payment_method, status
      )
      VALUES 
        (1, 2, 'Kampala Road, Kampala', 'Entebbe Road, Entebbe', 'Electronics Package', 2.5, 25000, 'cash', 'pending'),
        (1, 2, 'Ntinda Road, Kampala', 'Mbarara Town, Mbarara', 'Clothing Items', 1.0, 45000, 'mobile_money', 'assigned'),
        (1, NULL, 'Jinja Road, Jinja', 'Soroti Town, Soroti', 'Food Package', 3.0, 35000, 'cash', 'pending')
      RETURNING id, pickup_address, delivery_address, status
    `);

    console.log('\n✅ Sample deliveries inserted:');
    deliveriesResult.rows.forEach(delivery => {
      console.log(`   - Delivery #${delivery.id}: ${delivery.pickup_address} → ${delivery.delivery_address} (${delivery.status})`);
    });

    console.log('\n🎉 Sample data inserted successfully!');
    console.log('📊 Database is working correctly!');

    // Verify data was inserted
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    const deliveryCount = await pool.query('SELECT COUNT(*) as count FROM deliveries');
    
    console.log(`\n📈 Total users in database: ${userCount.rows[0].count}`);
    console.log(`📈 Total deliveries in database: ${deliveryCount.rows[0].count}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error inserting sample data:', error.message);
    process.exit(1);
  }
}

insertSampleData();
