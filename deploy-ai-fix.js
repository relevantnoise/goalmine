#!/usr/bin/env node

// Quick deployment script to fix the AI content generation
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting AI content generation fix deployment...');

// Read the fixed function code
const functionPath = './supabase/functions/generate-daily-motivation/index.ts';
const functionCode = fs.readFileSync(functionPath, 'utf8');

console.log('✅ Read fixed function code');
console.log('📄 Function size:', functionCode.length, 'characters');

// Check if our fix is in the code
if (functionCode.includes('created_at') && !functionCode.includes('date:')) {
  console.log('✅ Confirmed: Fix is present in the code');
  console.log('   - Uses created_at instead of date column');
  console.log('   - Removes non-existent date field');
} else {
  console.log('❌ Warning: Fix may not be complete');
}

console.log('\n🎯 Next steps:');
console.log('1. We need to deploy this function to Supabase');
console.log('2. The function will fix the database schema mismatch');
console.log('3. AI content generation will work again');

console.log('\n📝 Function summary:');
console.log('- File: generate-daily-motivation/index.ts');
console.log('- Issue: References non-existent "date" column');
console.log('- Fix: Uses "created_at" column for date filtering');
console.log('- Impact: Fixes goal detail pages + daily emails');

module.exports = { functionCode, functionPath };