// Direct table creation using Node.js and pg library
import { Client } from 'pg';
import fs from 'fs';

async function createTables() {
  // Supabase connection details
  const client = new Client({
    user: 'postgres.dhlcycjnzwfnadmsptof',
    host: 'aws-0-us-west-1.pooler.supabase.com',
    database: 'postgres',
    password: 'goalmine2024!',
    port: 6543,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Read the SQL file
    const sql = fs.readFileSync('/Users/zaptitude/Downloads/steady-aim-coach-main/create_six_elements_directly.sql', 'utf8');
    
    console.log('🚀 Executing table creation SQL...');
    const result = await client.query(sql);
    console.log('✅ Tables created successfully');
    
    // Test table access
    console.log('🧪 Testing table access...');
    
    const testQueries = [
      'SELECT COUNT(*) FROM public.six_elements_frameworks;',
      'SELECT COUNT(*) FROM public.element_allocations;', 
      'SELECT COUNT(*) FROM public.work_happiness_assessment;'
    ];
    
    for (const query of testQueries) {
      try {
        const testResult = await client.query(query);
        console.log(`✅ ${query} -> ${testResult.rows[0].count} rows`);
      } catch (err) {
        console.log(`❌ ${query} -> Error: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

createTables().then(() => {
  console.log('🎉 Table creation completed successfully!');
}).catch(err => {
  console.error('💥 Table creation failed:', err.message);
  process.exit(1);
});