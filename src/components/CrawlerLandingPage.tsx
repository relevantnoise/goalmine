/**
 * Static Landing Page for Web Crawlers
 * 
 * This component provides immediate, SEO-optimized content for web crawlers
 * without any authentication dependencies, loading states, or JavaScript complexity.
 * 
 * Key Features:
 * - Zero loading delays
 * - No authentication dependencies 
 * - Static content for SEO
 * - Accessible structure
 */

import { ArrowRight, Target, Zap, Heart, CheckCircle, Star } from "lucide-react";

export const CrawlerLandingPage = () => {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
    "name": "GoalMine.ai",
    "description": "Turn your ambitions into action with a personalized, AI-powered daily goal tracker & motivator that's as committed to your success as you are.",
    "url": "https://goalmine.ai",
    "applicationCategory": "ProductivityApplication",
    "operatingSystem": "Web Browser",
    "offers": [
      {
        "@type": "Offer",
        "name": "Free Trial",
        "price": "0",
        "priceCurrency": "USD",
        "description": "30-day free trial with 1 active goal",
        "validFrom": "2024-01-01"
      },
      {
        "@type": "Offer", 
        "name": "Personal Plan",
        "price": "4.99",
        "priceCurrency": "USD",
        "description": "Up to 3 active goals with AI coaching",
        "validFrom": "2024-01-01"
      },
      {
        "@type": "Offer",
        "name": "Pro Plan", 
        "price": "199.99",
        "priceCurrency": "USD",
        "description": "Up to 5 goals plus monthly group Q&A",
        "validFrom": "2024-01-01"
      },
      {
        "@type": "Offer",
        "name": "Strategic Advisor Plan",
        "price": "950",
        "priceCurrency": "USD", 
        "description": "Everything in Pro Plan plus quarterly 1-on-1 coaching",
        "validFrom": "2024-01-01"
      }
    ],
    "author": {
      "@type": "Organization",
      "name": "GoalMine.ai"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "150"
    },
    "featureList": [
      "Personalized AI coaching",
      "Daily micro-plans",
      "Smart email reminders",
      "Progress tracking",
      "Multiple goal management",
      "Professional coaching available"
    ]
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How does the AI coaching work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Our AI analyzes your goal type, progress patterns, and chosen personality style to generate personalized motivation, micro-plans, and challenges. It adapts based on your consistency and feedback to provide increasingly effective support."
          }
        },
        {
          "@type": "Question", 
          "name": "Can I work on multiple goals at once?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! Personal Plan users can track up to 3 goals, while Pro Plan users can manage up to 5 goals simultaneously. Our system helps you balance progress across different life areas without overwhelming you."
          }
        },
        {
          "@type": "Question",
          "name": "How do daily emails and nudges work?",
          "acceptedAnswer": {
            "@type": "Answer", 
            "text": "You receive one powerful daily wake-up call each morning at 7 AM with fresh AI-generated motivation. Additionally, you can request instant 'nudges' throughout the day when you need extra motivation or guidance."
          }
        },
        {
          "@type": "Question",
          "name": "What types of goals work best with GoalMine.ai?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "GoalMine.ai excels with any goal requiring consistent daily action: fitness, learning, career development, business growth, creative projects, habit formation, and personal transformation. Our AI adapts to your specific goal type."
          }
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {/* Simple Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold">
                <span className="text-blue-500">Goal</span><span className="text-foreground">Mine.ai</span>
              </h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground">Pricing</a>
              <a href="/auth" className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
                Get Started
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-6 leading-tight">
            <span className="text-primary">Unearth your full potential with AI-powered motivation</span>
          </h1>
          
          <div className="text-6xl md:text-7xl font-bold tracking-tight mb-8">
            <span className="text-blue-500 font-semibold">Goal</span><span className="text-foreground">Mine.ai</span>
          </div>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Turn your ambitions into action with a personalized, AI-powered daily goal tracker & motivator 
            that's as committed to your success as you are.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <a 
              href="/auth" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-4 rounded-md flex items-center w-48 justify-center"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </a>
            <a 
              href="#pricing" 
              className="border border-border hover:bg-accent text-lg px-8 py-4 rounded-md flex items-center w-48 justify-center"
            >
              See Pricing
              <ArrowRight className="ml-2 w-5 h-5" />
            </a>
          </div>
          
          <p className="text-sm text-muted-foreground">
            30-day free trial with no credit card required • After the trial it's just $4.99/month for up to 3 goals
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to achieve your goals</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform adapts to your unique style and helps you build lasting habits.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-2xl p-8 border border-border shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Personalized Coaching</h3>
              <p className="text-muted-foreground leading-relaxed">
                Choose your motivation style: Drill Sergeant, Kind & Encouraging, Teammate, or Wise Mentor. 
                Your AI coach adapts to what works for you.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 border border-border shadow-sm">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Daily Micro-Plans</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get up to 3 actionable steps every day. Each takes under 5 minutes to complete, 
                making progress feel effortless and achievable.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 border border-border shadow-sm">
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-warning" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Smart Email Reminders</h3>
              <p className="text-muted-foreground leading-relaxed">
                Receive a powerful daily wake-up call at 7 AM with AI-generated motivation 
                that energizes your entire day and drives you to your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-6 py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-xl text-muted-foreground mb-12">Start your journey with a 30-day free trial</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Free Trial */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="text-xl font-bold mb-2">Free Trial</h3>
              <div className="text-3xl font-bold mb-4">$0<span className="text-sm text-muted-foreground">/30 days</span></div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2 flex-shrink-0" />
                  <span>1 active goal</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2 flex-shrink-0" />
                  <span>Daily AI motivation</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2 flex-shrink-0" />
                  <span>Email reminders</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2 flex-shrink-0" />
                  <span>1 daily nudge</span>
                </li>
              </ul>
              <a href="/auth" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-md inline-block text-sm text-center">
                Start Free Trial
              </a>
            </div>

            {/* Personal Plan */}
            <div className="bg-card rounded-2xl p-6 border-2 border-primary relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                  Most Popular
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2">Personal Plan</h3>
              <div className="text-3xl font-bold mb-4">$4.99<span className="text-sm text-muted-foreground">/month</span></div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2 flex-shrink-0" />
                  <span>Up to 3 active goals</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2 flex-shrink-0" />
                  <span>Daily AI motivation</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2 flex-shrink-0" />
                  <span>Priority email delivery</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2 flex-shrink-0" />
                  <span>3 daily nudges</span>
                </li>
              </ul>
              <a href="/auth" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-md inline-block text-sm text-center">
                Get Started
              </a>
            </div>

            {/* Pro Plan */}
            <div className="bg-card rounded-2xl p-6 border border-blue-600">
              <div className="text-blue-600 text-xs font-medium mb-2">POWER USER</div>
              <h3 className="text-xl font-bold mb-2">Pro Plan</h3>
              <div className="text-3xl font-bold mb-4">$199.99<span className="text-sm text-muted-foreground">/month</span></div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2 flex-shrink-0" />
                  <span>Up to 5 active goals</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2 flex-shrink-0" />
                  <span>5 daily nudges</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2 flex-shrink-0" />
                  <span>Monthly group Q&A</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>
              <a href="/auth" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md inline-block text-sm text-center">
                Upgrade Now
              </a>
            </div>

            {/* Strategic Advisor Plan */}
            <div className="bg-card rounded-2xl p-6 border border-green-600">
              <div className="text-green-600 text-xs font-medium mb-2">1-ON-1 COACHING</div>
              <h3 className="text-xl font-bold mb-2">Strategic Advisor</h3>
              <div className="text-3xl font-bold mb-4">$950<span className="text-sm text-muted-foreground">/month</span></div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2 flex-shrink-0" />
                  <span>Everything in Pro Plan</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2 flex-shrink-0" />
                  <span>Quarterly 1-on-1 coaching</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2 flex-shrink-0" />
                  <span>Strategic planning</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2 flex-shrink-0" />
                  <span>Executive guidance</span>
                </li>
              </ul>
              <a href="/auth" className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md inline-block text-sm text-center">
                Get Coaching
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How GoalMine.ai Works</h2>
          <p className="text-xl text-muted-foreground mb-12">
            Transform your ambitions into achievements with our proven 4-step process
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Set Your Goal</h3>
              <p className="text-muted-foreground">
                Define your objective with our intuitive goal creation wizard. Choose your target date and preferred coaching style.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-success">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Get AI Coaching</h3>
              <p className="text-muted-foreground">
                Receive personalized daily motivation, micro-plans, and challenges tailored to your goal and personality.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-warning">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Track Progress</h3>
              <p className="text-muted-foreground">
                Build momentum with daily check-ins and streak tracking. Watch your consistency compound into results.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-500">4</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Achieve Success</h3>
              <p className="text-muted-foreground">
                Celebrate milestones and maintain momentum as you transform your goals into lasting achievements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-6 py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose GoalMine.ai?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Unlike generic productivity apps, GoalMine.ai provides intelligent, personalized support for your unique journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="text-lg font-semibold mb-3">AI-Powered Personalization</h3>
              <p className="text-muted-foreground mb-4">
                Our advanced AI adapts to your personality, progress patterns, and preferences to deliver motivation that actually works for you.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 4 distinct coaching personalities</li>
                <li>• Progress-based content adaptation</li>
                <li>• Contextual micro-planning</li>
              </ul>
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="text-lg font-semibold mb-3">Science-Based Methodology</h3>
              <p className="text-muted-foreground mb-4">
                Built on proven behavioral psychology principles including habit stacking, micro-commitments, and positive reinforcement loops.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Habit formation research</li>
                <li>• Behavioral momentum principles</li>
                <li>• Cognitive load optimization</li>
              </ul>
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="text-lg font-semibold mb-3">Professional Coaching Available</h3>
              <p className="text-muted-foreground mb-4">
                Access to strategic advisory sessions with Dan Lynn, entrepreneur and Fortune 500 executive for advanced goal achievement.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• SMART goal development</li>
                <li>• Strategic business planning</li>
                <li>• Executive-level guidance</li>
              </ul>
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="text-lg font-semibold mb-3">Multi-Goal Management</h3>
              <p className="text-muted-foreground mb-4">
                Work on multiple life areas simultaneously with our intelligent goal balancing and prioritization system.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Up to 5 concurrent goals</li>
                <li>• Cross-goal momentum tracking</li>
                <li>• Intelligent prioritization</li>
              </ul>
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="text-lg font-semibold mb-3">Daily Motivation System</h3>
              <p className="text-muted-foreground mb-4">
                Never lose momentum with our comprehensive daily support system including emails, nudges, and progress insights.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Morning motivation emails</li>
                <li>• On-demand nudge system</li>
                <li>• Progress celebration</li>
              </ul>
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="text-lg font-semibold mb-3">Flexible & Affordable</h3>
              <p className="text-muted-foreground mb-4">
                Start free and scale up as needed, with plans ranging from personal goal tracking to professional strategic coaching.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 30-day free trial</li>
                <li>• No long-term contracts</li>
                <li>• Cancel anytime</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials/Use Cases Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Perfect for Every Goal Type</h2>
          <p className="text-xl text-muted-foreground mb-12">
            Whether you're building habits, advancing your career, or transforming your life, GoalMine.ai adapts to your needs.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card rounded-xl p-6 border border-border text-left">
              <h3 className="font-semibold mb-2">Health & Fitness</h3>
              <p className="text-sm text-muted-foreground">
                "Lost 25 pounds with daily micro-workouts and nutrition nudges. The AI coach kept me motivated even on tough days."
              </p>
            </div>
            
            <div className="bg-card rounded-xl p-6 border border-border text-left">
              <h3 className="font-semibold mb-2">Career Development</h3>
              <p className="text-sm text-muted-foreground">
                "Landed my dream promotion by breaking down skill-building into daily 10-minute learning sessions. Game changer."
              </p>
            </div>
            
            <div className="bg-card rounded-xl p-6 border border-border text-left">
              <h3 className="font-semibold mb-2">Business Growth</h3>
              <p className="text-sm text-muted-foreground">
                "Grew my side business to $10K/month using the strategic planning sessions and daily action nudges."
              </p>
            </div>
            
            <div className="bg-card rounded-xl p-6 border border-border text-left">
              <h3 className="font-semibold mb-2">Learning & Skills</h3>
              <p className="text-sm text-muted-foreground">
                "Became fluent in Spanish in 6 months with personalized daily practice plans and streak motivation."
              </p>
            </div>
            
            <div className="bg-card rounded-xl p-6 border border-border text-left">
              <h3 className="font-semibold mb-2">Personal Projects</h3>
              <p className="text-sm text-muted-foreground">
                "Finally finished writing my novel! The daily writing nudges and progress tracking made all the difference."
              </p>
            </div>
            
            <div className="bg-card rounded-xl p-6 border border-border text-left">
              <h3 className="font-semibold mb-2">Life Transformation</h3>
              <p className="text-sm text-muted-foreground">
                "Completely changed my daily routine and mindset. Working on 3 goals simultaneously has accelerated my growth."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-6 py-16 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about GoalMine.ai
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-semibold mb-2">How does the AI coaching work?</h3>
              <p className="text-muted-foreground">
                Our AI analyzes your goal type, progress patterns, and chosen personality style to generate personalized motivation, 
                micro-plans, and challenges. It adapts based on your consistency and feedback to provide increasingly effective support.
              </p>
            </div>
            
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-semibold mb-2">Can I work on multiple goals at once?</h3>
              <p className="text-muted-foreground">
                Yes! Personal Plan users can track up to 3 goals, while Pro Plan users can manage up to 5 goals simultaneously. 
                Our system helps you balance progress across different life areas without overwhelming you.
              </p>
            </div>
            
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-semibold mb-2">What's included in the Strategic Advisor Plan?</h3>
              <p className="text-muted-foreground">
                Strategic Advisor Plan includes everything from Pro Plan plus quarterly 1-on-1 coaching sessions with Dan Lynn, 
                a successful entrepreneur and Fortune 500 executive. Sessions focus on strategic goal planning, business execution, 
                and executive-level guidance tailored to your specific challenges.
              </p>
            </div>
            
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-semibold mb-2">How do daily emails and nudges work?</h3>
              <p className="text-muted-foreground">
                You receive one powerful daily wake-up call each morning at 7 AM with fresh AI-generated motivation. 
                Additionally, you can request instant "nudges" throughout the day when you need extra motivation or guidance.
              </p>
            </div>
            
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-semibold mb-2">Is there a long-term commitment?</h3>
              <p className="text-muted-foreground">
                No! Start with a 30-day free trial, then continue month-to-month. You can cancel anytime and keep access 
                until the end of your billing period. No contracts or cancellation fees.
              </p>
            </div>
            
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-semibold mb-2">What types of goals work best with GoalMine.ai?</h3>
              <p className="text-muted-foreground">
                GoalMine.ai excels with any goal requiring consistent daily action: fitness, learning, career development, 
                business growth, creative projects, habit formation, and personal transformation. Our AI adapts to your specific goal type.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Goals into Achievements?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of motivated individuals who are already achieving more with AI-powered goal tracking and motivation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <a 
              href="/auth" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-4 rounded-md flex items-center w-64 justify-center"
            >
              Start Your Free 30-Day Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </a>
          </div>
          
          <p className="text-sm text-muted-foreground">
            No credit card required • 30-day free trial • Cancel anytime • Get started in under 2 minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">
              <span className="text-blue-500">Goal</span><span className="text-foreground">Mine.ai</span>
            </h3>
            <p className="text-muted-foreground mb-4">
              Turn your ambitions into action with personalized AI-powered motivation.
            </p>
            <p className="text-sm text-muted-foreground">
              © 2024 GoalMine.ai. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};