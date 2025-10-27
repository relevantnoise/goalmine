// Test the working framework creation function using goal creation patterns
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhlcycjnzwfnadmsptof.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWorkingFramework() {
  console.log('🔥 TESTING WORKING FRAMEWORK CREATION (Using Goal Creation Patterns)...\n');

  const testData = {
    user_email: 'danlynn@gmail.com',
    timeContext: {
      work_hours_per_week: 50,
      sleep_hours_per_night: 7.5,
      commute_hours_per_week: 2,
      available_hours_per_week: 70
    },
    circleAllocations: {
      'Spiritual': {
        circle_name: 'Spiritual',
        importance_level: 8,
        current_hours_per_week: 3,
        ideal_hours_per_week: 7
      },
      'Friends & Family': {
        circle_name: 'Friends & Family',
        importance_level: 10,
        current_hours_per_week: 15,
        ideal_hours_per_week: 20
      },
      'Work': {
        circle_name: 'Work',
        importance_level: 9,
        current_hours_per_week: 50,
        ideal_hours_per_week: 45
      },
      'Personal Development': {
        circle_name: 'Personal Development',
        importance_level: 8,
        current_hours_per_week: 5,
        ideal_hours_per_week: 10
      },
      'Health & Fitness': {
        circle_name: 'Health & Fitness',
        importance_level: 7,
        current_hours_per_week: 4,
        ideal_hours_per_week: 8
      }
    },
    workHappiness: {
      impact_current: 7,
      impact_desired: 9,
      fun_current: 6,
      fun_desired: 8,
      money_current: 8,
      money_desired: 9,
      remote_current: 9,
      remote_desired: 9
    }
  };

  console.log('🎯 Using same pattern as goal creation...');

  try {
    console.log('\n🚀 Calling create-circle-framework-working...');
    
    const { data, error } = await supabase.functions.invoke('create-circle-framework-working', {
      body: testData
    });

    if (error) {
      console.log('❌ Function error:', error);
      console.log('❌ Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('🎉 SUCCESS! Function response:', data);
      
      if (data.framework_id) {
        console.log('🆔 Framework ID created:', data.framework_id);
        console.log('✅ Circle Framework saved successfully!');
        console.log('✅ Ready for dashboard integration!');
      }
    }
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testWorkingFramework();