const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'root'
};

async function recreateDatabase() {
  try {
    console.log('📖 Reading schema.sql...');
    const schemaFile = path.join(__dirname, 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaFile, 'utf8');

    console.log('🔄 Connecting to MySQL server...');
    const conn = await mysql.createConnection(DB_CONFIG);

    console.log('💥 Dropping existing database...');
    await conn.query('DROP DATABASE IF EXISTS hospital_management_system');

    console.log('📝 Creating new database and tables...');
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(s => s.trim().length > 0);
    
    for (const statement of statements) {
      try {
        await conn.query(statement);
      } catch (err) {
        if (!err.message.includes('already exists')) {
          console.error('Error executing:', err.message);
        }
      }
    }

    console.log('✅ Database schema created successfully!');
    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

recreateDatabase();
