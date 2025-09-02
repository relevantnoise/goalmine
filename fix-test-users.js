// Fix test user subscription assignments
// This script ensures our test users have the correct subscription status for testing

const SUPABASE_URL = 'https://dhlcycjnzwfnadmsptof.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ5Mjc5OTIsImV4cCI6MjA0MDUwMzk5Mn0.cOh8vTxhK8A6sCxAyTnVUWKE7VdEP6b1eRxYb-tEbuc';

async function updateSubscription(userId, planName, status) {
    console.log(`🔄 Updating ${userId} to ${planName} (${status})`);
    
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/update-subscription`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId,
                planName: planName,
                status: status
            })
        });
        
        const data = await response.json();
        if (response.ok) {
            console.log(`✅ ${userId} updated successfully:`, data);
        } else {
            console.log(`❌ ${userId} update failed:`, data);
        }
        return data;
        
    } catch (error) {
        console.error(`❌ Error updating ${userId}:`, error.message);
        return null;
    }
}

async function checkSubscription(userId) {
    console.log(`🔍 Checking ${userId} subscription status`);
    
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/check-subscription`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: userId,
                userId: userId
            })
        });
        
        const data = await response.json();
        console.log(`📊 ${userId}:`, {
            subscribed: data.subscribed,
            plan: data.subscription_tier,
            status: data.subscribed ? 'PREMIUM' : 'FREE'
        });
        
        return data;
        
    } catch (error) {
        console.error(`❌ Error checking ${userId}:`, error.message);
        return null;
    }
}

async function fixTestUsers() {
    console.log('🎯 Fixing Test User Subscription Assignments');
    console.log('==========================================');
    
    // Check current status
    console.log('\n📊 Current Status:');
    await checkSubscription('dandlynn@yahoo.com');
    await checkSubscription('danlynn@gmail.com');
    
    console.log('\n🔄 Making Updates:');
    
    // Set dandlynn@yahoo.com as FREE user (remove subscription)
    await updateSubscription('dandlynn@yahoo.com', null, 'canceled');
    
    // Set danlynn@gmail.com as PREMIUM user (add subscription)  
    await updateSubscription('danlynn@gmail.com', 'Personal Plan', 'active');
    
    // Wait a moment for updates to propagate
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n✅ Updated Status:');
    await checkSubscription('dandlynn@yahoo.com');
    await checkSubscription('danlynn@gmail.com');
    
    console.log('\n🎯 Test User Assignment Summary:');
    console.log('- dandlynn@yahoo.com: FREE user (for testing 1-goal limit)');
    console.log('- danlynn@gmail.com: PREMIUM user (for testing 3-goal limit)');
}

// Run the fix
fixTestUsers().catch(console.error);