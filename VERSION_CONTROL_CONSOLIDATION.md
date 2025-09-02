# GoalMine.ai - Version Control & Consolidation Guide

**Date**: September 2, 2025  
**Status**: DEPLOYMENT-READY - Testing complete, version verified

---

## 🎯 CORRECT PRODUCTION VERSION

**✅ USE THIS VERSION ONLY:**
- **Path**: `/Users/zaptitude/Downloads/steady-aim-coach-main/`
- **Port**: `5174` (currently running)
- **Status**: DEPLOYMENT-READY with comprehensive testing complete
- **Updated**: September 2, 2025 with testing verification and deployment prep

---

## ⚠️ DEPRECATED VERSIONS (DO NOT USE)

### `/Users/zaptitude/Downloads/goalmine-firebase/`
- **Status**: DEPRECATED - Old Firebase experiment
- **Issues**: Missing recent bug fixes, incomplete features
- **Action**: Archive or delete

### `/Users/zaptitude/Downloads/goalmine-fresh/`
- **Status**: DEPRECATED - Early development version  
- **Issues**: Missing production features, not tested
- **Action**: Archive or delete

### `/Users/zaptitude/Downloads/steady-aim-coach-firebase/`
- **Status**: DEPRECATED - Firebase migration attempt
- **Issues**: Incomplete migration, missing fixes
- **Action**: Archive or delete

---

## 🚀 PRE-DEPLOYMENT VERIFICATION

Before deploying, verify you're using the correct version:

### 1. Check Current Directory
```bash
pwd
# Should show: /Users/zaptitude/Downloads/steady-aim-coach-main
```

### 2. Verify Package.json
```bash
head -10 package.json
# Should show GoalMine.ai project with latest dependencies
```

### 3. Check Recent Updates
```bash
ls -la CURRENT_STATUS.md
# Should show modification date: Sep 2, 2025
```

### 4. Verify Key Files Exist
```bash
ls src/pages/Index.tsx src/components/Dashboard.tsx src/hooks/useGoals.tsx
# All files should exist with recent modifications
```

### 5. Verify Testing Tools
```bash
ls test-subscription-limits.html DEPLOYMENT_READY.md fix-test-users.js
# Testing and deployment files should exist
```

---

## 🔧 SAFE CLEANUP PROCESS

### Step 1: Backup Current Version
```bash
cd /Users/zaptitude/Downloads
cp -r steady-aim-coach-main steady-aim-coach-main-PRODUCTION-BACKUP-Sept1
```

### Step 2: Archive Old Versions
```bash
mkdir archived-versions
mv goalmine-firebase archived-versions/
mv goalmine-fresh archived-versions/
mv steady-aim-coach-firebase archived-versions/
```

### Step 3: Clear Confusion
- Only keep `steady-aim-coach-main` in active Downloads folder
- All other versions moved to `archived-versions` folder
- No accidental deployment of wrong version possible

---

## 📋 DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] Confirm using `/Users/zaptitude/Downloads/steady-aim-coach-main/`
- [ ] Verify `npm run dev` runs on port 5174  
- [ ] Check CURRENT_STATUS.md shows September 2, 2025 updates
- [ ] Test goal creation, check-ins, dashboard layout
- [ ] Verify all bug fixes from today are present
- [ ] Confirm email system uses Resend (not immediate emails)
- [ ] Test subscription limits work correctly

---

## 🚨 CRITICAL REMINDER

**NEVER DEPLOY FROM:**
- goalmine-firebase
- goalmine-fresh  
- steady-aim-coach-firebase
- Any other directory

**ONLY DEPLOY FROM:**
- `/Users/zaptitude/Downloads/steady-aim-coach-main/`

This is the ONLY version with:
- ✅ Check-in bug fixes
- ✅ Dashboard redesign
- ✅ Navigation jumpiness fixes
- ✅ Toast message standardization
- ✅ Email system simplification
- ✅ All September 1, 2025 improvements
- ✅ Subscription limits testing complete (Sep 2, 2025)
- ✅ Production deployment preparation complete
- ✅ Test frameworks and verification tools

---

## 🎯 FINAL VALIDATION

Run this command to verify you're in the correct version:

```bash
cd /Users/zaptitude/Downloads/steady-aim-coach-main && \
grep "September 2, 2025" CURRENT_STATUS.md && \
echo "✅ CORRECT VERSION CONFIRMED - DEPLOYMENT READY"
```

If this doesn't show "✅ CORRECT VERSION CONFIRMED - DEPLOYMENT READY", you're in the wrong directory.

---

*This document ensures we deploy the correct, production-ready version with all critical fixes applied.*