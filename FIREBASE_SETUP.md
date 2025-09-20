# Firebase Authentication Setup for GoalMine.ai

Your application has been updated to use Firebase for authentication while keeping Supabase for data storage. Follow these steps to complete the setup:

## 1. Create a Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project" or "Create a project"
3. Enter project name: `goalmine-ai` (or similar)
4. Choose whether to enable Google Analytics (recommended)
5. Click "Create project"

## 2. Enable Authentication

1. In your Firebase console, go to **Authentication** > **Sign-in method**
2. Enable the following sign-in methods:
   - **Email/Password**: Click on it and toggle "Enable"
   - **Google**: Click on it, toggle "Enable", and add your domain `goalmine.ai`

## 3. Add Web App Configuration

1. In your Firebase console, click the gear icon > **Project settings**
2. Scroll down to "Your apps" section
3. Click the web icon `</>` to add a web app
4. Enter app nickname: `goalmine-web`
5. Check "Also set up Firebase Hosting" if you want (optional)
6. Click "Register app"
7. Copy the configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcd..."
};
```

## 4. Update Environment Variables

Replace the placeholder values in your `.env` file with the actual values from your Firebase config:

```env
VITE_FIREBASE_API_KEY="your-actual-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

## 5. Add Authorized Domains

In Firebase Console > Authentication > Settings > Authorized domains:
- Add `goalmine.ai`
- Add `www.goalmine.ai`
- Add your Vercel deployment URL (e.g., `goalmine-ai-abc123.vercel.app`)

## 6. Test Authentication

Once you've updated the environment variables:

1. Run the development server: `npm run dev`
2. Try signing up with a new email
3. Try signing in with Google
4. Check that user profiles are created in your Supabase `profiles` table

## 7. Deploy to Vercel

Update your environment variables in Vercel:

1. Go to your Vercel dashboard
2. Select your goalmine project
3. Go to Settings > Environment Variables
4. Add all the `VITE_FIREBASE_*` variables with your actual values

## What's Changed

- **Authentication**: Now handled by Firebase instead of Supabase
- **User Management**: Firebase users are automatically synced to your Supabase `profiles` table
- **Google Sign-in**: Enabled with proper UI integration
- **Data Storage**: Still uses Supabase for goals, nudges, and all other data
- **Existing Features**: All your nudge limits, email system, and trial management still work

## Troubleshooting

If you encounter issues:

1. Check browser console for Firebase errors
2. Verify all environment variables are set correctly
3. Ensure your domain is added to Firebase authorized domains
4. Check that Authentication methods are enabled in Firebase console

The authentication flow now works as:
1. User signs in via Firebase (Google or Email/Password)
2. Firebase user data is automatically synced to Supabase `profiles` table
3. Your app uses the Supabase profile for all data operations
4. All existing functionality (goals, nudges, subscriptions) continues to work