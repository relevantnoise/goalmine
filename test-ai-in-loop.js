// Test AI generation in the same context as the email loop
const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function testAIInLoop() {
  const knownUsers = [
    {
      email: "danlynn@gmail.com",
      goalTitle: "Officially launch the GoalMine.ai app - an ai-powered goal creation and tracking platform.",
      goalDescription: "I want to launch the goalmine.ai app this month. that means that I need to fix all of the little bugs. it's hard but I can do it.",
      tone: "drill_sergeant",
      streak: 5,
      userId: "bWnU7yuQnqSWNqfgJpBX06qlTgC3"
    }
  ];

  for (const user of knownUsers) {
    try {
      console.log(`🤖 Testing AI for: ${user.email}`);
      
      const aiResponse = await fetch(`${SUPABASE_URL}/functions/v1/generate-daily-motivation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goalId: null,
          goalTitle: user.goalTitle,
          goalDescription: user.goalDescription,
          tone: user.tone,
          streakCount: user.streak,
          userId: user.userId,
          isNudge: false,
          targetDate: "2025-11-15"
        })
      });

      console.log('📊 AI Response status:', aiResponse.status);
      
      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.log('❌ AI Error details:', errorText);
      } else {
        const aiData = await aiResponse.json();
        console.log('✅ AI Data received:', {
          hasMessage: !!aiData.message,
          hasMicroPlan: !!aiData.microPlan,
          hasChallenge: !!aiData.challenge,
          messageLength: aiData.message?.length || 0
        });
        
        if (aiData.message) {
          console.log('📝 Message preview:', aiData.message.substring(0, 100) + '...');
        }
      }
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
}

testAIInLoop();