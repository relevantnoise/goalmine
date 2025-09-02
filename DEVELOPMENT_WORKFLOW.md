# 🔄 GoalMine.ai Development Workflow & Best Practices

## 🎯 Core Development Principles

### 1. Never Break Production
- All development happens locally first
- Test thoroughly before deploying
- Use feature flags for risky changes
- Always have a rollback plan
- **CRITICAL: Verify database schema in production before declaring success**

### 2. User Experience First
- Every change should improve the user experience
- Performance matters - keep load times under 2 seconds
- Mobile-first development approach
- Accessibility is not optional

### 3. Code Quality Standards
- Write clean, readable code with clear variable names
- Comment complex logic
- Follow existing patterns in the codebase
- Keep components small and focused

### 4. AI Assistant Responsibilities (CRITICAL)
- **NEVER ask user to run SQL manually**
- **ALWAYS verify database schema exists in production**
- **Handle ALL technical aspects** - user should only test functionality
- **Immediately fix infrastructure issues** without user intervention
- **Take full ownership** of deployment completeness

---

## 📋 Development Workflow

### Phase 1: Planning
Before writing any code:
1. **Define the Problem**: What issue are we solving?
2. **Design the Solution**: How will we solve it?
3. **Consider Edge Cases**: What could go wrong?
4. **Plan Testing**: How will we verify it works?

### Phase 2: Development
```
┌─────────────────────────────────────┐
│  1. Create/Update Feature Locally   │
│     (localhost:5173)                │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  2. Test in Browser                 │
│     - Check all user flows          │
│     - Test edge cases               │
│     - Verify no console errors      │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  3. Run Build Test                  │
│     npm run build                   │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  4. Complete Testing Checklist      │
│     (See Testing section below)     │
└─────────────────────────────────────┘
```

### Phase 3: Deployment
```
┌─────────────────────────────────────┐
│  1. Commit Changes                  │
│     git add -A                      │
│     git commit -m "Clear message"   │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  2. Push to GitHub                  │
│     git push origin main            │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  3. Monitor Deployment              │
│     - Check Vercel dashboard        │
│     - Wait for completion (2-3 min) │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  4. Test on Production              │
│     - Visit goalmine.ai             │
│     - Run production tests          │
└─────────────────────────────────────┘
```

---

## ✅ Testing Requirements

### Before Every Commit - Local Testing

#### Quick Smoke Test (2 minutes)
1. **Build Test**: `npm run build` - Must complete without errors
2. **Console Check**: Open browser console - No errors allowed
3. **Database Check**: Verify all core tables exist in dev environment
4. **Core Flow**: Sign in → View Dashboard → Create Goal → Sign out

#### Full Feature Test (10 minutes)
Run through each section of the testing checklist in DEPLOYMENT_READY.md:
- Authentication flows
- Goal management
- Check-ins and streaks
- Subscription limits
- Email delivery
- UI responsiveness

### After Deployment - Production Testing

#### Critical Path Test (5 minutes)
1. **Database Verification**: AI must verify all core tables exist in production
2. **Load Homepage**: Verify it loads quickly
3. **Authentication**: Test login/logout
4. **Core Feature**: Create or check in on a goal (tests database connectivity)
5. **Subscription**: Verify limits are enforced (tests subscribers table)
6. **Mobile Check**: Test on phone

#### Comprehensive Test (15 minutes)
Complete the full production testing checklist from DEPLOYMENT_READY.md

---

## 🐛 Bug Fix Workflow

### 1. Reproduce the Bug
- Confirm the issue exists
- Document exact steps to reproduce
- Take screenshots if visual issue
- Note any console errors

### 2. Investigate
- Check recent commits for related changes
- Review error logs in Vercel/Supabase
- Test in different browsers if relevant
- Identify root cause

