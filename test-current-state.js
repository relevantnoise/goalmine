// Quick test to see current database state
const response = await fetch('https://dhlcycjnzwfnadmsptof.supabase.co/rest/v1/goals?select=*', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE5MDM3NSwiZXhwIjoyMDcwNzY2Mzc1fQ.EuSRCPhMX35ZQCtAP5Rn1xMlvtKd45K9YOgU7c_zZHg',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE5MDM3NSwiZXhwIjoyMDcwNzY2Mzc1fQ.EuSRCPhMX35ZQCtAP5Rn1xMlvtKd45K9YOgU7c_zZHg'
  }
});

const goals = await response.json();
console.log('Current goals:', JSON.stringify(goals, null, 2));