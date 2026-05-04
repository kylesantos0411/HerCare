# HerCare Partner Reminder Setup

The current HerCare reminder flow does not require Firebase Functions.

What it uses now
- Supabase for partner share data
- Android foreground/background polling service for reminder delivery
- Full-screen reminder activity for hydration and meals nudges

What still uses Firebase
- `android/app/google-services.json` and `firebase-messaging` remain optional if you want to keep the legacy FCM path
- `functions/` contains the old Firebase Functions sender

Current setup path

## 1. Configure Supabase

Add these values to `.env.local`:

```text
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

## 2. Apply the reminder polling RPC

Run the SQL in:

```text
supabase/migrations/20260504225500_partner_reminder_poll.sql
```

This exposes the narrow polling endpoint the Android reminder service uses.

## 3. Build the Android app

From the project root:

```powershell
cd C:\Users\kyle\Desktop\HerCare
npm.cmd run apk:debug
```

APK output:

`android/app/build/outputs/apk/debug/app-debug.apk`

## 4. Test on both phones

1. Install the same APK on both phones.
2. On her phone:
   - open the normal app
   - go to `Settings -> Partner Sharing`
   - create the share code
   - turn on `Allow partner reminders`
3. On your phone:
   - open `Partner View`
   - enter the code
   - go to `Partner Settings`
   - turn on `Background reminders`
4. Send `Nudge water` or `Nudge meals`.
5. Confirm the receiving phone shows the full-screen reminder UI.

## Notes

- The reminder service polls Supabase every 20 seconds.
- Full-screen reminders only work on Android.
- This path is free-tier compatible because it does not depend on Firebase Functions.
