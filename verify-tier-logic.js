// Verify the tier logic in create-checkout
const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function verifyTierLogic() {
  console.log('🔍 Verifying that the tier parameter is being ignored...\n');

  // Test with different tier values to see if ANY of them work
  const testCases = [
    { tier: undefined, name: 'undefined (Personal Plan expected)' },
    { tier: null, name: 'null' },
    { tier: '', name: 'empty string' },
    { tier: 'strategic_advisory', name: 'strategic_advisory (Strategic Advisor expected)' },
    { tier: 'strategic_advisor', name: 'strategic_advisor (alternate spelling)' },
    { tier: 'professional', name: 'professional' },
    { tier: 'Strategic Advisor Plan', name: 'Strategic Advisor Plan (full name)' },
  ];

  for (const testCase of testCases) {
    try {
      console.log(`Testing tier: ${testCase.name}`);
      
      const body = {
        email: 'dandlynn@yahoo.com',
        userId: '8MZNQ8sG1VfWaBd74A39jNzyZmL2'
      };
      
      if (testCase.tier !== undefined) {
        body.tier = testCase.tier;
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Origin': 'https://www.goalmine.ai'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        const sessionId = data.url.match(/cs_live_[a-zA-Z0-9]+/)?.[0] || 'unknown';
        console.log(`  Session ID: ${sessionId}`);
        console.log(`  URL: ${data.url.substring(0, 80)}...`);
      } else {
        console.log(`  ERROR: ${response.status}`);
      }
      
      console.log(''); // blank line
    } catch (error) {
      console.error(`  ERROR: ${error.message}\n`);
    }
  }
}

verifyTierLogic();