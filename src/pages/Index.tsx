import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useGoals } from "@/hooks/useGoals";
import { useNudgeLimit } from "@/hooks/useNudgeLimit";
import { supabase } from "@/integrations/supabase/client";
// Ensure Firebase bundled version is loaded
import "@/lib/firebase";
import { LandingPage } from "@/components/LandingPage";
import { PricingPage } from "@/components/PricingPage";
import { EmailCollector } from "@/components/EmailCollector";
import { OnboardingForm } from "@/components/OnboardingForm";
import { SimpleGoalForm } from "@/components/SimpleGoalForm";
import { Dashboard } from "@/components/Dashboard";
import { MotivationAlert } from "@/components/MotivationAlert";
import { TrialExpiredModal } from "@/components/TrialExpiredModal";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";

const Index = () => {
  // Version check log
  console.log('🔥 Index component loaded - using bundled Firebase v2');
  
  const { user, firebaseUser, isAuthenticated, loading: authLoading } = useAuth();
  const { subscription } = useSubscription();
  const { trialStatus, loading: trialLoading } = useTrialStatus();
  const { goals, loading: goalsLoading, fetchGoals, generateMotivationForGoals, generateGeneralNudge } = useGoals();
  const { nudgeStatus, useNudge, loading: nudgeLoading } = useNudgeLimit();
  const navigate = useNavigate();
  const location = useLocation();
  // No need for custom supabase client with native auth
  const [searchParams] = useSearchParams();
  const [currentView, setCurrentView] = useState<'landing' | 'pricing' | 'email' | 'onboarding' | 'dashboard'>('landing');
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
    console.log('🔍 View initialization effect triggered:', {
      user: !!user,
      firebaseUser: !!firebaseUser,
      isAuthenticated,
      userId: user?.id,
      firebaseUid: firebaseUser?.uid,
      authLoading,
      goalsLoading,
      hasInitialized: hasInitialized.current,
      forceReset: searchParams.get('reset') === 'true',
      currentView,
      pathname: location.pathname
    });

    // Force reset if we're stuck - check URL params for reset or dashboard view
    const forceReset = searchParams.get('reset') === 'true';
    const forceDashboard = searchParams.get('force-dashboard') === 'true' || location.pathname === '/dashboard';
    const forceOnboarding = searchParams.get('force-onboarding') === 'true';
    const checkinRequest = searchParams.get('checkin') === 'true';
    const checkinUser = searchParams.get('user'); // Email from check-in link
    const checkinGoal = searchParams.get('goal'); // Goal ID from check-in link
    const forceHome = searchParams.get('home') === 'true';
    // DEBUG: Log all URL parameters
    console.log('🔍 URL Search Parameters:', {
      emailVerified,
      allParams: Object.fromEntries(searchParams.entries()),
      currentURL: window.location.href
    });
    
    // SIMPLE: If user completed email verification, go directly to onboarding
    if (verified && !isRedirecting) {
      console.log('📧 Email verification completed - going to goal creation!');
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
      console.log('🔄 Force reset triggered');
      setCurrentView('landing');
      hasInitialized.current = false;
      // Clear the reset param
      navigate('/', { replace: true });
      return;
    }
    
    if (forceDashboard && user) {
      console.log('🎯 Force dashboard view triggered from Continue button');
      hasInitialized.current = true;
      setCurrentView('dashboard');
      // Clear the force-dashboard param
      navigate('/', { replace: true });
      
      // For danlynn@gmail.com, we'll let the Dashboard component handle the temporary goals display
      // since the RLS/JWT issue prevents normal goal loading
      console.log('🎯 Dashboard will handle goal display with temporary fix');
      return;
    }

    if (forceOnboarding) {
      console.log('🎯 Force onboarding view triggered from email verification');
      hasInitialized.current = true;
      setCurrentView('onboarding');
      // Clear the force-onboarding param
      navigate('/', { replace: true });
      return;
    }

    // Handle force home request - show landing page regardless of authentication
    if (forceHome) {
      console.log('🏠 Force home view triggered from logo click');
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

    // SIMPLE ROUTING: If user is authenticated and on root path, route based on goals
    if (location.pathname === '/' && user && !authLoading && !goalsLoading && !hasInitialized.current) {
      console.log('🎯 SIMPLE USER ROUTING for:', user.email);
      console.log('🔄 Goals found:', goals.length);
      hasInitialized.current = true;
      
      // Check-in request always goes to dashboard
      if (checkinRequest) {
        console.log('📧 Check-in request → Dashboard');
        setCurrentView('dashboard');
        return;
      }
      
      // SIMPLE LOGIC: No goals = Onboarding (goal creation), Has goals = Dashboard
      if (goals.length === 0) {
        console.log('📝 No goals found → Onboarding (Goal Creation)');
        setUserEmail(user.email || '');
        setCurrentView('onboarding');
      } else {
        console.log('✅', goals.length, 'goals found → Dashboard');
        setCurrentView('dashboard');
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
  }, [user, firebaseUser, isAuthenticated, authLoading, searchParams, navigate, supabase, fetchGoals, generateMotivationForGoals]);

  // Remove the debug logging that might cause re-renders
  // useEffect(() => {
  //   console.log('📍 Current view changed to:', currentView);
  // }, [currentView]);


  const handleEmailSubmit = (email: string) => {
    setUserEmail(email);
    setCurrentView('onboarding');
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
        message: "Your goal is ready! You'll receive daily motivational emails starting tomorrow.",
        type: 'achievement'
      });
      setShowAlert(true);
    }
    
    // ✅ Switch to dashboard - goals should already be visible
    setCurrentView('dashboard');
    
    // ✅ No need for fetchGoals - already updated optimistically in createGoal
    // ✅ No need for complex background operations
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
    
    // Generate a general motivational nudge (not goal-specific)
    const generalNudge = await generateGeneralNudge();
    
    if (generalNudge) {
      // Show motivation content in a prominent modal alert
      setAlertData({
        title: "🚀 Motivation Boost!",
        message: `${generalNudge.message}${generalNudge.microPlan && generalNudge.microPlan.length > 0 ? '\n\nQuick actions:\n' + generalNudge.microPlan.map(step => `• ${step}`).join('\n') : ''}${generalNudge.challenge ? `\n\n💭 ${generalNudge.challenge}` : ''}`,
        type: 'nudge'
      });
      setShowAlert(true);
      
      return generalNudge;
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
    const maxGoals = isSubscribed ? 3 : 1;
    
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

    // User has room for more goals, proceed to form
    setCurrentView('onboarding');
    
    // Scroll to top when showing goal creation form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Also refresh the local state for dashboard consistency
    await fetchGoals();
  };

  // Show loading screen while checking authentication - SIMPLIFIED
  const forceDashboard = searchParams.get('force-dashboard') === 'true';
  const emailVerified = searchParams.get('email-verified') === 'true';
  const verified = searchParams.get('verified') === 'true';
  const shouldShowLoading = (authLoading || (user && goalsLoading && !hasInitialized.current) || isRedirecting || emailVerified) && !forceDashboard;
  
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
            // Skip all database checks and just go to onboarding
            console.log('User authenticated, going to onboarding');
            setUserEmail(user.email || '');
            setCurrentView('onboarding');
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
                // No goals, start onboarding
                console.log('No goals found, starting onboarding');
                setUserEmail(user.email || '');
                setCurrentView('onboarding');
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
      setCurrentView('onboarding');
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
        <Dashboard
          onNudgeMe={handleNudgeMe}
          onStartOver={handleStartOver}
          onLogoClick={() => {
            // Navigate to landing page using React state, not page reload
            setCurrentView('landing');
          }}
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

  return null;
};

export default Index;