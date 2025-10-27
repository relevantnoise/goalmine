// Test the actual framework creation with proper user identification
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhlcycjnzwfnadmsptof.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFrameworkCreation() {
  console.log('🧪 Testing create-simple-circle-framework function...\n');

  // Test with your actual email (family member testing)
  const testData = {
    user_email: 'danlynn@gmail.com', // Using actual family member email
    timeContext: {
      work_hours_per_week: 50,  // Entrepreneur schedule
      sleep_hours_per_night: 7.5,
      commute_hours_per_week: 2, // Remote work
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

  console.log('📊 Test data prepared:');
  console.log('- User:', testData.user_email);
  console.log('- Work hours:', testData.timeContext.work_hours_per_week);
  console.log('- Available hours:', testData.timeContext.available_hours_per_week);
  console.log('- Circles configured:', Object.keys(testData.circleAllocations).length);

  try {
    console.log('\n🚀 Calling create-simple-circle-framework...');
    
    const { data, error } = await supabase.functions.invoke('create-simple-circle-framework', {
      body: testData
    });

    if (error) {
      console.log('❌ Function error:', error);
      console.log('❌ Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Function response:', data);
      console.log('✅ Framework created successfully!');
      
      if (data.framework_id) {
        console.log('🆔 Framework ID:', data.framework_id);
      }
    }
  } catch (error) {
    console.error('🚨 Function test failed:', error);
  }
}

testFrameworkCreation();