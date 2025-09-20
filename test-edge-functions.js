// Direct Edge Function Testing Script
// Run with: node test-edge-functions.js

const SUPABASE_URL = 'https://dhlcycjnzwfnadmsptof.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ5Mjc5OTIsImV4cCI6MjA0MDUwMzk5Mn0.cOh8vTxhK8A6sCxAyTnVUWKE7VdEP6b1eRxYb-tEbuc';

// Test users
const TEST_USERS = {
    free: 'dandlynn@yahoo.com',
    premium: 'danlynn@gmail.com'
};

async function testFunction(functionName, body, description) {
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`📡 Function: ${functionName}`);
    console.log(`📝 Body: ${JSON.stringify(body, null, 2)}`);
    
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        console.log(`✅ Response (${response.status}):`, JSON.stringify(data, null, 2));
        return { success: response.ok, data, status: response.status };
        
    } catch (error) {
        console.log(`❌ Error:`, error.message);
        return { success: false, error: error.message };
    }
}

async function runAllTests() {
    console.log('🎯 GoalMine Edge Functions Test Suite');
    console.log('=====================================');
    
    // Test 1: Check subscription status for free user
    await testFunction('check-subscription', {
        email: TEST_USERS.free,
        userId: TEST_USERS.free
    }, 'Free user subscription status');
    
    // Test 2: Check subscription status for premium user  
    await testFunction('check-subscription', {
        email: TEST_USERS.premium,
        userId: TEST_USERS.premium
    }, 'Premium user subscription status');
    
    // Test 3: Fetch goals for free user
    await testFunction('fetch-user-goals', {
        user_id: TEST_USERS.free
    }, 'Free user goals retrieval');
    
    // Test 4: Fetch goals for premium user
    await testFunction('fetch-user-goals', {
        user_id: TEST_USERS.premium
    }, 'Premium user goals retrieval');
    
    // Test 5: Test goal creation (will test limit enforcement)
    await testFunction('create-goal-direct', {
        user_id: TEST_USERS.free,
        title: 'Test Goal - Limit Check',
        description: 'Testing subscription limits',
        tone: 'kind_encouraging',
        time_of_day: '07:00',
        streak_count: 0,
        is_active: true
    }, 'Goal creation for free user (test limits)');
    
    console.log('\n🎯 Test Suite Complete');
    console.log('========================');
    console.log('Manual verification needed:');
    console.log('1. Free user should have 0-1 goals');
    console.log('2. Premium user should have 0-3 goals');
    console.log('3. Goal creation should enforce subscription limits');
    console.log('4. Check the application UI at http://localhost:5174');
}

// Run the tests
runAllTests().catch(console.error);