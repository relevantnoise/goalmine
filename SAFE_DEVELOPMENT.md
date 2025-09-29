# 🛡️ Safe Development Guidelines for GoalMine.ai

## FOR CLAUDE CODE / CURSOR AI ASSISTANTS

### ⚠️ CRITICAL RULES - NEVER VIOLATE
1. **NEVER call functions you haven't read completely**
2. **NEVER create functions that delete multiple records**
3. **NEVER call functions with "cleanup", "delete-all", "reset" in the name**
4. **ALWAYS work on dev branch first**
5. **ALWAYS test with individual records, not mass operations**

### 🔒 Database Safety Checklist

Before ANY database operation:
- [ ] Read the function code completely
- [ ] Understand exactly what data will be affected
- [ ] Verify it only affects intended records
- [ ] Check for user permission validation
- [ ] Test on dev environment first

### 📋 Safe Function Patterns

#### ✅ SAFE: Individual Record Operations
```typescript
// User deleting their own goal
.delete().eq('id', goalId).eq('user_id', userId)

// User updating their own profile  
.update(changes).eq('id', userId)

// Getting user's own data
.select().eq('user_id', userId)
```

#### ❌ DANGEROUS: Mass Operations
```typescript
// NEVER: Affects all records
.delete().neq('id', 'fake-id')

// NEVER: Affects multiple users
.delete().in('user_id', userList)

// NEVER: Blanket updates
.update().eq('some_field', value)
```

### 🚨 Forbidden Function Names
- `cleanup-*`
- `delete-all-*`
- `reset-database`
- `clear-*`
- `remove-all-*`
- `purge-*`
- `wipe-*`

### 🔧 Development Workflow

#### Required Steps for Database Changes:
1. **Switch to dev branch**: `git checkout dev`
2. **Read existing function code completely**
3. **Understand data impact**
4. **Test with minimal data**
5. **Verify safety checks work**
6. **Document changes**
7. **Deploy to dev environment first**
8. **Test thoroughly**
9. **Only then consider production**

#### Emergency Protocols:
- If unsure about a function: DON'T CALL IT
- If data is critical: CREATE BACKUP FIRST
- If making database changes: TEST ON DEV ONLY
- If something goes wrong: STOP IMMEDIATELY

### 🛠️ Safe Email System Development

#### For Email Issues:
1. **Read email function code first**
2. **Test with single goal/user**
3. **Check logs for actual errors**
4. **Never reset all motivation dates**
5. **Use read-only queries to diagnose**

#### Debugging Process:
1. Check what data exists first
2. Understand the actual problem
3. Create minimal test case
4. Fix root cause, not symptoms
5. Test thoroughly before deployment

### 📊 Data Inspection Commands (SAFE)

```typescript
// ✅ SAFE: Count records
.select('*', { count: 'exact', head: true })

// ✅ SAFE: View sample data
.select().limit(5)

// ✅ SAFE: Check specific user
.select().eq('user_id', 'specific-id')
```

### 🔐 Access Control Rules

#### Service Role Keys:
- Only use for legitimate application functions
- Never for mass deletion operations
- Include user permission checks
- Log all operations

#### Function Deployment:
- Test locally first
- Deploy to dev environment
- Verify safety
- Only then deploy to production

### 🚨 Red Flags - STOP IMMEDIATELY
- Function deletes from multiple tables
- Function has no WHERE clause restrictions
- Function operates on all users
- Function doesn't check permissions
- Function name suggests mass operations
- No confirmation or safety checks

### 📝 Documentation Requirements

Every function that modifies data must have:
- Clear description of what it does
- List of affected tables/records
- Permission requirements
- Safety mechanisms
- Test procedures

### 🆘 If Things Go Wrong

#### Immediate Actions:
1. Stop all database operations
2. Don't try to "fix" with more operations
3. Document exactly what happened
4. Check for backup/recovery options
5. Inform the team immediately

#### Never:
- Try to "undo" operations with more deletions
- Guess at fixes
- Continue operating on production data
- Make changes without understanding impact

---

## REMEMBER: User data is irreplaceable. It's better to take time and be safe than to lose everything trying to move fast.

**When in doubt, ask questions. When still in doubt, DON'T PROCEED.**