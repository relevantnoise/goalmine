// Quick test to check what's in the database
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dhlcycjnzwfnadmsptof.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQyNjk1NjUsImV4cCI6MjAzOTg0NTU2NX0.gC9xbz9_lzUGKqNJNEpT_Y2wqA-O7kSHllJPqK6GnKM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkGoals() {
  console.log('Checking for goals in database...')
  
  try {
    // Get all goals (limited sample)
    const { data: allGoals, error } = await supabase
      .from('goals')
      .select('user_id, id, title, is_active, created_at')
      .limit(10)
    
    if (error) {
      console.error('Error fetching goals:', error)
      return
    }
    
    console.log('Goals found in database:')
    if (allGoals && allGoals.length > 0) {
      allGoals.forEach(goal => {
        console.log(`- ID: ${goal.id}`)
        console.log(`  Title: ${goal.title}`)
        console.log(`  User ID: ${goal.user_id}`)
        console.log(`  Active: ${goal.is_active}`)
        console.log(`  Created: ${goal.created_at}`)
        console.log('---')
      })
    } else {
      console.log('No goals found in database')
    }
    
  } catch (err) {
    console.error('Error:', err)
  }
}

checkGoals()