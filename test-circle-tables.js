// Test script to verify 5 Circle Framework database tables exist
// and check the hybrid user identification issue

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhlcycjnzwfnadmsptof.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0'; // Anon key

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCircleTables() {
  console.log('🔍 Testing 5 Circle Framework Database Tables...\n');

  try {
    // Test 1: Check if user_circle_frameworks table exists
    console.log('1️⃣ Testing user_circle_frameworks table...');
    const { data: frameworks, error: frameworkError } = await supabase
      .from('user_circle_frameworks')
      .select('*')
      .limit(1);
    
    if (frameworkError) {
      console.log('❌ user_circle_frameworks table error:', frameworkError.message);
    } else {
      console.log('✅ user_circle_frameworks table exists');
      console.log('📊 Sample data:', frameworks);
    }

    // Test 2: Check if circle_time_allocations table exists
    console.log('\n2️⃣ Testing circle_time_allocations table...');
    const { data: allocations, error: allocationError } = await supabase
      .from('circle_time_allocations')
      .select('*')
      .limit(1);
    
    if (allocationError) {
      console.log('❌ circle_time_allocations table error:', allocationError.message);
    } else {
      console.log('✅ circle_time_allocations table exists');
      console.log('📊 Sample data:', allocations);
    }

    // Test 3: Check if work_happiness_metrics table exists
    console.log('\n3️⃣ Testing work_happiness_metrics table...');
    const { data: happiness, error: happinessError } = await supabase
      .from('work_happiness_metrics')
      .select('*')
      .limit(1);
    
    if (happinessError) {
      console.log('❌ work_happiness_metrics table error:', happinessError.message);
    } else {
      console.log('✅ work_happiness_metrics table exists');
      console.log('📊 Sample data:', happiness);
    }

    // Test 4: Check current user profile structure (hybrid ID analysis)
    console.log('\n4️⃣ Testing hybrid user identification structure...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(3);
    
    if (profileError) {
      console.log('❌ profiles table error:', profileError.message);
    } else {
      console.log('✅ profiles table structure:');
      profiles.forEach(profile => {
        console.log(`   User ID: ${profile.id} | Email: ${profile.email}`);
        console.log(`   ID Format: ${profile.id.includes('@') ? 'EMAIL-BASED' : 'FIREBASE UID'}`);
      });
    }

    // Test 5: Check goals table circle_type column
    console.log('\n5️⃣ Testing goals table circle integration...');
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id, user_id, title, circle_type, weekly_commitment_hours')
      .limit(3);
    
    if (goalsError) {
      console.log('❌ goals table error:', goalsError.message);
    } else {
      console.log('✅ goals table with circle integration:');
      goals.forEach(goal => {
        console.log(`   Goal: ${goal.title} | User: ${goal.user_id} | Circle: ${goal.circle_type || 'None'}`);
      });
    }

  } catch (error) {
    console.error('🚨 Test failed:', error);
  }
}

// Test the create-simple-circle-framework function with sample data
async function testCreateFrameworkFunction() {
  console.log('\n🧪 Testing create-simple-circle-framework function...\n');

  const testData = {
    user_email: 'test@example.com',
    timeContext: {
      work_hours_per_week: 40,
      sleep_hours_per_night: 8,
      commute_hours_per_week: 5,
      available_hours_per_week: 75
    },
    circleAllocations: {
      'Spiritual': {
        circle_name: 'Spiritual',
        importance_level: 7,
        current_hours_per_week: 2,
        ideal_hours_per_week: 5
      },
      'Work': {
        circle_name: 'Work',
        importance_level: 9,
        current_hours_per_week: 40,
        ideal_hours_per_week: 40
      }
    },
    workHappiness: {
      impact_current: 6,
      impact_desired: 9,
      fun_current: 5,
      fun_desired: 8,
      money_current: 7,
      money_desired: 9,
      remote_current: 8,
      remote_desired: 9
    }
  };

  try {
    const { data, error } = await supabase.functions.invoke('create-simple-circle-framework', {
      body: testData
    });

    if (error) {
      console.log('❌ Function error:', error);
    } else {
      console.log('✅ Function response:', data);
    }
  } catch (error) {
    console.error('🚨 Function test failed:', error);
  }
}

// Run all tests
async function runAllTests() {
  await testCircleTables();
  await testCreateFrameworkFunction();
}

runAllTests();