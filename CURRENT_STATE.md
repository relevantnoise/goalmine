# 🎯 GOALMINE.AI - CURRENT STATE (October 28, 2025)

**⚠️ CRITICAL: READ THIS FIRST BEFORE ANY DEVELOPMENT WORK**

This document is the **SINGLE SOURCE OF TRUTH** for GoalMine.ai's current state. All other documentation may contain outdated references to previous iterations.

---

## 📋 **WHAT GOALMINE.AI IS TODAY**

GoalMine.ai is a **comprehensive life architecture platform** built around the proprietary **6 Elements of Life™ Framework**, not just a goal tracking app.

**Core Value Proposition**: Transform users' lives through strategic time allocation and AI-powered coaching across all 6 life elements.

---

## 🏗️ **CURRENT ARCHITECTURE OVERVIEW**

### **Authentication System**
- ✅ **Firebase Authentication** (Google OAuth + Email/Password)
- ✅ **Hybrid User ID System** supporting both:
  - Legacy: Email-based user IDs (e.g., "user@example.com")
  - Current: Firebase UID (e.g., "ABC123xyz")
- ✅ **Backward/Forward Compatible** edge functions handle both formats
- ✅ **Unlimited scalability** via Firebase (no rate limits)

### **Database Architecture**
- ✅ **Supabase PostgreSQL** for data storage
- ✅ **Edge functions** handle all writes (RLS policy compliance)
- ✅ **Service role keys** for database operations
- ✅ **Hybrid query patterns** for user data retrieval

---

## 🔥 **6 ELEMENTS OF LIFE™ FRAMEWORK**

**CURRENT FRAMEWORK (Not 5 Circles!):**

1. **Work** - Career, jobs + Business Happiness Formula (Impact, Fun, Money, Remote work)
2. **Sleep** - Rest, recovery, sleep optimization  
3. **Friends & Family** - Relationships, social connections, quality time
4. **Health & Fitness** - Physical wellbeing, exercise, nutrition
5. **Personal Development** - Learning, growth, skills, education
6. **Spiritual** - Inner purpose, values, meaning, meditation, prayer

### **Business Happiness Formula** (Integrated into Work Element)
Dan Lynn's proven 10-year methodology with 4 dimensions:
- **Impact**: Current (1-10) → Desired (1-10)
- **Fun**: Current (1-10) → Desired (1-10)
- **Money**: Current (1-10) → Desired (1-10)
- **Remote Work**: Current (1-10) → Desired (1-10)

**Database Schema:**
- `six_elements_frameworks` - User framework instances
- `element_allocations` - Time allocation per element
- `work_happiness_assessment` - Business Happiness Formula metrics

---

## 📧 **EMAIL SYSTEM - CURRENT STATE**

### **CONSOLIDATED EMAIL SYSTEM** ✅ **OPERATIONAL**
- **ONE email per user per day** (regardless of goal count)
- **6 AM Eastern delivery** via Vercel cron
- **Universal AI-generated content** (same for all users)
- **NOT goal-specific or tone-specific** (complexity eliminated)

