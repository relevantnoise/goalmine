import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Label } from '../components/ui/label';
import { Chrome, Mail, Loader2, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';

export const Auth: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, logout, isLoading, isAuthenticated, needsEmailVerification, emailVerified } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Helper function to convert Firebase errors to user-friendly messages
  const getErrorMessage = (error: any): string => {
    const message = error?.message || error || '';
    
    if (message.includes('auth/user-not-found') || message.includes('auth/invalid-credential')) {
      return `No account found with email ${email}. Please sign up first or check your email address.`;
    }
    
    if (message.includes('auth/wrong-password')) {
      return 'Incorrect password. Please try again or use "Forgot Password".';
    }
    
    if (message.includes('auth/invalid-email')) {
      return 'Please enter a valid email address.';
    }
    
    if (message.includes('auth/user-disabled')) {
      return 'This account has been disabled. Please contact support.';
    }
    
    if (message.includes('auth/too-many-requests')) {
      return 'Too many failed attempts. Please try again later.';
    }
    
    if (message.includes('auth/email-already-in-use')) {
      return `An account with email ${email} already exists. Please sign in instead.`;
    }
    
    if (message.includes('auth/weak-password')) {
      return 'Password should be at least 6 characters long.';
    }
    
    if (message.includes('auth/operation-not-allowed')) {
      return 'Email/password sign-in is not enabled. Please contact support.';
    }
    
    if (message.includes('auth/network-request-failed')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    
    if (message.includes('auth/user-not-found') && message.includes('reset')) {
      return `No account found with email ${resetEmail}. Please check your email address or create a new account.`;
    }
    
    // Default fallback for any other Firebase auth errors
    if (message.includes('auth/')) {
      return 'Authentication failed. Please check your credentials and try again.';
    }
    
    // For non-Firebase errors, show the original message
    return message || 'An unexpected error occurred. Please try again.';
  };

  // Check for email verification success
  useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      setShowVerificationSuccess(true);
      // Clear the parameter from URL
      navigate('/auth', { replace: true });
    }
  }, [searchParams, navigate]);

  // Redirect to home page when authentication succeeds
  useEffect(() => {
    if (isAuthenticated && !isLoading && !isRedirecting) {
      console.log('🚀 Authentication successful - redirecting to home page');
      setIsRedirecting(true);
      // Add a small delay to ensure auth state is fully propagated
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
    }
  }, [isAuthenticated, isLoading, navigate, isRedirecting]);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (error: any) {
      setError(getErrorMessage(error));
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setIsSigningIn(true);
      await signInWithEmail(email, password);
    } catch (error: any) {
      setError(getErrorMessage(error));
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setIsSigningIn(true);
      await signUpWithEmail(email, password);
      // After successful signup, show verification message
      setShowVerificationMessage(true);
    } catch (error: any) {
      setError(getErrorMessage(error));
    } finally {
      setIsSigningIn(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setIsSigningIn(true);
      await resetPassword(resetEmail);
      setResetEmailSent(true);
    } catch (error: any) {
      setError(getErrorMessage(error));
    } finally {
      setIsSigningIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Dream Big...</p>
        </div>
      </div>
    );
  }

  // Show email verification pending screen
  if (needsEmailVerification || showVerificationMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Check Your Email
            </CardTitle>
            <CardDescription>
              We've sent you a verification email
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            
            <p className="text-gray-600">
              We've sent a verification email to <strong>{email}</strong>. 
              Please check your inbox and click the verification link to continue.
            </p>
            
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-700">
                Don't forget to check your spam or newsletter folders if you don't see the email.
              </AlertDescription>
            </Alert>
            
            <div className="pt-4">
              <Button 
                variant="outline" 
                onClick={async () => {
                  // Sign out the unverified user and reset the form
                  try {
                    await logout();
                  } catch (error) {
                    console.error('Error signing out:', error);
                  }
                  setShowVerificationMessage(false);
                  setEmail('');
                  setPassword('');
                }}
                className="w-full"
              >
                Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show password reset screen
  if (showPasswordReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {resetEmailSent ? 'Check Your Email' : 'Reset Password'}
            </CardTitle>
            <CardDescription>
              {resetEmailSent 
                ? 'We\'ve sent you a password reset link' 
                : 'Enter your email to receive a password reset link'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {resetEmailSent ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                
                <p className="text-gray-600">
                  We've sent a password reset link to <strong>{resetEmail}</strong>. 
                  Please check your inbox and follow the instructions to reset your password.
                </p>
                
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertDescription className="text-blue-700">
                    Don't forget to check your spam folder if you don't see the email.
                  </AlertDescription>
                </Alert>
                
                <div className="pt-4 space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowPasswordReset(false);
                      setResetEmailSent(false);
                      setResetEmail('');
                    }}
                    className="w-full"
                  >
                    Back to Sign In
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button 
                    type="submit"
                    className="w-full h-11"
                    disabled={isSigningIn}
                  >
                    {isSigningIn ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Reset Email...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Reset Email
                      </>
                    )}
                  </Button>
                </form>
                
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowPasswordReset(false);
                    setError(null);
                  }}
                  className="w-full"
                >
                  Back to Sign In
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show professional loading screen when authenticated and redirecting
  if (isAuthenticated || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
          <p className="text-gray-600">Dream Big, Start Small, Keep Going...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome to GoalMine.ai
          </CardTitle>
          <CardDescription>
            Track your goals, build streaks, and stay motivated with AI-powered insights
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Google Sign-In Button */}
          <Button 
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full h-12 mb-6 text-base font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
          >
            {isSigningIn ? (
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
            ) : (
              <Chrome className="mr-3 h-5 w-5" />
            )}
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Email Auth Tabs */}
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="button"
                    variant="link" 
                    className="text-sm p-0 h-auto font-normal"
                    onClick={() => {
                      setShowPasswordReset(true);
                      setResetEmail(email); // Pre-fill with current email
                      setError(null);
                    }}
                  >
                    Forgot Password?
                  </Button>
                </div>

                <Button 
                  type="submit"
                  className="w-full h-11"
                  disabled={isSigningIn}
                >
                  {isSigningIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Dream Big...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Password must be at least 6 characters
                  </p>
                </div>

                <Button 
                  type="submit"
                  className="w-full h-11"
                  disabled={isSigningIn}
                >
                  {isSigningIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Dream Big...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-center text-gray-500 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
export default Auth;