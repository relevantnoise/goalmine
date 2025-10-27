// Execute the direct table creation function
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhlcycjnzwfnadmsptof.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeTableCreation() {
  console.log('🚀 Executing direct table creation...\n');

  try {
    const { data, error } = await supabase.functions.invoke('create-circle-tables-direct');

    if (error) {
      console.log('❌ Function error:', error);
    } else {
      console.log('✅ Function response:', data);
      
      if (data.success) {
        console.log('\n🎉 SUCCESS! Database tables created:');
        data.tables_created.forEach(table => {
          console.log(`   ✅ ${table}`);
        });
        
        if (data.goals_table_updated) {
          console.log('   ✅ goals table updated with circle columns');
        }
      }
    }
  } catch (error) {
    console.error('🚨 Table creation failed:', error);
  }
}

executeTableCreation();