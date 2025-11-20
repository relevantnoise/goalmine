import { useEffect, useState } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import { supabase } from '../integrations/supabase/client';
import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  sendPasswordResetEmail, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth';

type FirebaseUser = User;

interface Profile {
  id: string;
  email: string;
  clerk_uuid?: string | null;
  trial_expires_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const useAuth = () => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Enhanced loading state setter with logging
  const setLoadingWithLog = (loading: boolean, source: string) => {
    setIsLoading(loading);
  };
  
  // Force loading to false after maximum wait time
  useEffect(() => {
    const maxLoadingTimer = setTimeout(() => {
      setLoadingWithLog(false, 'MAX_TIMEOUT');
    }, 5000); // 5 seconds maximum loading time
    
    return () => {
      clearTimeout(maxLoadingTimer);
    };
  }, []);

  // Initialize with proper Firebase auth state listener
  useEffect(() => {
    console.log('🔄 Setting up Firebase auth state listener...');
    
    // Check for redirect result first (for Google OAuth redirect flow)
    getRedirectResult(auth).then((result) => {
      if (result) {
        console.log('✅ Google redirect sign-in successful!', {
          user: result.user ? {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName
          } : 'No user'
        });
        // The auth state listener will handle the rest
      }
    }).catch((error) => {
      console.error('❌ Redirect result error:', error);
    });
    
    // Set a timeout fallback to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('⏰ Auth initialization timeout - setting loading to false');
      setLoadingWithLog(false, 'AUTH_INIT_TIMEOUT');
    }, 3000); // 3 second fallback
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      try {
        console.log('🔥 Firebase auth state changed:', user ? {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified
        } : 'No user');
        
        // Clear the timeout since we got a response
        clearTimeout(timeoutId);
        
        if (user) {
          setFirebaseUser(user);
          syncUserWithSupabase(user);
        } else {
          setFirebaseUser(null);
          setProfile(null);
          setLoadingWithLog(false, 'AUTH_STATE_NO_USER');
        }
      } catch (error) {
        console.error('❌ Error in auth state change handler:', error);
        clearTimeout(timeoutId);
        setFirebaseUser(null);
        setProfile(null);
        setLoadingWithLog(false, 'AUTH_STATE_ERROR');
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  // Sync Firebase user with Supabase profile - TEMPORARY BYPASS
  const syncUserWithSupabase = async (user: FirebaseUser) => {
    try {
      setLoadingWithLog(true, 'SYNC_USER_START');
      
      console.log('🔄 Using edge function to sync user profile');
      
      // Add timeout to prevent hanging
      const syncPromise = Promise.race([
        supabase.functions.invoke('create-user-profile', {
          body: {
            firebaseUid: user.uid,
            email: user.email!,
            displayName: user.displayName,
            photoURL: user.photoURL
          },
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile sync timeout')), 8000)
        )
      ]);
      
      const { data, error } = await syncPromise as any;

      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }

      if (data?.profile) {
        console.log('✅ Profile sync successful:', data.profile.email, 'Profile ID:', data.profile.id);
        setProfile(data.profile);
        console.log('📝 Profile state updated - user should now be authenticated');
      } else {
        console.error('❌ No profile data returned from edge function');
        throw new Error('No profile data returned from edge function');
      }
    } catch (error) {
      console.error('❌ Error syncing user profile:', error);
      // Continue with Firebase user even if Supabase sync fails
      setProfile({
        id: user.uid,
        email: user.email!,
        clerk_uuid: user.uid,
        trial_expires_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } finally {
      setLoadingWithLog(false, 'SYNC_USER_COMPLETE');
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      console.log('🔄 Starting Google sign-in process...');
      setLoadingWithLog(true, 'GOOGLE_SIGNIN_START');
      
      console.log('🎯 Attempting popup sign-in...');
      try {
        // Force popup to stay focused and return to current tab
        const result = await signInWithPopup(auth, googleProvider);
        console.log('✅ Google sign-in successful!', {
          user: result.user ? {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName
          } : 'No user'
        });
        
        return result.user;
      } catch (popupError: any) {
        console.log('❌ Popup failed:', popupError.message);
        console.log('🔄 Popup blocked, trying redirect method...');
        
        try {
          await signInWithRedirect(auth, googleProvider);
          // Note: signInWithRedirect doesn't return immediately, it redirects the page
          return null; // We'll handle the result after redirect
        } catch (redirectError: any) {
          console.error('❌ Redirect also failed:', redirectError);
          throw new Error('Google sign-in failed. Please try again or use email/password.');
        }
      }
    } catch (error: any) {
      console.error('❌ Google sign-in error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw new Error(error.message || 'Failed to sign in with Google');
    } finally {
      setLoadingWithLog(false, 'GOOGLE_SIGNIN_COMPLETE');
    }
  };

  // Sign in with email/password
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoadingWithLog(true, 'EMAIL_SIGNIN_START');
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error: any) {
      console.error('Email sign-in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    } finally {
      setLoadingWithLog(false, 'EMAIL_SIGNIN_COMPLETE');
    }
  };

  // Sign up with email/password
  const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
    try {
      setLoadingWithLog(true, 'EMAIL_SIGNUP_START');
      console.log('🔄 Starting email signup process for:', email);
      
      // Add timeout to prevent hanging
      const signupPromise = Promise.race([
        createUserWithEmailAndPassword(auth, email, password),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Signup timeout')), 10000)
        )
      ]);
      
      console.log('🔄 Creating user with email and password...');
      const result = await signupPromise as any;
      console.log('✅ User created successfully:', result.user.uid);
      
      // Update display name if provided
      if (fullName) {
        console.log('🔄 Updating display name to:', fullName);
        await updateProfile(result.user, {
          displayName: fullName
        });
        console.log('✅ Display name updated');
      }
      
      // Send email verification with action code settings - simple redirect to onboarding
      const actionCodeSettings = {
        url: window.location.origin + '/?verified=true',
        handleCodeInApp: false
      };
      
      console.log('📧 Attempting to send email verification to:', result.user.email);
      console.log('📧 Action code settings:', actionCodeSettings);
      
      try {
        await sendEmailVerification(result.user, actionCodeSettings);
        console.log('✅ Email verification sent successfully to:', result.user.email);
      } catch (emailError: any) {
        console.error('❌ Failed to send email verification:', emailError);
        console.error('❌ Email error details:', emailError.message, emailError.code);
        throw new Error('Failed to send verification email: ' + emailError.message);
      }
      
      console.log('✅ Email signup process completed successfully');
      return result.user;
    } catch (error: any) {
      console.error('❌ Email sign-up error:', error);
      console.error('❌ Error details:', error.message, error.code, error.stack);
      throw new Error(error.message || 'Failed to create account');
    } finally {
      console.log('🔄 Setting loading to false');
      setLoadingWithLog(false, 'EMAIL_SIGNUP_COMPLETE');
    }
  };

  // Send password reset email
  const resetPassword = async (email: string) => {
    setLoadingWithLog(true, 'PASSWORD_RESET_START');
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/auth`, // Redirect back to auth page after reset
        handleCodeInApp: false
      };
      
      console.log('📧 Sending password reset email to:', email);
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      console.log('✅ Password reset email sent successfully to:', email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(error.message || 'Failed to send password reset email');
    } finally {
      setLoadingWithLog(false, 'PASSWORD_RESET_COMPLETE');
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Debug: Watch when profile state changes (at the end to avoid hooks order issues)
  useEffect(() => {
    console.log('👤 useAuth state change:', {
      hasFirebaseUser: !!firebaseUser,
      hasProfile: !!profile,
      profileEmail: profile?.email,
      isAuthenticated: !!firebaseUser && !!profile && (firebaseUser?.emailVerified || false),
      emailVerified: firebaseUser?.emailVerified || false,
      needsEmailVerification: !!firebaseUser && !firebaseUser.emailVerified,
      isLoading
    });
  }, [firebaseUser, profile, isLoading]);

  return {
    user: profile,
    firebaseUser,
    isAuthenticated: !!firebaseUser && !!profile && (firebaseUser?.emailVerified || false),
    emailVerified: firebaseUser?.emailVerified || false,
    needsEmailVerification: !!firebaseUser && !firebaseUser.emailVerified,
    isLoading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    logout,
    refreshProfile: () => {
      if (firebaseUser) {
        syncUserWithSupabase(firebaseUser);
      }
    }
  };
};