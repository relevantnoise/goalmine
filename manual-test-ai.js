// Quick test to manually generate AI insights for Dan
const testData = {
  userEmail: 'danlynn@gmail.com',
  frameworkId: 'danlynn@gmail.com'
};

fetch('https://dhlcycjnzwfnadmsptof.functions.supabase.co/generate-ai-insights', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI4OTAwNjMsImV4cCI6MjAzODQ2NjA2M30.KcudOjGU7oFQCR7Yy9Lz5SRzQtV2d6Kir0mlr5Nq8yk'
  },
  body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => console.log('AI Generation Result:', data))
.catch(err => console.error('Error:', err));