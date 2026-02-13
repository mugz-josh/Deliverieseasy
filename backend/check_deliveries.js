const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'deliveries.db');
const db = new sqlite3.Database(dbPath);

db.all(`
  SELECT d.*, u.name as customer_name
  FROM deliveries d
  LEFT JOIN users u ON d.customer_id = u.id
  ORDER BY d.created_at DESC
`, [], (err, rows) => {
  if (err) {
    console.error('Error fetching deliveries:', err.message);
  } else {
    console.log('Current deliveries in database:');
    console.log(`Total deliveries: ${rows.length}`);
    console.log(JSON.stringify(rows, null, 2));

    // Also write to file for visibility
    fs.writeFileSync('deliveries_output.json', JSON.stringify(rows, null, 2));
    console.log('Output also written to deliveries_output.json');
  }
  db.close();
});
