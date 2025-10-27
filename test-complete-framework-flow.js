// Test the complete framework creation and fetching flow
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhlcycjnzwfnadmsptof.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompleteFrameworkFlow() {
  console.log('🎯 TESTING COMPLETE 5 CIRCLE FRAMEWORK FLOW...\n');

  const testUser = 'danlynn@gmail.com';

  const testData = {
    user_email: testUser,
    timeContext: {
      work_hours_per_week: 45,
      sleep_hours_per_night: 7.5,
      commute_hours_per_week: 3,
      available_hours_per_week: 75
    },
    circleAllocations: {
      'Spiritual': {
        circle_name: 'Spiritual',
        importance_level: 9,
        current_hours_per_week: 4,
        ideal_hours_per_week: 8
      },
      'Friends & Family': {
        circle_name: 'Friends & Family',
        importance_level: 10,
        current_hours_per_week: 18,
        ideal_hours_per_week: 22
      },
      'Work': {
        circle_name: 'Work',
        importance_level: 8,
        current_hours_per_week: 45,
        ideal_hours_per_week: 40
      },
      'Personal Development': {
        circle_name: 'Personal Development',
        importance_level: 7,
        current_hours_per_week: 3,
        ideal_hours_per_week: 8
      },
      'Health & Fitness': {
        circle_name: 'Health & Fitness',
        importance_level: 8,
        current_hours_per_week: 5,
        ideal_hours_per_week: 10
      }
    },
    workHappiness: {
      impact_current: 6,
      impact_desired: 9,
      fun_current: 7,
      fun_desired: 9,
      money_current: 7,
      money_desired: 8,
      remote_current: 9,
      remote_desired: 10
    }
  };

  try {
    // STEP 1: Create the framework
    console.log('🔥 STEP 1: Creating Circle Framework...');
    const { data: createData, error: createError } = await supabase.functions.invoke('create-circle-framework-goals', {
      body: testData
    });

    if (createError) {
      console.log('❌ Framework creation failed:', createError);
      return;
    }

    if (!createData?.success) {
      console.log('❌ Framework creation unsuccessful:', createData);
      return;
    }

    console.log('✅ Framework created successfully!');
    console.log('   Framework ID:', createData.framework_id);

    // STEP 2: Fetch the framework back
    console.log('\n🔍 STEP 2: Fetching Circle Framework...');
    const { data: fetchData, error: fetchError } = await supabase.functions.invoke('fetch-circle-framework', {
      body: { user_id: testUser }
    });

    if (fetchError) {
      console.log('❌ Framework fetch failed:', fetchError);
      return;
    }

    if (!fetchData?.success) {
      console.log('❌ Framework fetch unsuccessful:', fetchData);
      return;
    }

    console.log('✅ Framework fetched successfully!');
    console.log('   Has Framework:', fetchData.hasFramework);
    console.log('   Framework ID:', fetchData.framework?.id);
    console.log('   Circle Count:', fetchData.allocations?.length);
    console.log('   Work Happiness:', !!fetchData.workHappiness);

    // STEP 3: Verify data integrity
    console.log('\n🔍 STEP 3: Verifying Data Integrity...');
    
    const framework = fetchData.framework;
    const allocations = fetchData.allocations;
    const workHappiness = fetchData.workHappiness;

    // Check framework data
    if (framework.work_hours_per_week === testData.timeContext.work_hours_per_week) {
      console.log('✅ Time context preserved correctly');
    } else {
      console.log('❌ Time context mismatch');
      return;
    }

    // Check circle allocations
    if (allocations.length === 5) {
      console.log('✅ All 5 circles saved correctly');
      
      const spiritualCircle = allocations.find(a => a.circle_name === 'Spiritual');
      if (spiritualCircle && spiritualCircle.importance_level === 9) {
        console.log('✅ Circle data preserved correctly');
      } else {
        console.log('❌ Circle data mismatch');
        return;
      }
    } else {
      console.log('❌ Missing circle allocations');
      return;
    }

    // Check work happiness
    if (workHappiness && workHappiness.impact_desired === 9) {
      console.log('✅ Work happiness data preserved correctly');
    } else {
      console.log('❌ Work happiness data mismatch');
      return;
    }

    console.log('\n🎉 SUCCESS! Complete Framework Flow Working!');
    console.log('✅ Framework Creation: WORKING');
    console.log('✅ Framework Fetching: WORKING');
    console.log('✅ Data Integrity: PRESERVED');
    console.log('✅ Ready for Dashboard Integration!');

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testCompleteFrameworkFlow();