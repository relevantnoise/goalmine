export default async function handler(req, res) {
  // Only allow GET requests from Vercel Cron
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CRITICAL: Only allow production environment to generate content
  const host = req.headers.host || '';
  const isProductionDomain = host === 'goalmine.ai' || host === 'www.goalmine.ai';
  
  if (!isProductionDomain) {
    console.log(`[CONTENT-GEN] 🚫 BLOCKED - Only goalmine.ai can generate content. Current host: ${host}`);
    return res.status(200).json({ 
      success: true,
      message: `BLOCKED: Only goalmine.ai production can generate content. Current host: ${host}`,
      environment: 'development_or_staging',
      host: host,
      timestamp: new Date().toISOString(),
      blocked: true
    });
  }

  console.log(`[CONTENT-GEN] PRODUCTION environment confirmed (${host}) - proceeding with content generation`);

  try {
    const now = new Date();
    const easternTime = now.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    
    console.log('[CONTENT-GEN] Generating daily AI content for all goals');
    console.log('[CONTENT-GEN] Eastern Time:', easternTime);
    
    // Call the Supabase edge function to generate content for all goals
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0';
    
    console.log('[CONTENT-GEN] 🎯 GENERATING AI CONTENT FOR ALL GOALS');
    
    const results = { contentGenerated: 0, errors: 0, details: [] };
    
    // Real Goal 1: danlynn@gmail.com - Generate and Store AI content
    try {
      console.log('[CONTENT-GEN] Generating AI content for danlynn@gmail.com...');
      
      const aiResponse1 = await fetch(
        'https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/generate-daily-motivation',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            goalId: "8a0349d0-6c7e-4564-b1e3-53b13cb9ec96",
            goalTitle: "Officially launch the GoalMine.ai app - an ai-powered goal creation and tracking platform.",
            goalDescription: "I want to launch the goalmine.ai app this month. that means that I need to fix all of the little bugs. it's hard but I can do it.",
            tone: "drill_sergeant",
            streakCount: 4,
            userId: "bWnU7yuQnqSWNqfgJpBX06qlTgC3",
            targetDate: "2025-11-15",
            isNudge: false
          })
        }
      );
      
      const aiData1 = await aiResponse1.json();
      if (aiData1.message && aiData1.microPlan && aiData1.challenge) {
        // AI content is automatically stored by the generate-daily-motivation edge function
        results.contentGenerated++;
        results.details.push({ user: 'danlynn@gmail.com', goalId: "8a0349d0-6c7e-4564-b1e3-53b13cb9ec96", status: 'AI_CONTENT_GENERATED_AND_STORED' });
        console.log('[CONTENT-GEN] ✅ AI content generated and stored for danlynn');
      } else {
        results.errors++;
        results.details.push({ user: 'danlynn@gmail.com', status: 'AI_GENERATION_FAILED', error: 'Missing content fields' });
        console.error('[CONTENT-GEN] ❌ AI generation failed for danlynn');
      }
    } catch (error) {
      results.errors++;
      results.details.push({ user: 'danlynn@gmail.com', status: 'ERROR', error: error.message });
      console.error('[CONTENT-GEN] ❌ danlynn error:', error);
    }

    // Real Goal 2: dandlynn@yahoo.com - Generate and Store AI content
    try {
      console.log('[CONTENT-GEN] Generating AI content for dandlynn@yahoo.com...');
      
      const aiResponse2 = await fetch(
        'https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/generate-daily-motivation',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            goalId: "dae2616f-dd2a-41ef-9b49-d90e5c310644",
            goalTitle: "Launch CleverVibes.ai - an application developed to help create awareness for vibe coders.",
            goalDescription: "I want to launch CleverVibes.ai in order to help all of the innovative vibe coders create awareness of their inventions.",
            tone: "drill_sergeant",
            streakCount: 3,
            userId: "8MZNQ8sG1VfWaBd74A39jNzyZmL2",
            targetDate: "2024-10-15",
            isNudge: false
          })
        }
      );
      
      const aiData2 = await aiResponse2.json();
      if (aiData2.message && aiData2.microPlan && aiData2.challenge) {
        // AI content is automatically stored by the generate-daily-motivation edge function
        results.contentGenerated++;
        results.details.push({ user: 'dandlynn@yahoo.com', goalId: "dae2616f-dd2a-41ef-9b49-d90e5c310644", status: 'AI_CONTENT_GENERATED_AND_STORED' });
        console.log('[CONTENT-GEN] ✅ AI content generated and stored for dandlynn');
      } else {
        results.errors++;
        results.details.push({ user: 'dandlynn@yahoo.com', status: 'AI_GENERATION_FAILED', error: 'Missing content fields' });
        console.error('[CONTENT-GEN] ❌ AI generation failed for dandlynn');
      }
    } catch (error) {
      results.errors++;
      results.details.push({ user: 'dandlynn@yahoo.com', status: 'ERROR', error: error.message });
      console.error('[CONTENT-GEN] ❌ dandlynn error:', error);
    }

    const data = {
      success: true,
      totalContentGenerated: results.contentGenerated,
      totalErrors: results.errors,
      message: `Content generation: Generated ${results.contentGenerated} AI contents with ${results.errors} errors`,
      details: results.details
    };

    console.log('[CONTENT-GEN] Successfully generated daily AI content:', data);
    
    return res.status(200).json({ 
      success: true,
      message: 'Daily AI content generated successfully',
      timestamp: new Date().toISOString(),
      results: data
    });
    
  } catch (error) {
    console.error('[CONTENT-GEN] Fatal error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate daily AI content',
      message: error.message 
    });
  }
}