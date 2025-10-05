export default async function handler(req, res) {
  // Only allow GET requests from Vercel Cron
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CRITICAL: Only allow production environment to send emails
  // Development servers should NEVER send emails to live users
  const host = req.headers.host || '';
  const isProductionDomain = host === 'goalmine.ai' || host === 'www.goalmine.ai';
  
  if (!isProductionDomain) {
    console.log(`[VERCEL-CRON] 🚫 BLOCKED - Only goalmine.ai can send emails. Current host: ${host}`);
    return res.status(200).json({ 
      success: true,
      message: `BLOCKED: Only goalmine.ai production can send emails. Current host: ${host}`,
      environment: 'development_or_staging',
      host: host,
      timestamp: new Date().toISOString(),
      blocked: true
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
    
    console.log('[VERCEL-CRON] 🚀 REAL EMAIL SYSTEM: Using deployed fixed edge function');
    
    // Call the REAL send-daily-emails function (now fixed with UTC date)
    const emailResponse = await fetch('https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/send-daily-emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        forceDelivery: true // Force delivery regardless of time window
      })
    });

    const data = await emailResponse.json();
    
    console.log('[VERCEL-CRON] Real system result:', data);
    
    return res.status(200).json({ 
      success: data.success,
      message: 'Bulletproof daily email system executed',
      timestamp: new Date().toISOString(),
      emailsSent: data.emailsSent || 0,
      errors: data.errors || 0,
      details: data.message || 'Email processing completed',
      environment: 'production'
    });
    
  } catch (error) {
    console.error('[VERCEL-CRON] Fatal error:', error);
    return res.status(500).json({ 
      error: 'Failed to trigger daily emails',
      message: error.message 
    });
  }
}