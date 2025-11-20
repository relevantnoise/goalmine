// Firebase bundled imports
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';

// Firebase configuration - authDomain hardcoded to prevent OAuth issues
const firebaseConfig = {
  apiKey: "AIzaSyDqxbqX-z6L6kYvWZGnKIttNz0GWm6IQAg",
  authDomain: "goalmineai.firebaseapp.com", // HARDCODED: Env vars were causing OAuth failures
  projectId: "goalmineai", 
  storageBucket: "goalmineai.firebasestorage.app",
  messagingSenderId: "518935050036",
  appId: "1:518935050036:web:959d74e2914a12bff2d761"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Google provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
  redirect_uri: window.location.origin // Explicitly set redirect back to GoalMine.ai
});

// Add additional scopes that might help with domain verification
googleProvider.addScope('email');
googleProvider.addScope('profile');

console.log('🔥 Firebase initialized via BUNDLED import (NOT CDN) - v2');
console.log('✅ Firebase bundled app config:', {
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  apiKey: firebaseConfig.apiKey ? 'Set' : 'Not set'
});
console.log('📦 Using Firebase v10 bundled package, NOT CDN scripts');

export { auth, googleProvider };
export default app;