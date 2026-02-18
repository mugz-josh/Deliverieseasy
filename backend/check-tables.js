const pool = require('./db');

async function checkTables() {
  try {
    const result = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log('Tables in database:');
    console.log(JSON.stringify(result.rows, null, 2));
    
    // Also check the structure of each table
    for (const row of result.rows) {
      const tableName = row.table_name;
      console.log(`\n--- Structure of ${tableName} ---`);
      const columns = await pool.query(
        `SELECT column_name, data_type, is_nullable 
         FROM information_schema.columns 
         WHERE table_name = $1 
         ORDER BY ordinal_position`,
        [tableName]
      );
      console.log(JSON.stringify(columns.rows, null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTables();
