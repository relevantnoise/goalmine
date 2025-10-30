// Quick script to reset Dan's data for testing
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dhlcycjnzwfnadmsptof.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxODIyODM1MSwiZXhwIjoyMDMzODA0MzUxfQ.nFlhLjU4Hzti30VebpGxJjTGx7dBqg7oYdJVqNYLfrQ'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function resetDanData() {
  try {
    console.log('🔄 Calling reset function...')
    
    const { data, error } = await supabase.functions.invoke('reset-dan-for-testing', {
      body: {}
    })

    if (error) {
      console.error('❌ Function error:', error)
      return
    }

    console.log('✅ Reset completed:', data)
  } catch (err) {
    console.error('❌ Script error:', err)
  }
}

resetDanData()