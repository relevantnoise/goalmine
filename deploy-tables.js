// Deploy 5 Circle Framework tables using service role key
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://dhlcycjnzwfnadmsptof.supabase.co';
const supabaseServiceKey = 'sbp_397a106a136068d33edf70eaf6e579cf9eb37d31'; // Service role key

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployTables() {
  console.log('🚀 Deploying 5 Circle Framework database tables...\n');

  try {
    // Read the SQL file
    const sql = fs.readFileSync('deploy-circle-tables.sql', 'utf8');
    
    console.log('📝 Executing SQL schema deployment...');
    
    // Execute the SQL directly using the RPC function
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sql 
    });

    if (error) {
      console.log('❌ SQL execution error:', error);
      console.log('🔧 Trying alternative approach...');
      
      // Try using the edge function approach
      const { data: functionData, error: functionError } = await supabase.functions.invoke('setup-circle-database');
      
      if (functionError) {
        console.log('❌ Function approach failed:', functionError);
      } else {
        console.log('✅ Tables deployed via edge function:', functionData);
      }
    } else {
      console.log('✅ SQL executed successfully:', data);
    }

  } catch (error) {
    console.error('🚨 Deployment failed:', error);
  }
}

deployTables();