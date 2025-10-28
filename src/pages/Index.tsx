import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useGoals } from "@/hooks/useGoals";
import { useNudgeLimit } from "@/hooks/useNudgeLimit";
import { useCircleFramework } from "@/hooks/useCircleFramework";
import { supabase } from "@/integrations/supabase/client";
// Ensure Firebase bundled version is loaded
import "@/lib/firebase";
import { LandingPage } from "@/components/LandingPage";
import { PricingPage } from "@/components/PricingPage";
import { EmailCollector } from "@/components/EmailCollector";
import { OnboardingForm } from "@/components/OnboardingForm";
import { SimpleGoalForm } from "@/components/SimpleGoalForm";
import { Dashboard } from "@/components/Dashboard";
import { ProfessionalCircleSetup } from "@/components/ProfessionalCircleSetup";
import { FiveCircleFrameworkReport } from "@/components/FiveCircleFrameworkReport";
import { FiveCircleGoalWorkshop } from "@/components/FiveCircleGoalWorkshop";
import { WeeklyCircleCheckin } from "@/components/WeeklyCircleCheckin";
import { MotivationAlert } from "@/components/MotivationAlert";
import { TrialExpiredModal } from "@/components/TrialExpiredModal";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { CrawlerLandingPage } from "@/components/CrawlerLandingPage";
import { CanonicalHead } from "@/components/CanonicalHead";
import { isCrawler, logCrawlerDetection } from "@/utils/crawlerDetection";

