// Test the AI generation function directly to see why it's failing
const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function testAIGeneration() {
  try {
    console.log('🤖 Testing AI generation function directly...');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-daily-motivation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        goalId: null,
        goalTitle: "Officially launch the GoalMine.ai app - an ai-powered goal creation and tracking platform.",
        goalDescription: "I want to launch the goalmine.ai app this month. that means that I need to fix all of the little bugs. it's hard but I can do it.",
        tone: "drill_sergeant",
        streakCount: 5,
        userId: "bWnU7yuQnqSWNqfgJpBX06qlTgC3",
        isNudge: false,
        targetDate: "2025-11-15"
      })
    });

    console.log('📊 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('📊 Response text:', responseText);

    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ AI Generation Results:');
        console.log('📝 Message:', data.message);
        console.log('📋 Micro Plan:', data.microPlan);
        console.log('💪 Challenge:', data.challenge);
        
        if (data.message && data.microPlan && data.challenge) {
          console.log('🎉 SUCCESS! Real AI content generated!');
          return data;
        } else {
          console.log('❌ AI content incomplete');
        }
      } catch (parseError) {
        console.error('❌ Parse error:', parseError.message);
        console.log('Raw response was:', responseText);
      }
    } else {
      console.log('❌ AI generation failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAIGeneration();