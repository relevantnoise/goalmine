// Quick test of Phase 1 helper functions
// This tests the business logic without affecting the live system

// Mock data for testing
const mockGoalActive = {
  id: 'test1',
  title: 'Test Goal',
  target_date: '2025-12-31', // Future date
  user_id: 'test@example.com'
};

const mockGoalExpired = {
  id: 'test2', 
  title: 'Expired Goal',
  target_date: '2024-01-01', // Past date
  user_id: 'test@example.com'
};

const mockGoalNoDate = {
  id: 'test3',
  title: 'No End Date Goal',
  target_date: null,
  user_id: 'test@example.com'
};

const mockProfileActive = {
  id: 'user1',
  email: 'test@example.com',
  trial_expires_at: '2025-12-31T23:59:59Z', // Future date
  created_at: '2025-01-01T00:00:00Z'
};

const mockProfileExpired = {
  id: 'user2', 
  email: 'test2@example.com',
  trial_expires_at: '2024-01-01T23:59:59Z', // Past date
  created_at: '2024-01-01T00:00:00Z'
};

// Test functions (simplified versions of our actual functions)
function isGoalExpired(goal) {
  if (!goal.target_date) return false;
  const targetDate = new Date(goal.target_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return targetDate < today;
}

function isTrialExpired(profile) {
  if (!profile || !profile.trial_expires_at) return false;
  return new Date(profile.trial_expires_at) < new Date();
}

function getGoalStatus(goal, profile, isSubscribed) {
  if (isTrialExpired(profile) && !isSubscribed) return 'trial-expired';
  if (isGoalExpired(goal)) return 'goal-expired';
  return 'active';
}

function getGoalPermissions(goal, profile, isSubscribed) {
  const status = getGoalStatus(goal, profile, isSubscribed);
  
  switch (status) {
    case 'trial-expired':
      return { canEdit: false, canDelete: false, canCheckIn: false };
    case 'goal-expired':
      return { canEdit: true, canDelete: true, canCheckIn: false };
    case 'active':
    default:
      return { canEdit: true, canDelete: true, canCheckIn: true };
  }
}

// Run tests
console.log('=== PHASE 1 LOGIC TESTS ===\n');

console.log('Test 1: Active goal + Active trial + Free user');
console.log('Status:', getGoalStatus(mockGoalActive, mockProfileActive, false));
console.log('Permissions:', getGoalPermissions(mockGoalActive, mockProfileActive, false));
console.log('Expected: active, full permissions\n');

console.log('Test 2: Expired goal + Active trial + Free user');
console.log('Status:', getGoalStatus(mockGoalExpired, mockProfileActive, false));
console.log('Permissions:', getGoalPermissions(mockGoalExpired, mockProfileActive, false));
console.log('Expected: goal-expired, edit/delete only\n');

console.log('Test 3: Active goal + Expired trial + Free user');
console.log('Status:', getGoalStatus(mockGoalActive, mockProfileExpired, false));
console.log('Permissions:', getGoalPermissions(mockGoalActive, mockProfileExpired, false));
console.log('Expected: trial-expired, read-only\n');

console.log('Test 4: Expired goal + Expired trial + Free user');
console.log('Status:', getGoalStatus(mockGoalExpired, mockProfileExpired, false));
console.log('Permissions:', getGoalPermissions(mockGoalExpired, mockProfileExpired, false));
console.log('Expected: trial-expired, read-only (most restrictive wins)\n');

console.log('Test 5: Any goal + Expired trial + Paid user');
console.log('Status:', getGoalStatus(mockGoalExpired, mockProfileExpired, true));
console.log('Permissions:', getGoalPermissions(mockGoalExpired, mockProfileExpired, true));
console.log('Expected: goal-expired, edit/delete only (subscription overrides trial)\n');

console.log('Test 6: No target date goal');
console.log('Is expired:', isGoalExpired(mockGoalNoDate));
console.log('Expected: false (no target date = never expires)\n');

console.log('=== TESTS COMPLETE ===');