// Test both goalmine.ai and www.goalmine.ai to see which works
async function testBothUrls() {
  console.log('🔍 Testing both URLs to see environment detection...');

  // Test 1: Without www
  try {
    console.log('\n📡 Testing: https://goalmine.ai/api/trigger-daily-emails');
    const response1 = await fetch('https://goalmine.ai/api/trigger-daily-emails', {
      method: 'GET',
      headers: {
        'User-Agent': 'cronjob.org-test'
      }
    });

    console.log('📊 Status:', response1.status);
    const data1 = await response1.json();
    console.log('📊 Response:', data1);
  } catch (error) {
    console.error('❌ Error with goalmine.ai:', error.message);
  }

  // Test 2: With www
  try {
    console.log('\n📡 Testing: https://www.goalmine.ai/api/trigger-daily-emails');
    const response2 = await fetch('https://www.goalmine.ai/api/trigger-daily-emails', {
      method: 'GET',
      headers: {
        'User-Agent': 'cronjob.org-test'
      }
    });

    console.log('📊 Status:', response2.status);
    const data2 = await response2.json();
    console.log('📊 Response:', data2);
  } catch (error) {
    console.error('❌ Error with www.goalmine.ai:', error.message);
  }
}

testBothUrls();