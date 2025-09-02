# 🚀 START HERE - GoalMine.ai Developer Onboarding

## For New Developers, New Chats, or Returning After Time Away

### 📖 Read These Documents First (IN THIS ORDER):

1. **`CLAUDE.md`** - Complete project overview and architecture
   - Understand what the app does
   - Learn the technical stack
   - Review common issues and fixes

2. **`DEPLOYMENT_READY.md`** - Deployment and environment setup
   - Understand the dev → production pipeline
   - Learn how to deploy changes
   - Review testing checklists

3. **`DEVELOPMENT_WORKFLOW.md`** - Development best practices
   - Learn the coding workflow
   - Understand testing requirements
   - Review emergency procedures

---

## 🔑 Quick Context for AI Assistants

**Tell your AI assistant:**
"Please review CLAUDE.md, DEPLOYMENT_READY.md, and DEVELOPMENT_WORKFLOW.md before we start working on the GoalMine.ai app."

---

## 🏗️ Project Setup Summary

- **App Name**: GoalMine.ai (formerly steady-aim-coach in Lovable)
- **GitHub Repo**: relevantnoise/goalmine
- **Local Dev**: http://localhost:5173
- **Production**: https://goalmine.ai
- **Vercel Projects**: steady-aim-coach (dev) & GoalMine (production)

---

## 🚦 Current Status

- **Production**: Live at goalmine.ai
- **All Features**: Working and tested
- **Subscription Limits**: Enforced (1 goal free, 3 goals premium)
- **Known Issues**: All documented in CLAUDE.md

---

## 💻 Quick Start Commands

```bash
# Start local development
npm install
npm run dev

# Deploy to production
git add -A
git commit -m "Your change description"
git push origin main
# (Auto-deploys to Vercel)
```

---

## ⚠️ Critical Things to Know

1. **Never edit production directly** - Always work in local dev first
2. **Test thoroughly** - Use checklists in DEPLOYMENT_READY.md
3. **Firebase Auth** - Uses CDN version, not npm package
4. **Supabase Edge Functions** - Handle all database writes
5. **Email System** - Uses Render (not Resend anymore)

---

## 📞 If You Get Stuck

1. Check CLAUDE.md for common issues
2. Review recent commits in git history
3. Check Vercel and Supabase logs
4. Test in incognito mode to rule out cache issues

---

**Remember**: This START_HERE.md file is your roadmap. Always start here when returning to the project or onboarding someone new.