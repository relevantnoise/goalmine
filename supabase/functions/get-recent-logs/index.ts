import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // This is a simple function to test if we can get some basic info
  const now = new Date()
  
  return new Response(
    JSON.stringify({
      success: true,
      message: 'If you can see this, the function system is working',
      timestamp: now.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    },
  )
})