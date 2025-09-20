// Manual cleanup script for dandlynn@yahoo.com
// Run this in browser console on the app page after logging in as admin

const cleanupUser = async () => {
  const userIds = [
    '5R1UvfoYxnSTICHttpvxTTvMSk13', // dandlynn@yahoo.com Firebase UID
    'dandlynn@yahoo.com'
  ];

  console.log('🗑️ Starting manual cleanup for dandlynn@yahoo.com...');

  for (const userId of userIds) {
    console.log(`Cleaning up: ${userId}`);
    
    // Delete motivation history
    const motivationDelete = await supabase
      .from('motivation_history')
      .delete()
      .eq('user_id', userId);
    console.log('Motivation history:', motivationDelete);
    
    // Delete goals  
    const goalsDelete = await supabase
      .from('goals')
      .delete()
      .eq('user_id', userId);
    console.log('Goals:', goalsDelete);
    
    // Delete subscribers
    const subscribersDelete = await supabase
      .from('subscribers')
      .delete()
      .eq('user_id', userId);
    console.log('Subscribers:', subscribersDelete);
    
    // Delete profiles by ID
    const profileDelete = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    console.log('Profile by ID:', profileDelete);
    
    // Delete profiles by email
    if (userId.includes('@')) {
      const emailDelete = await supabase
        .from('profiles')
        .delete()  
        .eq('email', userId);
      console.log('Profile by email:', emailDelete);
    }
  }
  
  console.log('✅ Cleanup complete!');
};

// Run it
cleanupUser();