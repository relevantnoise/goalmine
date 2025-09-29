# 🚀 START HERE - GoalMine.ai Developer Onboarding

## 🚨 CRITICAL: READ DATABASE SAFETY FIRST
**BEFORE doing ANYTHING else, read `DATABASE_SAFETY.md` and `SAFE_DEVELOPMENT.md`**

### ⚠️ Data Loss Prevention (MANDATORY)
- All dangerous cleanup functions have been removed
- Only individual record deletion is allowed
- Mass deletion functions are FORBIDDEN
- Always work on dev branch first
- Never call functions without reading them completely

---

## For New Developers, New Chats, or Returning After Time Away

### 📖 Read These Documents First (IN THIS ORDER):

1. **`DATABASE_SAFETY.md`** - **CRITICAL** Database protection rules (READ FIRST!)
   - Rules for safe database operations
   - Forbidden function patterns
   - Safety protocols for AI assistants

2. **`SAFE_DEVELOPMENT.md`** - **CRITICAL** Development safety guidelines
   - Safe coding practices
   - Red flags to watch for
   - Emergency protocols

3. **`STATUS.md`** - Complete status overview
   - Executive summary of current state
   - Latest expired goals/trials system implementation
   - Complete feature matrix and business logic
   - Production readiness assessment

4. **`ARCHITECTURE_MIGRATION.md`** - Root cause of persistent bugs
   - Explains dual-project architecture problem
   - Why email issues keep recurring across 100+ chats
   - Complete migration plan to fix architectural issues

5. **`CLAUDE.md`** - Complete project overview and technical architecture
   - Understand what the app does and how it works
   - Learn the technical stack and design patterns
   - Review common issues and troubleshooting

6. **`DEPLOYMENT_READY.md`** - Deployment workflows and environment setup
   - Understand the dev → production pipeline
   - Learn how to deploy changes safely
   - Review comprehensive testing checklists

7. **`CURRENT_STATUS.md`** - Detailed development history and context
   - Recent development achievements
   - Testing results and deployment preparation
   - Critical notes for developers

---

## 🔑 Quick Context for AI Assistants

**Tell your AI assistant:**
"Please read DATABASE_SAFETY.md and SAFE_DEVELOPMENT.md FIRST before any work. Then read STATUS.md and CLAUDE.md. ✅ ARCHITECTURAL FIX COMPLETE: Branch-based development workflow eliminates systematic email bugs. Use dev branch for development (safe), main branch for production (live). CRITICAL: Never create or call mass deletion functions - user data protection is paramount."

---

## 🛡️ Safety-First Development Workflow

### Required Steps:
1. **Read safety documentation first**
2. **Work on dev branch only**: `git checkout dev`
3. **Understand before you act**: Read function code completely
4. **Test with minimal data**: Never mass operations
5. **Document all changes**: Clear commit messages
6. **Deploy safely**: Dev → staging → production

### Forbidden Actions:
- Creating cleanup functions
- Mass data deletion
- Working directly on production
- Calling functions without reading them
- Bypassing safety checks

---

## 🏗️ Project Setup Summary

- **App Name**: GoalMine.ai (formerly steady-aim-coach in Lovable)
- **Repository**: GitHub - relevantnoise/goalmine
- **Live Site**: https://goalmine.ai
- **Development**: localhost:5173 (npm run dev)
- **Database**: Supabase with service role protection
- **Safety Status**: ✅ Protected from mass deletion

---

## 🆘 Emergency Contacts

If you encounter:
- Data loss
- Mass deletion
- Production issues
- Safety concerns

**STOP IMMEDIATELY** and follow emergency protocols in SAFE_DEVELOPMENT.md

---

**Remember: User data is irreplaceable. Safety comes before speed.**