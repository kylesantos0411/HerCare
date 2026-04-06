Partner Sync Setup

This app now includes a consent-based partner sharing flow backed by Firebase.
It will not go online until you finish this one-time setup.

What this feature does
- Her phone can share status summaries for hydration, meals, mood, sleep, and next shift.
- Her phone can send a manual text check-in.
- Her phone can send a manual location check-in only when she taps the button.
- Your phone can open Partner View with the private share code and read the live status board.

What this feature does not do
- No hidden background tracking
- No always-on location sharing
- No remote access without the private share code

1. Create a Firebase project
- Go to the Firebase console.
- Create a new project or use an empty one.

2. Add a Web app inside Firebase
- In Project settings, add a Web app.
- Copy the Firebase config values.

3. Create `.env.local`
- In the project root, create `.env.local`.
- Copy the keys from [.env.example](c:/Users/kyle/Desktop/HerCare/.env.example).
- Paste your real Firebase values.

Required keys
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

4. Enable Anonymous Authentication
- In Firebase console, open Authentication.
- Open Sign-in method.
- Enable `Anonymous`.

5. Create Cloud Firestore
- In Firebase console, open Firestore Database.
- Create the database.
- Start in test mode only if you are still setting things up.
- After that, replace the rules with the contents of [firebase.rules](c:/Users/kyle/Desktop/HerCare/firebase.rules).

6. Rebuild the app
- Web build:
  `npm.cmd run build`
- Android APK build:
  `npm.cmd run apk:debug`

7. Pair the phones
- On her phone:
  Settings -> Partner Sharing
  Create Share Code
  Turn on Share Live Statuses
- On your phone:
  Welcome -> Partner View
  Enter the private share code

Important notes
- Status sync happens when her app is open and saves new data.
- Location is manual only. She must turn on location check-ins and tap `Share Current Location`.
- If you create a fresh share code, the old linked phone will stop receiving updates until it reconnects with the new code.
