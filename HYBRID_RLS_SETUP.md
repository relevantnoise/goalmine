# 🛡️ HYBRID RLS POLICIES SETUP GUIDE

## Overview
This guide adds smart RLS policies that support your hybrid Firebase/Email authentication architecture without breaking existing functionality.

## ✅ BENEFITS
- **No breaking changes** - Edge functions continue working via service role bypass
- **Enhanced security** - Frontend can optionally access data directly  
- **Hybrid support** - Works with both Firebase UID and email formats
- **Future flexibility** - Reduces dependency on edge functions over time

## 🔧 MANUAL SETUP (Recommended)

### Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Authentication > Policies**

### Step 2: Add Goals Table Policy
```sql
-- Enable RLS on goals table
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Add hybrid auth policy
CREATE POLICY "Hybrid auth access for goals" ON goals
FOR ALL USING (
  -- Support Firebase UID format (direct match)
  user_id = auth.uid()::text 
  OR 
  -- Support email format (lookup via auth.users)
  user_id = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR
  -- Keep service role bypass for edge functions (CRITICAL - no breaking changes)
  auth.role() = 'service_role'
);
```

### Step 3: Add User Frameworks Policy
```sql
-- Enable RLS on user_frameworks table  
ALTER TABLE user_frameworks ENABLE ROW LEVEL SECURITY;

-- Add hybrid auth policy
CREATE POLICY "Hybrid auth access for user_frameworks" ON user_frameworks
FOR ALL USING (
  -- Firebase UID format
  user_id = auth.uid()::text
  OR
  -- Email format lookup
  user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR
  -- Keep service role bypass
  auth.role() = 'service_role'
);
```

### Step 4: Add Profiles Policy (if needed)
```sql
-- Profiles likely already work, but add for consistency
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hybrid auth access for profiles" ON profiles
FOR ALL USING (
  -- Direct Firebase UID match
  id = auth.uid()
  OR
  -- Keep service role bypass
  auth.role() = 'service_role'
);
```

### Step 5: Add Daily Nudges Policy
```sql
ALTER TABLE daily_nudges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hybrid auth access for daily_nudges" ON daily_nudges
FOR ALL USING (
  user_id = auth.uid()::text
  OR
  user_id = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR
  auth.role() = 'service_role'
);
```

## 🚨 CRITICAL NOTES

### **DO NOT TOUCH THESE TABLES:**
- **`subscribers`** - Uses email-based user_id with specific business logic
- **`strategic_partners`** - Should remain unrestricted (public partner data)
- **`partner_clicks`** - Should remain unrestricted (anonymous tracking)

### **Service Role Bypass is ESSENTIAL:**
Every policy MUST include:
```sql
OR auth.role() = 'service_role'
```
This ensures your existing edge functions continue working without any changes.

## 🧪 TESTING

### Before Implementation:
- ✅ Edge functions work (they bypass RLS)
- ❌ Frontend direct access blocked by RLS

### After Implementation:
- ✅ Edge functions still work (service role bypass maintained)
- ✅ Frontend can optionally access data directly (hybrid auth support)

## 📋 VERIFICATION STEPS

1. **Test Edge Functions**: Ensure check-in, goal creation still work
2. **Test Frontend**: Try direct goal queries from frontend (optional)
3. **Monitor Logs**: Check for any RLS-related errors
4. **Rollback Plan**: Simply drop policies if issues arise:
   ```sql
   DROP POLICY "Hybrid auth access for goals" ON goals;
   ```

## 🎯 IMPLEMENTATION PRIORITY

**Start with goals table** - this is your highest traffic table and will show immediate benefits.

**Then add user_frameworks** - enables direct framework access from frontend.

**Add others as needed** - profiles and daily_nudges are lower priority.

## ✅ SUCCESS INDICATORS

After implementation, you should have:
- **Zero breaking changes** - all existing functionality works
- **Enhanced flexibility** - option for direct frontend database access  
- **Maintained security** - proper user data isolation
- **Simplified future development** - less edge function dependency

This enhancement makes your platform more robust while preserving everything that currently works!