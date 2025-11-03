# Subscription Limits Analysis

## Test Cases for Different Subscription Tiers

### Free User (No Subscription)
- Current DB Record: `subscribed: false` or no record
- Goal Limit: 1
- Nudge Limit: 1
- Error Message: "Free users can have a maximum of 1 goal. Upgrade to Personal Plan ($24.99/month) to create up to 3 goals."

### Personal Plan User  
- Current DB Record: `subscribed: true, subscription_tier: 'Personal Plan'`
- Goal Limit: 3
- Nudge Limit: 3
- Error Message: "Personal Plan users can have a maximum of 3 goals. Upgrade to Professional Plan ($199.99/month) to create up to 10 goals."

### Professional Plan User (Dan's Current Status)
- Current DB Record: `subscribed: true, subscription_tier: 'Professional Plan'`
- Goal Limit: 10
- Nudge Limit: 10  
- Error Message: "Professional Plan users can have a maximum of 10 goals. You currently have X goals."

### Pro Plan User (Legacy)
- Current DB Record: `subscribed: true, subscription_tier: 'Pro Plan'`
- Goal Limit: 10
- Nudge Limit: 10
- Error Message: "Pro Plan users can have a maximum of 10 goals. You currently have X goals."

### Strategic Advisor Plan User
- Current DB Record: `subscribed: true, subscription_tier: 'Strategic Advisor Plan'`
- Goal Limit: 10
- Nudge Limit: 10
- Error Message: "Strategic Advisor Plan users can have a maximum of 10 goals. You currently have X goals."