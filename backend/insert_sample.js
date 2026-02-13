const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'deliveries.db');
const db = new sqlite3.Database(dbPath);

const insertSampleDelivery = () => {
  const sql = `
    INSERT INTO deliveries (
      customer_id, pickup_address, delivery_address,
      package_description, package_weight, delivery_fee,
      payment_method, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    1, // customer_id (John Customer)
    'Sample Pickup Address, Kampala',
    'Sample Delivery Address, Entebbe',
    'Electronics Package',
    1.5,
    25000,
    'cash',
    'pending'
  ];

  db.run(sql, params, function(err) {
    if (err) {
      console.error('Error inserting sample delivery:', err.message);
    } else {
      console.log(`Sample delivery inserted with ID: ${this.lastID}`);
    }
    db.close();
  });
};

insertSampleDelivery();
