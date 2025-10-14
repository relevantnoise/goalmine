export default async function handler(req, res) {
  // Only allow GET requests from Vercel Cron
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // SECURITY: Verify CRON_SECRET from Vercel (recommended best practice)
  const authHeader = req.headers.authorization;
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    console.log('[VERCEL-CRON] ❌ UNAUTHORIZED: Invalid or missing CRON_SECRET');
    console.log('[VERCEL-CRON] Expected:', expectedAuth);
    console.log('[VERCEL-CRON] Received:', authHeader);
    return res.status(401).json({ error: 'Unauthorized - Invalid CRON_SECRET' });
  }

  // CRITICAL: Only allow production environment to send emails
  // Development servers should NEVER send emails to live users
  const host = req.headers.host || '';
  const userAgent = req.headers['user-agent'] || '';
  const isProductionDomain = host === 'goalmine.ai' || host === 'www.goalmine.ai' || host.includes('goalmine-mlnv01h4u-dans-projects') || userAgent.includes('vercel-cron');
  
  // DEBUG: Log all request details for troubleshooting
  console.log(`[VERCEL-CRON] REQUEST DEBUG:`);
  console.log(`[VERCEL-CRON] Host header: "${host}"`);
  console.log(`[VERCEL-CRON] User-Agent: "${req.headers['user-agent'] || 'none'}"`);
  console.log(`[VERCEL-CRON] Method: ${req.method}`);
  console.log(`[VERCEL-CRON] URL: ${req.url}`);
  console.log(`[VERCEL-CRON] Is production domain: ${isProductionDomain}`);
  
  if (!isProductionDomain) {
    console.log(`[VERCEL-CRON] 🚫 BLOCKED - Only goalmine.ai can send emails. Current host: ${host}`);
    return res.status(200).json({ 
      success: true,
      message: `BLOCKED: Only goalmine.ai production can send emails. Current host: ${host}`,
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

  console.log(`[VERCEL-CRON] PRODUCTION environment confirmed (${host}) - proceeding with email send`);

  try {
    const now = new Date();
    const utcTime = now.toISOString();
    const utcHour = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    
    console.log('[VERCEL-CRON] Triggering daily email send - PURE UTC');
    console.log('[VERCEL-CRON] UTC Time:', utcTime);
    console.log('[VERCEL-CRON] UTC Hour:Minutes:', `${utcHour}:${utcMinutes}`);
    
    // REAL SYSTEM: Now that the edge function is fixed and deployed
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0';
    
    console.log('[VERCEL-CRON] 🚀 NEW CONSOLIDATED EMAIL SYSTEM using daily-cron');
    
    // Call the new daily-cron function (with safety switch for consolidated emails)
    const emailResponse = await fetch('https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/daily-cron', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    const data = await emailResponse.json();
    
    console.log('[VERCEL-CRON] Email response status:', emailResponse.status);
    console.log('[VERCEL-CRON] Email response headers:', Object.fromEntries(emailResponse.headers.entries()));
    console.log('[VERCEL-CRON] Real system result:', data);
    
    return res.status(200).json({ 
      success: data.success,
      stage: 'consolidated-email-system',
      message: 'New consolidated email system executed',
      timestamp: new Date().toISOString(),
      totalEmailsSent: data.totalEmailsSent || 0,
      totalErrors: data.totalErrors || 0,
      details: data.message || 'Consolidated email delivery completed',
      environment: 'production',
      systemUsed: data.details?.dailyEmails?.message || 'consolidated-emails'
    });
    
  } catch (error) {
    console.error('[VERCEL-CRON] Fatal error:', error);
    return res.status(500).json({ 
      error: 'Failed to trigger daily emails',
      message: error.message 
    });
  }
}