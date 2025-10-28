# 🤖 AI ASSISTANT ONBOARDING CHECKLIST

**For Claude, ChatGPT, or any AI working on GoalMine.ai**

---

## 📋 **MANDATORY READING ORDER**

### **1. CURRENT_STATE.md** ⚠️ **CRITICAL FIRST**
- Single source of truth for what GoalMine.ai is today
- Current features, architecture, and user flow
- Updated October 28, 2025

### **2. DATABASE_SAFETY.md** 🚨 **CRITICAL SAFETY**
- Non-negotiable safety rules
- Never create bulk deletion functions
- Required before any database operations

### **3. CLAUDE.md** 📚 **TECHNICAL DETAILS**
- Technical architecture and implementation details
- Development patterns and troubleshooting
- Supplement to CURRENT_STATE.md

---

## ✅ **VERIFICATION CHECKLIST**

Before starting any work, confirm you understand:

### **Current Framework**
- [ ] It's **6 Elements of Life™ Framework** (NOT 5 Circles)
- [ ] The 6 elements are: Work, Sleep, Friends & Family, Health & Fitness, Personal Development, Spiritual
- [ ] Work element includes Business Happiness Formula (Impact, Fun, Money, Remote)

### **Email System**
- [ ] **ONE consolidated email per user** at 6 AM Eastern (NOT per goal)
- [ ] **Universal content** for all users (NOT goal-specific)
- [ ] **Trial countdown emails** at 7, 3, 1 days remaining

### **Authentication**
- [ ] **Firebase Authentication** with Google OAuth
- [ ] **Hybrid user ID system** (email + Firebase UID)
- [ ] **Backward/forward compatible** edge functions

### **Goal Management**
- [ ] **Individual check-ins** with streaks per goal
- [ ] **Goal-specific AI content** on detail pages only
- [ ] **Universal nudges** from dashboard (not goal-specific)
- [ ] **Element assignment** required for each goal

### **Subscription Tiers**
- [ ] Free: 1 goal, 1 nudge, 30-day trial
- [ ] Personal: 3 goals, 3 nudges, $4.99/month
- [ ] Pro: 5 goals, 5 nudges + group Q&A, $199.99/month  
- [ ] Strategic: 5 goals, 5 nudges + 1-on-1 coaching, $950/month

---

## 🚨 **COMMON MISCONCEPTIONS TO AVOID**

### **DO NOT ASSUME:**
- ❌ We have 5 Circle Framework (it's 6 Elements)
- ❌ We send goal-specific daily emails (universal emails only)
- ❌ Users choose email timing (fixed at 6 AM Eastern)
- ❌ We have complex AI consultant onboarding (simplified)
- ❌ We need cleanup functions (NEVER create these)

### **WHEN UNSURE:**
1. Check CURRENT_STATE.md
2. Search codebase for current implementation  
3. Ask user for clarification
4. Never assume based on outdated documentation

---

## 🛠️ **DEVELOPMENT APPROACH**

### **Before Making Changes:**
1. ✅ Read safety documentation
2. ✅ Understand current state completely
3. ✅ Search for existing implementation
4. ✅ Confirm with user if uncertain

### **Safe Development Patterns:**
- ✅ Individual record operations with user validation
- ✅ Edge functions for database writes
- ✅ Hybrid architecture support (email + Firebase UID)
- ✅ Progressive enhancement over breaking changes

---

## 📞 **QUICK REFERENCE**

**Production URL**: goalmine.ai  
**Current Users**: 3 (Dan Lynn + family)  
**Status**: Production ready, fully operational  
**Last Major Update**: October 2025 (6 Elements + Consolidated emails)

---

**🎯 Remember**: GoalMine.ai is a **life architecture platform** using proprietary frameworks, not just a goal tracking app. Think strategic life management, not simple task tracking.**