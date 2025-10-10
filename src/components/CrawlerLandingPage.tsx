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
  return (
    <div className="min-h-screen bg-background">
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
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-8">
            <span className="text-blue-500 font-semibold">Goal</span><span className="text-foreground">Mine.ai</span>
          </h1>
          
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-6 leading-tight">
            <span className="text-primary">Unearth your full potential</span><br />
            with AI-powered motivation
          </h2>
          
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
                Receive daily motivational emails at 7 AM with fresh content tailored to your goals 
                and current progress streak.
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
          
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* Free Trial */}
            <div className="bg-card rounded-2xl p-8 border border-border">
              <h3 className="text-2xl font-bold mb-2">Free Trial</h3>
              <div className="text-4xl font-bold mb-4">$0<span className="text-lg text-muted-foreground">/30 days</span></div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success mr-3" />
                  <span>1 active goal</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success mr-3" />
                  <span>Daily AI motivation</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success mr-3" />
                  <span>Email reminders</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success mr-3" />
                  <span>1 daily nudge</span>
                </li>
              </ul>
              <a href="/auth" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-6 rounded-md inline-block">
                Start Free Trial
              </a>
            </div>

            {/* Premium */}
            <div className="bg-card rounded-2xl p-8 border-2 border-primary relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Personal Plan</h3>
              <div className="text-4xl font-bold mb-4">$4.99<span className="text-lg text-muted-foreground">/month</span></div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success mr-3" />
                  <span>Up to 3 active goals</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success mr-3" />
                  <span>Daily AI motivation</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success mr-3" />
                  <span>Priority email delivery</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success mr-3" />
                  <span>3 daily nudges</span>
                </li>
              </ul>
              <a href="/auth" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-6 rounded-md inline-block">
                Get Started
              </a>
            </div>
          </div>
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