# Firebase Console Setup Steps

## Go to Firebase Console
1. Open: https://console.firebase.google.com/project/goalmineai
2. Click on "Authentication" in the left sidebar
3. Go to "Sign-in method" tab

## Enable Authentication Methods
1. **Email/Password**:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"

2. **Google**:
   - Click on "Google" 
   - Toggle "Enable" to ON
   - In "Web SDK configuration" → "Authorized domains"
   - Click "Add domain"
   - Add: `goalmine.ai`
   - Click "Save"

## Add Authorized Domains
1. Go to "Settings" tab (next to "Sign-in method")
2. Scroll down to "Authorized domains" 
3. Click "Add domain"
4. Add: `goalmine.ai`
5. Click "Done"

That's it! Firebase is now configured for production.