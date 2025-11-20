// Firebase bundled imports
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';

// EMERGENCY FIX - Force correct authDomain
const CORRECT_AUTH_DOMAIN = "goalmineai.firebaseapp.com";

// Firebase configuration - FORCED VALUES TO DEBUG
const firebaseConfig = {
  apiKey: "AIzaSyDqxbqX-z6L6kYvWZGnKIttNz0GWm6IQAg",
  authDomain: CORRECT_AUTH_DOMAIN, // ABSOLUTELY HARDCODED
  projectId: "goalmineai", 
  storageBucket: "goalmineai.firebasestorage.app",
  messagingSenderId: "518935050036",
  appId: "1:518935050036:web:959d74e2914a12bff2d761"
};

console.log('🚨 DEBUG: Raw environment variables:', {
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  ALL_FIREBASE_VARS: Object.keys(import.meta.env).filter(key => key.includes('FIREBASE'))
});

console.log('🚨 DEBUG: Final config being used:', {
  authDomain: firebaseConfig.authDomain,
  isHardcoded: firebaseConfig.authDomain === "goalmineai.firebaseapp.com"
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Google provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Add additional scopes that might help with domain verification
googleProvider.addScope('email');
googleProvider.addScope('profile');

console.log('🔥 Firebase initialized via BUNDLED import (NOT CDN) - v2');
console.log('🔧 Environment variables check:', {
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE
});
console.log('✅ Firebase bundled app config:', {
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  apiKey: firebaseConfig.apiKey ? 'Set' : 'Not set'
});
console.log('📦 Using Firebase v10 bundled package, NOT CDN scripts');

export { auth, googleProvider };
export default app;