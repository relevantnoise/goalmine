// Test the debug function from browser console
// Run this in browser dev tools console

fetch('https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/debug-fetch-framework', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg1MTU2ODMsImV4cCI6MjA0NDA5MTY4M30.WPY5rrE4d4xoJ5XxVt5TjOLxJkmvGXS4q0VLfJ4Q8yE'}`
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);