Partner Sync Setup

This app now uses Supabase for partner sharing and Android background reminders.

What this feature does
- Her phone can share status summaries for hydration, meals, mood, sleep, shift, and study.
- Either phone can send hydration and meals nudges that can open the full-screen reminder UI on Android.
- Her phone can send a manual text check-in.
- Her phone can send a manual location check-in only when she taps the button.
- Your phone can open Partner View with the private share code and read the live status board.

What this feature does not do
- No hidden background tracking
- No always-on location sharing
- No remote access without the private share code
- No hard lock of the device

1. Create a Supabase project
- Go to the Supabase dashboard.
- Create a new project.

2. Enable anonymous auth
- Open `Authentication`.
- Open `Providers`.
- Enable `Anonymous Sign-Ins`.

3. Create `.env.local`
- In the project root, create `.env.local`.
- Copy the keys from `/.env.example`.
- Paste your real Supabase values.

Required keys
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

4. Apply the database schema
- Create the `partner_shares` table and policies in Supabase.
- Apply the reminder polling RPC in `supabase/migrations/20260504225500_partner_reminder_poll.sql`.

5. Rebuild the app
- Web build:
  `npm.cmd run build`
- Android debug build:
  `npm.cmd run apk:debug`

6. Pair the phones
- On her phone:
  `Settings -> Partner Sharing`
  `Create Share Code`
  turn on `Share live statuses`
  turn on `Allow partner reminders`
- On your phone:
  `Welcome -> Partner View`
  enter the private share code
  open `Partner Settings`
  turn on `Background reminders`

7. Full-screen reminder behavior
- The Android app starts a small foreground service while reminders are enabled.
- The service polls Supabase every 20 seconds for new hydration or meals nudges.
- When a new nudge is found, the app shows the full-screen reminder UI.

Important notes
- Background reminders only work in the installed Android app, not in `npm run dev`.
- Location is manual only. She must turn on location check-ins and tap `Share Current Location`.
- If you create a fresh share code, the old linked phone stops receiving updates until it reconnects.