const Index = () => {
  // CRAWLER OPTIMIZATION: Return immediate static content for web crawlers
  // This bypasses all authentication, loading states, and dynamic functionality
  // to provide instant SEO-friendly content
  if (isCrawler()) {
    logCrawlerDetection();
    return <CrawlerLandingPage />;
  }

  // Version check log
  
  const { user, firebaseUser, isAuthenticated, loading: authLoading } = useAuth();
  const { subscription } = useSubscription();
  const { trialStatus, loading: trialLoading } = useTrialStatus();
  const { goals, loading: goalsLoading, fetchGoals, generateMotivationForGoals, generateGoalSpecificNudge, generateGeneralNudge } = useGoals();
  const { nudgeStatus, useNudge, loading: nudgeLoading } = useNudgeLimit();
  const { framework, hasFramework, loading: frameworkLoading, refetchFramework } = useCircleFramework();
  const navigate = useNavigate();
  const location = useLocation();
  // No need for custom supabase client with native auth
  const [searchParams] = useSearchParams();
  const [currentView, setCurrentView] = useState<'landing' | 'pricing' | 'email' | 'five-circle-onboarding' | 'framework-report' | 'goal-workshop' | 'dashboard' | 'circle-checkin'>('landing');
  const [userEmail, setUserEmail] = useState<string>('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertData, setAlertData] = useState<{title: string, message: string, type?: 'motivation' | 'nudge' | 'achievement' | 'upgrade'}>({title: '', message: ''});
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const hasInitialized = useRef(false);
  const isCompletingOnboarding = useRef(false);
  
  // Trial enforcement effect
  useEffect(() => {
    if (user && !trialLoading && !subscription.subscribed) {
      // Check if trial has expired and show modal
      if (trialStatus.isTrialExpired) {
        setShowTrialModal(true);
      } else if (trialStatus.daysRemaining <= 3 && trialStatus.daysRemaining > 0) {
        // Show warning for last 3 days
        setShowTrialModal(true);
      }
    }
  }, [user, trialStatus, subscription.subscribed, trialLoading]);

  // Initialize view based on user state and goals
  useEffect(() => {

    // Force reset if we're stuck - check URL params for reset or dashboard view
    const forceReset = searchParams.get('reset') === 'true';
    const forceDashboard = searchParams.get('force-dashboard') === 'true' || location.pathname === '/dashboard';
    const forceOnboarding = searchParams.get('force-onboarding') === 'true';
    const checkinRequest = searchParams.get('checkin') === 'true';
    const checkinUser = searchParams.get('user'); // Email from check-in link
    const checkinGoal = searchParams.get('goal'); // Goal ID from check-in link
    const forceHome = searchParams.get('home') === 'true';
    // DEBUG: Log all URL parameters
    
    // SIMPLE: If user completed email verification, go directly to onboarding
    if (verified && !isRedirecting) {
      hasInitialized.current = true;
      setCurrentView('onboarding');
      navigate('/', { replace: true });
      return;
    }

    // WORKAROUND: If Firebase still sends users to /?email-verified=true, redirect to our verification page
    if (emailVerified && !isRedirecting) {
      console.log('📧 CRITICAL: email-verified parameter detected!');
      console.log('📧 Current URL:', window.location.href);
      console.log('📧 Search params:', Object.fromEntries(searchParams.entries()));
      console.log('📧 About to navigate to /verify-email');
      setIsRedirecting(true);
      navigate('/verify-email', { replace: true });
      return;
    }
    
    if (forceReset) {
      setCurrentView('landing');
      hasInitialized.current = false;
      // Clear the reset param
      navigate('/', { replace: true });
      return;
    }
    
    if (forceDashboard && user) {
      hasInitialized.current = true;
      setCurrentView('dashboard');
      // Clear the force-dashboard param
      navigate('/', { replace: true });
      
      // For danlynn@gmail.com, we'll let the Dashboard component handle the temporary goals display
      // since the RLS/JWT issue prevents normal goal loading
      return;
    }

    if (forceOnboarding) {
      hasInitialized.current = true;
      setCurrentView('onboarding');
      // Clear the force-onboarding param
      navigate('/', { replace: true });
      return;
    }

    // Handle force home request - show landing page regardless of authentication
    if (forceHome) {
      hasInitialized.current = true;
      setCurrentView('landing');
      // Clear the home param
      navigate('/', { replace: true });
      return;
    }

    
    // Handle check-in request from email links
    if (checkinRequest) {
      console.log('📧 Check-in request from email link', { 
        checkinUser, 
        checkinGoal, 
        currentUser: user?.email,
        firebaseEmail: firebaseUser?.email 
      });
      
      if (user && !authLoading && !goalsLoading) {
        // Check if the logged-in user matches the user from the email link
        // Use Firebase user email as the authoritative source since that's what emails are sent to
        const userEmail = firebaseUser?.email || user?.email;
        if (checkinUser && userEmail !== checkinUser) {
          console.log('⚠️ User mismatch! Email link for:', checkinUser, 'but logged in as:', userEmail);
          console.log('📧 Profile email:', user.email, 'Firebase email:', firebaseUser?.email);
          // Store the intended check-in info and redirect to auth
          sessionStorage.setItem('checkinUser', checkinUser);
          if (checkinGoal) sessionStorage.setItem('checkinGoal', checkinGoal);
          const mismatchMessage = `This check-in link is for ${checkinUser}. Please log in with the correct account.`;
          sessionStorage.setItem('checkinMessage', mismatchMessage);
          navigate('/auth', { replace: true });
          return;
        }
        
        // Authenticated user clicking check-in link - ALWAYS go to dashboard
        // Even if they have 0 active goals (due to limit enforcement), they should see their dashboard
        console.log('✅ Authenticated user check-in - forcing dashboard view (bypass goal count check)');
        hasInitialized.current = true;
        setCurrentView('dashboard');
        navigate('/', { replace: true });
        return;
      } else if (!user && !authLoading) {
        // Unauthenticated user clicking check-in link - go to auth page
        console.log('🔐 Unauthenticated check-in request - redirecting to auth');
        console.log('📧 Check-in link for:', checkinUser, 'Goal:', checkinGoal);
        // Store the check-in info for after authentication
        if (checkinUser) sessionStorage.setItem('checkinUser', checkinUser);
        if (checkinGoal) sessionStorage.setItem('checkinGoal', checkinGoal);
        const checkinMessage = checkinUser 
          ? `Please log in as ${checkinUser} to complete your check-in from the email link.`
          : "Please log in to complete your check-in from the email link.";
        sessionStorage.setItem('checkinMessage', checkinMessage);
        navigate('/auth', { replace: true });
        return;
      }
      // If still loading, continue with normal flow and let it resolve
    }

    // 3-STEP ROUTING: If user is authenticated and on root path, route based on framework and goals
    if (location.pathname === '/' && user && !authLoading && !goalsLoading && !frameworkLoading && !hasInitialized.current) {
      console.log('🎯 3-STEP USER ROUTING for:', user.email);
      console.log('🔄 Framework found:', hasFramework);
      console.log('🔄 Goals found:', goals.length);
      hasInitialized.current = true;
      
      // Check-in request always goes to dashboard
      if (checkinRequest) {
        console.log('📧 Check-in request → Dashboard');
        setCurrentView('dashboard');
        return;
      }
      
      // STEP 1: If no framework, start with Simple Circle Framework setup
      if (!hasFramework) {
        console.log('📝 No framework found → Step 1: Simple Circle Framework setup');
        setUserEmail(user.email || '');
        setCurrentView('five-circle-onboarding');
        return;
      }
      
      // STEP 2: If framework exists but no goals, go to goal creation
      if (hasFramework && goals.length === 0) {
        console.log('📝 Framework exists, no goals → Step 2: Goal creation');
        setCurrentView('onboarding');
        return;
      }
      
      // STEP 3: If framework and goals exist, show dashboard
      if (hasFramework && goals.length > 0) {
        console.log('✅ Framework and goals exist → Step 3: Dashboard');
        setCurrentView('dashboard');
        return;
      }
      
      return;
    }

    // If no user and auth is complete, show landing (only on root path)
    if (location.pathname === '/' && !user && !authLoading && !hasInitialized.current) {
      hasInitialized.current = true;
      setCurrentView('landing');
      console.log('🏠 No user on root path, showing landing page');
      return;
    }
    
    // DEBUG: Log current state
    console.log('🔍 Current state check:', {
      hasUser: !!user,
      authLoading,
      hasInitialized: hasInitialized.current,
      currentView,
      firebaseUser: !!firebaseUser,
      isAuthenticated
    });
  }, [user, firebaseUser, isAuthenticated, authLoading, searchParams, navigate, supabase, fetchGoals, generateMotivationForGoals, subscription]);

  // Remove the debug logging that might cause re-renders
  // useEffect(() => {
  //   console.log('📍 Current view changed to:', currentView);
  // }, [currentView]);


  const handleEmailSubmit = (email: string) => {
    setUserEmail(email);
    // Universal 6 Elements of Life onboarding for all users
    setCurrentView('five-circle-onboarding');
  };

  const handleOnboardingComplete = async (goalId?: string) => {
    if (!user) return;

    console.log('✅ Onboarding complete, redirecting to dashboard');
    hasInitialized.current = true; // Mark as initialized to prevent re-routing
    
    // ✅ Simple success flow - goal already created and added to state optimistically
    if (goalId) {
      // Show premium success modal
      setAlertData({
        title: "🎯 Goal Created!",
        message: "Your goal is ready! You'll receive your powerful daily wake-up call starting tomorrow.",
        type: 'achievement'
      });
      setShowAlert(true);
    }
    
    // ✅ Switch to dashboard - goals should already be visible
    setCurrentView('dashboard');
    
    // Scroll to top for clean dashboard experience
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // ✅ No need for fetchGoals - already updated optimistically in createGoal
    // ✅ No need for complex background operations
  };


  const handleFiveCircleComplete = () => {
    console.log('✅ Step 1 Complete: 6 Elements of Life setup → Step 2: Goal creation');
    hasInitialized.current = true;
    
    // Refresh framework data to ensure hasFramework is updated
    refetchFramework();
    
    // Move directly to Step 2: Goal creation (not framework report)
    setCurrentView('onboarding');
    
    // Scroll to top for clean goal creation experience
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Show success message
    setAlertData({
      title: "🎯 Step 1 Complete!",
      message: "Your 6 Elements of Life™ is ready! Now let's create your first goal.",
      type: 'achievement'
    });
    setShowAlert(true);
  };

  const handleGoalWorkshopComplete = (goals: any[]) => {
    console.log('✅ Goal workshop complete, created', goals.length, 'goals');
    hasInitialized.current = true;
    setCurrentView('dashboard');
    
    // Scroll to top for clean dashboard experience
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Show completion message
    setAlertData({
      title: "🎉 Goals Created Successfully!",
      message: `${goals.length} goal${goals.length !== 1 ? 's' : ''} created! Your 6 Elements journey begins now.`,
      type: 'achievement'
    });
    setShowAlert(true);
    
    // Refresh goals in background to show new ones
    fetchGoals();
  };

  const handleNudgeMe = async () => {
    console.log('🎯 Nudge attempt:', {
      currentCount: nudgeStatus.currentCount,
      maxNudges: nudgeStatus.maxNudges,
      remaining: nudgeStatus.remaining,
      atLimit: nudgeStatus.atLimit,
      userSubscribed: nudgeStatus.userSubscribed
    });

    // Check if user is already at limit
    if (nudgeStatus.atLimit) {
      console.log('🚫 Nudge limit reached, showing upgrade message');
      setAlertData({
        title: 'Daily Nudge Limit Reached',
        message: nudgeStatus.userSubscribed 
          ? 'You\'ve reached your daily nudge limit of 3.'
          : 'You get 1 free nudge per day, but you can upgrade to get up to 3 nudges daily!',
        type: 'upgrade'
      });
      setShowAlert(true);
      return null;
    }
    
    // Try to use a nudge (server-side validation)
    const nudgeResult = await useNudge();
    
    if (!nudgeResult.success) {
      console.log('🚫 Server rejected nudge:', nudgeResult.error);
      setAlertData({
        title: 'Daily Nudge Limit Reached',
        message: nudgeResult.error || 'Unable to send nudge at this time.',
        type: 'upgrade'
      });
      setShowAlert(true);
      return null;
    }
    
    // Generate universal motivational nudge that works for all users
    // Always use universal nudge system regardless of goal count
    const motivationContent = await generateGeneralNudge();
    
    if (motivationContent) {
      // Show motivation content in a prominent modal alert
      setAlertData({
        title: "🚀 Instant Motivation Boost!",
        message: motivationContent.message,
        type: 'nudge'
      });
      setShowAlert(true);
      
      return motivationContent;
    } else {
      // Fallback alert if generation fails
      setAlertData({
        title: "🚀 Keep Going!",
        message: "Every small step counts! You've got this - keep moving forward on your journey.",
        type: 'nudge'
      });
      setShowAlert(true);
      
      return null;
    }
  };

  const handleEditFramework = () => {
    console.log('🔧 Navigating to Edit Framework page');
    navigate('/edit-framework');
  };

  const handleCircleCheckin = () => {
    console.log('📊 Starting weekly circle check-in');
    hasInitialized.current = true;
    setCurrentView('circle-checkin');
  };

  const handleCircleCheckinComplete = () => {
    console.log('✅ Circle check-in completed, returning to dashboard');
    setCurrentView('dashboard');
    
    // Show success message
    setAlertData({
      title: "🎯 Circle Check-in Complete!",
      message: "Your weekly circle balance has been recorded. Keep up the great work!",
      type: 'achievement'
    });
    setShowAlert(true);
  };

  const handleStartOver = async () => {
    if (!user) return;

    // Get fresh data from database
    const userId = user.email || user.id;
    
    // Get fresh goal count
    const { data: goalsData } = await supabase.functions.invoke('fetch-user-goals', {
      body: { user_id: userId }
    });
    
    // Get fresh subscription status
    const { data: subData } = await supabase.functions.invoke('check-subscription', {
      body: { userId, email: user.email }
    });
    
    const freshGoalCount = goalsData?.success ? goalsData.goals.length : goals.length;
    const isSubscribed = subData?.subscribed || false;
    
    // Determine max goals based on subscription tier (matches create-goal function logic)
    const getMaxGoals = (subscription) => {
      if (!subscription?.subscribed) return 1; // Free users
      
      const tier = subscription.subscription_tier;
      if (tier === 'Pro Plan') return 5;
      if (tier === 'Strategic Advisor Plan') return 5;
      if (tier === 'Professional Coach') return 5; // Legacy tier
      return 3; // Personal Plan (default for subscribed users)
    };
    
    const maxGoals = getMaxGoals(subData || { subscribed: false });
    
    console.log('🎯 Fresh limit check:', { 
      freshGoalCount, 
      maxGoals, 
      isSubscribed,
      subData
    });
    
    if (freshGoalCount >= maxGoals) {
      // Show appropriate message based on subscription
      if (isSubscribed) {
        setAlertData({
          title: '🎯 Maximum Goals Reached',
          message: `You have ${freshGoalCount} of ${maxGoals} goals. Delete an existing goal to create a new one.`,
          type: 'upgrade'
        });
      } else {
        setAlertData({
          title: '🎯 Upgrade to Create More Goals',
          message: 'Free users can have 1 goal. Upgrade to Personal Plan for up to 3 goals.',
          type: 'upgrade'
        });
      }
      setShowAlert(true);
      return;
    }

    // 3-STEP LOGIC: Check framework status to determine next step
    console.log('🎯 3-Step routing check:', { hasFramework });
    
    if (hasFramework) {
      // User has framework → Step 3: Direct goal creation ("Add More Goals")
      console.log('📝 Framework exists → Direct goal creation');
      setCurrentView('onboarding');
    } else {
      // User has no framework → Step 1: Framework setup first
      console.log('📝 No framework → Step 1: Framework setup');
      setCurrentView('five-circle-onboarding');
    }
    
    // Scroll to top when showing goal creation form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Also refresh the local state for dashboard consistency
    await fetchGoals();
  };

  // Show loading screen while checking authentication - SIMPLIFIED
  const forceDashboard = searchParams.get('force-dashboard') === 'true';
  const emailVerified = searchParams.get('email-verified') === 'true';
  const verified = searchParams.get('verified') === 'true';
  const shouldShowLoading = (authLoading || (user && (goalsLoading || frameworkLoading) && !hasInitialized.current) || isRedirecting || emailVerified) && !forceDashboard;
  
  // Remove debug logging in production
  // console.log('🔍 Loading state check:', {
  //   authLoading, user: !!user, goalsLoading, hasInitialized: hasInitialized.current,
  //   minLoadingComplete, forceDashboard, shouldShowLoading
  // });
  
  if (shouldShowLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Dream Big</p>
        </div>
      </div>
    );
  }

  // Only render Index component content on root path - other routes should handle themselves
  if (location.pathname !== '/') {
    console.log('🔀 Non-root path detected:', location.pathname, 'Index.tsx not rendering');
    // Reset initialization flag so user can return to dashboard later
    hasInitialized.current = false;
    return null;
  }

  if (currentView === 'landing') {
    // Show loading briefly while determining which landing page version to show
    if (authLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }

    return (
      <LandingPage 
        onGetStarted={async () => {
          if (user) {
            // Skip all database checks and go to universal 5 Circle onboarding
            console.log('User authenticated, going to 6 Elements onboarding');
            setUserEmail(user.email || '');
            setCurrentView('five-circle-onboarding');
          } else {
            navigate('/auth');
          }
        }}
        onSeePricing={() => setCurrentView('pricing')}
        onGoToDashboard={() => setCurrentView('dashboard')}
      />
    );
  }

  if (currentView === 'pricing') {
    console.log('💰 Rendering pricing page');
    return (
      <PricingPage 
        onStartTrial={async () => {
          if (user) {
            try {
              console.log('🚀 Starting trial - checking for existing goals');
              
              // Fetch fresh goals data to check current state
              const { data: freshGoals, error } = await supabase
                .from('goals')
                .select('*')
                .eq('user_id', user.id.toString())
                .eq('is_active', true)
                .order('created_at', { ascending: false });
              
              if (error) {
                console.error('Error fetching goals:', error);
                return;
              }
              
              const userGoals = (freshGoals || []);
              console.log('Fresh goals found:', userGoals.length);
              
              if (userGoals.length > 0) {
                // User has goals, go to dashboard
                console.log('User has existing goals, going to dashboard');
                setCurrentView('dashboard');
                await fetchGoals();
                await generateMotivationForGoals();
              } else {
                // No goals, start 5 Circle onboarding
                console.log('No goals found, starting 6 Elements onboarding');
                setUserEmail(user.email || '');
                setCurrentView('five-circle-onboarding');
              }
            } catch (error) {
              console.error('Error in onStartTrial:', error);
            }
          } else {
            // Not authenticated, redirect to auth page
            window.location.href = '/auth';
          }
        }}
        onBack={() => {
          console.log('⬅️ Going back to landing from pricing');
          setCurrentView('landing');
        }}
      />
    );
  }

  if (currentView === 'email') {
    // If user is authenticated, skip email collection
    if (user) {
      setUserEmail(user.email || '');
      // Universal 6 Elements of Life onboarding for all users
      setCurrentView('five-circle-onboarding');
      return null;
    }
    return (
      <EmailCollector 
        onEmailSubmit={handleEmailSubmit}
        onBack={() => setCurrentView('landing')}
      />
    );
  }

  if (currentView === 'onboarding') {
    return (
      <SimpleGoalForm 
        onComplete={handleOnboardingComplete}
        onCancel={() => {
          console.log('🔙 Cancel button pressed, returning to landing');
          setCurrentView('landing');
          hasInitialized.current = false;
        }}
      />
    );
  }


  if (currentView === 'five-circle-onboarding') {
    return (
      <ProfessionalCircleSetup 
        onComplete={handleFiveCircleComplete}
        onBack={() => {
          console.log('🔙 Going back from 6 Elements setup to dashboard');
          setCurrentView('dashboard');
        }}
      />
    );
  }

  if (currentView === 'framework-report') {
    const storedAnalysis = sessionStorage.getItem('frameworkAnalysis');
    const analysis = storedAnalysis ? JSON.parse(storedAnalysis) : null;
    
    if (!analysis) {
      // Fallback if no analysis found
      setCurrentView('goal-workshop');
      return null;
    }
    
    return (
      <FiveCircleFrameworkReport 
        analysis={analysis}
        onContinue={() => {
          console.log('📋 Moving from framework report to goal workshop');
          setCurrentView('goal-workshop');
        }}
      />
    );
  }

  if (currentView === 'goal-workshop') {
    return (
      <FiveCircleGoalWorkshop 
        onComplete={handleGoalWorkshopComplete}
        onBack={() => {
          console.log('🔙 Going back from goal workshop to framework report');
          setCurrentView('framework-report');
        }}
      />
    );
  }

  if (currentView === 'dashboard') {
    console.log('🎯 Rendering dashboard view');
    console.log('🔍 Trial status check:', {
      subscribed: subscription.subscribed,
      isTrialExpired: trialStatus.isTrialExpired,
      daysRemaining: trialStatus.daysRemaining
    });
    
    // Skip trial check for new users (they should get 30 days automatically)
    // Only block access if trial expired AND not subscribed AND user has been around long enough
    const shouldBlockForTrial = !subscription.subscribed && 
                               trialStatus.isTrialExpired && 
                               trialStatus.daysRemaining <= 0;
    
    if (shouldBlockForTrial) {
      console.log('🚫 Blocking dashboard access due to expired trial');
      return (
        <>
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center max-w-md mx-auto p-6">
              <div className="w-16 h-16 bg-premium-light rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-premium" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Free Trial Expired</h1>
              <p className="text-muted-foreground mb-6">
                Your 30-day free trial has ended. Upgrade to continue accessing your goals and daily motivation.
              </p>
              <Button 
                onClick={() => setShowTrialModal(true)}
                className="bg-premium hover:bg-premium/90 w-full"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Personal Plan
              </Button>
            </div>
          </div>
          <TrialExpiredModal
            isOpen={showTrialModal}
            onClose={() => setShowTrialModal(false)}
            daysRemaining={trialStatus.daysRemaining}
          />
        </>
      );
    }

    return (
      <>
        <CanonicalHead 
          title="GoalMine.ai - Your Personal Goal Achievement Dashboard"
          description="Track your goals with AI-powered daily motivation. Check in daily, build streaks, and achieve your dreams with personalized coaching."
        />
        <Dashboard
          onNudgeMe={handleNudgeMe}
          onStartOver={handleStartOver}
          onLogoClick={() => {
            // Navigate to landing page using React state, not page reload
            setCurrentView('landing');
          }}
          hasFramework={hasFramework}
          onEditFramework={handleEditFramework}
          onCircleCheckin={handleCircleCheckin}
        />
        {showAlert && (
          <MotivationAlert
            title={alertData.title}
            message={alertData.message}
            type={alertData.type}
            onDismiss={() => setShowAlert(false)}
          />
        )}
        <TrialExpiredModal
          isOpen={showTrialModal}
          onClose={() => setShowTrialModal(false)}
          daysRemaining={trialStatus.daysRemaining}
        />
      </>
    );
  }

  if (currentView === 'circle-checkin') {
    return (
      <WeeklyCircleCheckin 
        onComplete={handleCircleCheckinComplete}
        onSkip={() => {
          console.log('⏭️ Skipping weekly circle check-in');
          setCurrentView('dashboard');
        }}
      />
    );
  }

  return null;
};

export default Index;