### **Trial Countdown Emails** ✅ **OPERATIONAL**
- **Automated countdown** at 7 days, 3 days, 1 day remaining
- **Conversion-focused** with upgrade prompts
- **Duplicate prevention** (won't send multiple per day)
- **UTM tracking** for analytics

### **Email Architecture:**
- **Transactional emails**: Resend (noreply@notifications.goalmine.ai)
- **Authentication emails**: Firebase (verification, password reset)
- **Daily cron**: `daily-cron` → `send-daily-wake-up-call` + `send-trial-warning`

---

## 🎯 **GOAL MANAGEMENT SYSTEM**

### **Goal Creation & Management**
- ✅ **Individual goal check-ins** with streak tracking
- ✅ **Goal-specific AI content** on detail pages (tone + goal specific)
- ✅ **Edit/delete/share** functionality within subscription limits
- ✅ **Element assignment** (goals are assigned to one of 6 elements)

### **Goal Detail Pages**
- ✅ **Smart AI content system**:
  - Fresh content when goal data changes (title, description, tone)
  - Cached content for unchanged goals (performance)
  - Real-time regeneration after check-ins (streak changes)

### **Universal Nudge System**
- ✅ **Dashboard-level nudges** (not goal-specific)
- ✅ **35-50 word universal motivation** that works for any user
- ✅ **Daily limits** based on subscription tier

---

## 💰 **SUBSCRIPTION TIERS**

### **Free Trial**
- **30 days** with full feature access
- **1 goal** maximum
- **1 daily nudge** 
- **All 6 Elements Framework** features included

### **Personal Plan** - $4.99/month
- **3 goals** maximum
- **3 daily nudges**
- **All features** unlocked

### **Pro Plan** - $199.99/month  
- **5 goals** maximum
- **5 daily nudges**
- **6 Elements Framework** + **1-hour monthly group Q&A with Dan Lynn**

### **Strategic Advisor Plan** - $950/month
- **5 goals** maximum  
- **5 daily nudges**
- **6 Elements Framework** + **2-hour monthly 1-on-1 coaching with Dan Lynn**

---

## 🔄 **GOAL & TRIAL EXPIRATION LOGIC**

### **Goal Expiration** (past target_date)
- ✅ **Visual**: Red "GOAL EXPIRED" badge
- ✅ **Permissions**: Edit ✅ Delete ✅ | Check-in ❌ Share ❌ Emails ❌
- ✅ **Purpose**: Users can extend date or clean up old goals

### **Trial Expiration** (30+ days, not subscribed)  
- ✅ **Visual**: Orange "TRIAL EXPIRED" badge + upgrade prompts
- ✅ **Permissions**: All actions disabled ❌ until upgrade
- ✅ **Reactivation**: Goals become active again when user subscribes
- ✅ **Data preservation**: No user data is ever lost

---

## 🤖 **AI CONTENT STRATEGY**

### **Dual-Layer Approach:**

**1. Goal Detail Pages (Personalized)**
- Goal-specific + tone-specific content
- Real-time generation when data changes
- Cached for performance when unchanged

**2. Daily Emails (Universal)**
- Same content for all users (eliminates complexity)
- Fresh AI generation daily at 6 AM Eastern
- Universal motivation that works for everyone

**3. Universal Nudges (Dashboard)**
- 35-50 word motivation bursts
- Works regardless of user's goal count or setup
- Respects daily limits per subscription tier

---

## 🛠️ **TECHNICAL IMPLEMENTATION STATUS**

### **Production-Ready Systems** ✅
- Firebase Authentication + Google OAuth
- Supabase database with hybrid architecture
- Consolidated email system (October 2025)
- 6 Elements Framework integration (October 2025)
- Goal expiration/reactivation logic
- Trial countdown emails
- Stripe subscription management
- Universal nudge system

### **Database Safety** ✅
- 62 dangerous edge functions removed (October 2025)
- Bulk deletion capabilities eliminated
- 1-day content storage (95% storage reduction)
- Zero data loss risk

---

## 📊 **CURRENT USER BASE**
- **3 active users** (Dan Lynn + family)
- **Safe for testing** without affecting real user base
- **Production environment** fully operational at goalmine.ai

---

## 🚨 **CRITICAL NOTES FOR AI ASSISTANTS**

### **READ THESE FIRST:**
1. **DATABASE_SAFETY.md** - MANDATORY safety rules (never create cleanup functions)
2. **This CURRENT_STATE.md** - Single source of truth for current features
3. **CLAUDE.md** - Technical architecture details

### **DO NOT ASSUME:**
- ❌ We have 5 Circle Framework (it's 6 Elements now)
- ❌ We send goal-specific daily emails (we send universal emails)
- ❌ Users choose email timing (fixed at 6 AM Eastern)
- ❌ We have complex onboarding (it's been simplified)

### **WHEN IN DOUBT:**
- Check this document first
- Search codebase for current implementation
- Ask user for clarification on current state

---

## 🎯 **STRATEGIC POSITIONING**

**GoalMine.ai is positioned as:**
- **Life Architecture Platform** (not goal tracking app)
- **30-year proprietary framework** delivered via AI
- **Business consulting expertise** accessible 24/7
- **Strategic life management** for time, stress, and happiness optimization

**Competitive Advantage:**
- Proprietary 6 Elements Framework™
- Proven Business Happiness Formula
- Enterprise-grade technical architecture
- Category creation (not app competition)

---

**Last Updated**: October 28, 2025  
**Status**: Production Ready  
**Domain**: goalmine.ai  
**Confidence Level**: Very High

---

**⚠️ If you find any discrepancies between this document and other documentation, THIS document takes precedence. Please flag any inconsistencies for update.**