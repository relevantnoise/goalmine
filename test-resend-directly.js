const https = require('https');

// Replace with your actual Resend API key
const RESEND_API_KEY = 'YOUR_RESEND_API_KEY_HERE'; // You'll need to add this

const data = JSON.stringify({
  from: 'onboarding@resend.dev', // Using Resend's default domain
  to: ['dandlynn@yahoo.com'],
  subject: 'Test Email from GoalMine.ai',
  html: '<h1>Test Email</h1><p>If you receive this, Resend is working!</p>'
});

const options = {
  hostname: 'api.resend.com',
  port: 443,
  path: '/emails',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${RESEND_API_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', responseData);
    
    if (res.statusCode === 200) {
      console.log('✅ Email sent successfully!');
    } else {
      console.log('❌ Email failed to send');
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();