export default async function handler(req, res) {
  // Only allow GET requests from Vercel Cron
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // SECURITY: Verify CRON_SECRET from Vercel (recommended best practice)
  const authHeader = req.headers.authorization;
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    console.log('[CONTENT-GENERATION-CRON] ❌ UNAUTHORIZED: Invalid or missing CRON_SECRET');
    console.log('[CONTENT-GENERATION-CRON] Expected:', expectedAuth);
    console.log('[CONTENT-GENERATION-CRON] Received:', authHeader);
    return res.status(401).json({ error: 'Unauthorized - Invalid CRON_SECRET' });
  }

  // CRITICAL: Only allow production environment to generate content
  // Development servers should NEVER affect live user data
  const host = req.headers.host || '';
  const userAgent = req.headers['user-agent'] || '';
  const isProductionDomain = host === 'goalmine.ai' || host === 'www.goalmine.ai' || host.includes('goalmine-mlnv01h4u-dans-projects') || userAgent.includes('vercel-cron');
  
  // DEBUG: Log all request details for troubleshooting
  console.log(`[CONTENT-GENERATION-CRON] REQUEST DEBUG:`);
  console.log(`[CONTENT-GENERATION-CRON] Host header: "${host}"`);
  console.log(`[CONTENT-GENERATION-CRON] User-Agent: "${req.headers['user-agent'] || 'none'}"`);
  console.log(`[CONTENT-GENERATION-CRON] Method: ${req.method}`);
  console.log(`[CONTENT-GENERATION-CRON] URL: ${req.url}`);
  console.log(`[CONTENT-GENERATION-CRON] Is production domain: ${isProductionDomain}`);
  
  if (!isProductionDomain) {
    console.log(`[CONTENT-GENERATION-CRON] 🚫 BLOCKED - Only goalmine.ai can generate content. Current host: ${host}`);
    return res.status(200).json({ 
      success: true,
      message: `BLOCKED: Only goalmine.ai production can generate content. Current host: ${host}`,
      environment: 'development_or_staging',
      host: host,
      timestamp: new Date().toISOString(),
      blocked: true,
      debug: {
        userAgent: req.headers['user-agent'],
        method: req.method,
        url: req.url
      }
    });
  }

  console.log(`[CONTENT-GENERATION-CRON] PRODUCTION environment confirmed (${host}) - proceeding with content generation`);

  try {
    const now = new Date();
    const utcTime = now.toISOString();
    const utcHour = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    
    console.log('[CONTENT-GENERATION-CRON] 🚀 STAGE 1: Triggering content pre-generation');
    console.log('[CONTENT-GENERATION-CRON] UTC Time:', utcTime);
    console.log('[CONTENT-GENERATION-CRON] UTC Hour:Minutes:', `${utcHour}:${utcMinutes}`);
    
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0';
    
    console.log('[CONTENT-GENERATION-CRON] 🤖 BULLETPROOF CONTENT SYSTEM: Generating AI content for all active goals');
    
    // Call the content pre-generation function
    const contentResponse = await fetch('https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/generate-daily-content', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    const contentData = await contentResponse.json();
    
    console.log('[CONTENT-GENERATION-CRON] Content generation response status:', contentResponse.status);
    console.log('[CONTENT-GENERATION-CRON] Content generation result:', contentData);
    
    return res.status(200).json({ 
      success: contentData.success,
      stage: 'content-generation',
      message: 'AI content pre-generation completed',
      timestamp: new Date().toISOString(),
      contentGenerated: contentData.contentGenerated || 0,
      errors: contentData.errors || 0,
      skipped: contentData.skipped || 0,
      totalGoals: contentData.totalGoals || 0,
      details: contentData.message || 'Content generation completed',
      environment: 'production'
    });
    
  } catch (error) {
    console.error('[CONTENT-GENERATION-CRON] Fatal error:', error);
    return res.status(500).json({ 
      error: 'Failed to trigger content generation',
      message: error.message 
    });
  }
}