import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const VerifyEmail = () => {
  const { firebaseUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'checking' | 'verified' | 'failed'>('checking');

  const handleFirebaseEmailVerification = async (oobCode: string) => {
    try {
      console.log('📧 Processing Firebase email verification with code:', oobCode);
      
      // Use Firebase's applyActionCode to verify the email
      if (window.firebaseAuth) {
        await window.firebaseAuth.applyActionCode(oobCode);
        console.log('✅ Email verification successful!');
        setVerificationStatus('verified');
        
        // Redirect directly to onboarding (goal creation) - skip dashboard complexity
        setTimeout(() => {
          navigate('/?force-onboarding=true', { replace: true });
        }, 1500);
      } else {
        console.error('❌ Firebase auth not available');
        setVerificationStatus('failed');
      }
    } catch (error) {
      console.error('❌ Email verification failed:', error);
      setVerificationStatus('failed');
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max wait time

    // Check if this is a Firebase action URL (contains mode and oobCode)
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');
    
    if (mode === 'verifyEmail' && oobCode) {
      console.log('🔍 Processing Firebase email verification action');
      handleFirebaseEmailVerification(oobCode);
      return;
    }

    const checkVerificationStatus = () => {
      console.log('🔍 Email verification check:', {
        attempt: attempts + 1,
        hasFirebaseUser: !!firebaseUser,
        emailVerified: firebaseUser?.emailVerified,
        userEmail: firebaseUser?.email,
        authLoading,
        isAuthenticated,
        verificationStatus
      });

      if (authLoading) {
        // Still loading auth, continue waiting
        attempts++;
        if (attempts < maxAttempts) {
          timeoutId = setTimeout(checkVerificationStatus, 1000);
        } else {
          console.log('❌ Email verification timeout - auth still loading');
          setVerificationStatus('failed');
        }
        return;
      }

      if (firebaseUser?.emailVerified) {
        console.log('✅ Email verification confirmed! Redirecting to dashboard...');
        setVerificationStatus('verified');
        // Shorter delay for smoother experience
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 800);
        return;
      }

      if (firebaseUser && !firebaseUser.emailVerified) {
        // User exists but not verified yet, keep checking
        attempts++;
        if (attempts < maxAttempts) {
          timeoutId = setTimeout(checkVerificationStatus, 1000);
        } else {
          console.log('❌ Email verification timeout - not verified after 30 seconds');
          setVerificationStatus('failed');
        }
        return;
      }

      if (!firebaseUser && !authLoading) {
        // No user and auth finished loading - user needs to sign in after verification
        console.log('🔐 No user found after verification - user needs to sign in');
        setVerificationStatus('failed');
        return;
      }

      // Continue checking
      attempts++;
      if (attempts < maxAttempts) {
        timeoutId = setTimeout(checkVerificationStatus, 1000);
      } else {
        console.log('❌ Email verification timeout');
        setVerificationStatus('failed');
      }
    };

    // Start checking immediately for faster response
    timeoutId = setTimeout(checkVerificationStatus, 100);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [firebaseUser, authLoading, isAuthenticated, navigate]);

  const handleRetry = () => {
    // Redirect to auth page to try again
    navigate('/auth?message=Please try signing in again', { replace: true });
  };

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  if (verificationStatus === 'checking') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Verifying Your Email</h1>
          <p className="text-muted-foreground mb-4">
            Please wait while we confirm your email verification...
          </p>
          <p className="text-sm text-muted-foreground">Dream Big</p>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'verified') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Email Verified! 🎉</h1>
          <p className="text-muted-foreground mb-4">
            Redirecting you to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  // verificationStatus === 'failed'
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Verification Issue</h1>
        <p className="text-muted-foreground mb-6">
          Your email has been verified, but you need to sign in to continue. This is a security feature of Firebase authentication.
        </p>
        <div className="space-y-3">
          <button 
            onClick={handleRetry}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Sign In to Continue
          </button>
          <button 
            onClick={handleGoHome}
            className="w-full bg-background text-foreground border border-border hover:bg-muted px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;