### 3. Fix & Test
- Create minimal fix (don't refactor unrelated code)
- Test the specific issue is resolved
- Verify no new issues introduced
- Run full test suite

### 4. Deploy
- Commit with clear message: `Fix: [issue description]`
- Push to GitHub
- Test immediately on production
- Monitor for any new errors

---

## 🚀 Feature Development Workflow

### 1. Planning Phase
- [ ] Create user story: "As a [user], I want to [action], so that [benefit]"
- [ ] Design UI/UX mockup or wireframe
- [ ] List technical requirements
- [ ] Identify affected components
- [ ] Plan database changes if needed

### 2. Implementation Phase
- [ ] Create feature branch (optional but recommended for large features)
- [ ] Build incrementally with frequent testing
- [ ] Update relevant documentation
- [ ] Add to testing checklist if needed

### 3. Testing Phase
- [ ] Unit test the feature
- [ ] Integration test with existing features
- [ ] Test edge cases and error states
- [ ] Verify mobile responsiveness
- [ ] Check performance impact

### 4. Release Phase
- [ ] Merge to main branch
- [ ] Deploy to production
- [ ] Announce to team/users if significant
- [ ] Monitor for issues

---

## 📊 Performance Guidelines

### Page Load Targets
- **Initial Load**: < 2 seconds
- **Route Changes**: < 500ms
- **API Calls**: < 1 second
- **UI Feedback**: < 100ms

### Optimization Techniques
1. **Code Splitting**: Use dynamic imports for large components
2. **Image Optimization**: Use WebP format, lazy load images
3. **Caching**: Implement proper cache headers
4. **Bundle Size**: Keep main bundle < 500KB

### Performance Testing
```bash
# Build and analyze bundle size
npm run build

# Test locally with production build
npm run preview

# Use Chrome DevTools Lighthouse
# Right-click → Inspect → Lighthouse tab
```

---

## 🔒 Security Best Practices

### Never Do This
- ❌ Commit API keys or secrets
- ❌ Store sensitive data in localStorage
- ❌ Trust client-side validation only
- ❌ Log user passwords or personal data
- ❌ Use `eval()` or `innerHTML` with user input

### Always Do This
- ✅ Use environment variables for secrets
- ✅ Validate input on both client and server
- ✅ Sanitize user-generated content
- ✅ Use HTTPS everywhere
- ✅ Keep dependencies updated

---

## 📝 Code Style Guidelines

### React Components
```tsx
// Good: Clear, focused component
export function GoalCard({ goal, onUpdate }: GoalCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle user interaction
  const handleCheckIn = async () => {
    setIsLoading(true);
    try {
      await checkIn(goal.id);
      onUpdate();
      toast.success("Great job! Keep it up!");
    } catch (error) {
      toast.error("Failed to check in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      {/* Component JSX */}
    </Card>
  );
}
```

### Naming Conventions
- **Components**: PascalCase (`GoalCard`, `Dashboard`)
- **Functions**: camelCase (`handleSubmit`, `getUserGoals`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_GOALS`, `API_TIMEOUT`)
- **Files**: Match component name (`GoalCard.tsx`)

### Git Commit Messages
```bash
# Format: Type: Description

# Types:
Fix: Bug fixes
Feature: New features
Update: Updates to existing features
Refactor: Code refactoring
Docs: Documentation changes
Test: Test additions or fixes
Style: CSS/UI changes

# Examples:
git commit -m "Fix: Resolve check-in timezone calculation issue"
git commit -m "Feature: Add social sharing for goals"
git commit -m "Update: Improve loading state animations"
```

---

## 🔄 Database Changes

### Process for Schema Changes
1. **Plan the Change**: Document what needs to change and why
2. **Create Migration**: Write SQL migration file
3. **Test Locally**: Apply to local Supabase instance
4. **Update Types**: Regenerate TypeScript types
5. **Update Code**: Modify components to use new schema
6. **Deploy Migration**: Apply to production Supabase
7. **Deploy Code**: Push updated code to production

### Migration Commands
```bash
# Generate types from local database
supabase gen types typescript --local > src/integrations/supabase/types.ts

# Apply migrations to production
supabase db push --project-ref [your-project-ref]
```

---

## 📱 Mobile Development Guidelines

### Responsive Design Checklist
- [ ] Test on iPhone SE (smallest common screen)
- [ ] Test on iPad (tablet view)
- [ ] Test landscape orientation
- [ ] Verify touch targets are 44x44px minimum
- [ ] Check that modals are scrollable on small screens
- [ ] Ensure forms are usable with mobile keyboard

### Mobile-First CSS
```css
/* Start with mobile styles */
.container {
  padding: 1rem;
}

/* Add tablet styles */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}

/* Add desktop styles */
@media (min-width: 1024px) {
  .container {
    padding: 3rem;
    max-width: 1200px;
  }
}
```

---

## 🚨 Emergency Procedures

### Production is Down
1. **Check Vercel Status**: https://vercel.com/status
2. **Check Supabase Status**: https://status.supabase.com
3. **Review Recent Deployments**: Roll back if needed
4. **Check Error Logs**: Vercel and Supabase dashboards
5. **Communicate**: Update team on status

### Rollback Procedure
```bash
# Via Vercel Dashboard (Recommended)
# 1. Go to Vercel dashboard
# 2. Select GoalMine project
# 3. Go to Deployments tab
# 4. Find last working deployment
# 5. Click "..." menu → "Promote to Production"

# Via Git (Alternative)
# 1. Find last working commit
git log --oneline

# 2. Revert to that commit
git revert HEAD
git push origin main
```

### Data Loss Prevention
- Daily automated Supabase backups
- Point-in-time recovery available
- Test restore procedures quarterly

---

## 📚 Learning Resources

### Documentation
- **Project Docs**: CLAUDE.md, DEPLOYMENT_READY.md
- **React**: https://react.dev
- **Supabase**: https://supabase.com/docs
- **Vercel**: https://vercel.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

### Debugging Tools
- **React DevTools**: Chrome/Firefox extension
- **Network Tab**: Monitor API calls
- **Console**: Check for errors
- **Lighthouse**: Performance audits

---

## 🎉 Deployment Success Checklist

After every deployment, celebrate when you can check all these boxes:

- [ ] 🚀 Deployment completed without errors
- [ ] ✅ All tests passing
- [ ] 📱 Mobile experience smooth
- [ ] ⚡ Performance targets met
- [ ] 🔒 No security issues
- [ ] 😊 Users happy
- [ ] 📈 Metrics improving

---

## 💡 Pro Tips

1. **Small, Frequent Deploys**: Easier to identify issues
2. **Feature Flags**: Test new features with select users
3. **Monitor Everything**: Set up alerts for errors
4. **Document Changes**: Update docs with code changes
5. **User Feedback**: Listen and iterate quickly
6. **Stay Consistent**: Follow established patterns
7. **Ask Questions**: When unsure, ask the team

---

*Remember: Every deployment is an opportunity to make users' lives better. Test thoroughly, deploy confidently, and monitor closely.*