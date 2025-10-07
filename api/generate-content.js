export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CRITICAL: Only allow production environment
  const host = req.headers.host || '';
  const isProductionDomain = host === 'goalmine.ai' || host === 'www.goalmine.ai';
  
  if (!isProductionDomain) {
    console.log(`[PRE-GENERATE] 🚫 BLOCKED - Only goalmine.ai can generate content. Current host: ${host}`);
    return res.status(200).json({ 
      success: true,
      message: `BLOCKED: Only goalmine.ai production can generate content. Current host: ${host}`,
      blocked: true
    });
  }

  try {
    console.log('[PRE-GENERATE] Starting AI content pre-generation');
    
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0';
    
    // Call the pre-generate function
    const response = await fetch('https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/pre-generate-content', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    const data = await response.json();
    
    console.log('[PRE-GENERATE] Content generation result:', data);
    
    return res.status(200).json({ 
      success: data.success,
      message: 'AI content pre-generation completed',
      timestamp: new Date().toISOString(),
      contentGenerated: data.contentGenerated || 0,
      errors: data.errors || 0,
      environment: 'production'
    });
    
  } catch (error) {
    console.error('[PRE-GENERATE] Fatal error:', error);
    return res.status(500).json({ 
      error: 'Failed to pre-generate content',
      message: error.message 
    });
  }
}