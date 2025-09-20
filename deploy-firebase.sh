#!/bin/bash

echo "🔥 Firebase Authentication - Vercel Deployment Script"
echo "===================================================="

# Check if vercel is logged in
if ! npx vercel whoami > /dev/null 2>&1; then
    echo "❌ Please log in to Vercel first:"
    echo "   npx vercel login"
    exit 1
fi

echo "✅ Vercel login confirmed"

# Set environment variables
echo "📝 Setting Firebase environment variables..."

npx vercel env add VITE_FIREBASE_API_KEY "AIzaSyDqxbqX-z6L6kYvWZGnKIttNz0GWm6IQAg" production
npx vercel env add VITE_FIREBASE_AUTH_DOMAIN "goalmineai.firebaseapp.com" production
npx vercel env add VITE_FIREBASE_PROJECT_ID "goalmineai" production
npx vercel env add VITE_FIREBASE_STORAGE_BUCKET "goalmineai.firebasestorage.app" production
npx vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID "518935050036" production
npx vercel env add VITE_FIREBASE_APP_ID "1:518935050036:web:959d74e2914a12bff2d761" production

# Also set for preview environments
npx vercel env add VITE_FIREBASE_API_KEY "AIzaSyDqxbqX-z6L6kYvWZGnKIttNz0GWm6IQAg" preview
npx vercel env add VITE_FIREBASE_AUTH_DOMAIN "goalmineai.firebaseapp.com" preview
npx vercel env add VITE_FIREBASE_PROJECT_ID "goalmineai" preview
npx vercel env add VITE_FIREBASE_STORAGE_BUCKET "goalmineai.firebasestorage.app" preview
npx vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID "518935050036" preview
npx vercel env add VITE_FIREBASE_APP_ID "1:518935050036:web:959d74e2914a12bff2d761" preview

echo "✅ Environment variables set!"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
npx vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "🎯 What to test:"
echo "   1. Visit your deployed site"
echo "   2. Try signing up with email"
echo "   3. Try signing in with Google"
echo "   4. Check browser console for Firebase logs"
echo "   5. Verify user profiles in Supabase"
echo ""
echo "🔧 Firebase Console:"
echo "   https://console.firebase.google.com/project/goalmineai"