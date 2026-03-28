import 'dotenv/config';
import pg from 'pg';

async function test() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log("Connected to DB successfully.");
    
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log("Tables in public schema:");
    res.rows.forEach(row => console.log(` - ${row.table_name}`));
    
    await client.end();
  } catch (err) {
    console.error("DB Connection Error:", err);
    process.exit(1);
  }
}

test();
