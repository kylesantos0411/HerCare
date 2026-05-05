# HerCare

HerCare is a soft, supportive care companion app built for a girlfriend who works long and draining shifts. It brings together shift planning, wellness tracking, partner check-ins, and a gentle study timer in one calm mobile experience.

![HerCare logo](design/logo/HerCare.png)

## What It Does

- Shift planning for upcoming duty schedules
- Today's wellness tracking for water, sleep, mood, and meals
- Smart insight cards based on recent wellness signals
- Quick Partner Check-In with message presets and optional location sharing
- Quick Focus with longer focus presets plus custom minutes: `30m`, `1h`, `1h 30m`, `2h`
- Study alerts with in-app sound, vibration, and Android local notifications
- Partner View so the connected partner can see shared care updates, including live study status
- Night-shift friendly dark mode styling

## Main Screens

- `Home`: shift planning, wellness summary, smart insight, partner check-in, quick focus
- `Wellness`: hydration, mood, and sleep support
- `Meals`: meal logging for shifts and recovery time
- `Notes`: care notes and open-when style content
- `Study`: flexible Pomodoro timer with supportive copy
- `You`: personal comfort space and profile-style view
- `Partner Sharing`: share code creation, sync controls, location check-ins
- `Partner View`: remote partner dashboard with live study awareness

## Tech Stack

- React 19
- TypeScript
- Vite
- Capacitor Android
- Supabase Auth + Postgres
- Capacitor Local Notifications and Android background reminders

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Add environment variables

Create a local `.env.local` file from [`.env.example`](.env.example) and fill in your Supabase project values:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

### 3. Run the web app

```bash
npm run dev
```

### 4. Build production web assets

```bash
npm run build
```

### 5. Build the signed Android release APK

```bash
npm run apk:release
```

The shareable APK is generated at:

`android/app/build/outputs/apk/release/HerCare-v1.1.1-release.apk`

### 6. Build the signed Android App Bundle

```bash
npm run aab:release
```

The Play Store bundle is generated at:

`android/app/build/outputs/bundle/release/HerCare-v1.1.1-release.aab`

## Supabase Notes

- Partner sharing depends on Supabase being configured correctly
- Anonymous auth must be enabled in Supabase Auth
- The Android full-screen reminder flow uses a background polling service against the Supabase REST API
- `supabase/migrations/20260504225500_partner_reminder_poll.sql` contains the reminder polling RPC used by Android
- `android/app/google-services.json` is only needed if you still want the legacy Firebase push path

## Useful Scripts

- `npm run dev` - start the Vite dev server
- `npm run dev:simple` - start the HerCare Essentials variant
- `npm run build` - run TypeScript build and Vite production build
- `npm run build:simple` - build the HerCare Essentials web assets
- `npm run apk:debug` - build the debug APK
- `npm run apk:simple:debug` - build the HerCare Essentials debug APK
- `npm run apk:release` - build the signed release APK
- `npm run apk:simple:release` - build the signed HerCare Essentials release APK
- `npm run aab:release` - build the signed release App Bundle
- `npm run aab:simple:release` - build the signed HerCare Essentials release App Bundle
- `npm run push:deploy` - deploy the legacy Firebase functions path only
- `npm run lint` - run ESLint

## Variant Workspaces

The main HerCare app continues to live in the root `src/`, `android/`, and `design/` folders.

For HerCare Essentials specific planning, copy, branding, and release prep, use:

`variants/hercare-essentials/`

That folder is the safe place to organize Essentials-only work before we decide whether a change should stay shared or branch into its own implementation.

## Project Structure

```text
src/
  components/    Reusable UI pieces
  hooks/         Local state helpers
  pages/         App screens
  utils/         Domain logic for wellness, partner sync, study timer, and notifications
android/         Capacitor Android project
functions/       Legacy Firebase Cloud Functions
supabase/        Supabase SQL migrations for partner sync and reminders
design/          Logo and supporting design assets
variants/        Variant-specific workspaces and planning folders
```

## Current Highlights

- Flexible Pomodoro with supportive Taglish copy, longer presets, and custom minutes
- Android study completion alerts with custom sound
- Partner View live study countdown plus per-card partner nudges
- Partner self-care logging with owner-to-partner nudges for water, meals, and sleep
- Two-way full-screen Android reminders for hydration and meals using the Supabase background reminder service
- Home flow ordered as:
  `Shift Planning -> Today's Wellness -> Smart Insight -> Quick Partner Check-In -> Quick Focus`

## Status

This repository is the active codebase for the HerCare app and includes the latest Android-ready implementation used to generate the current signed release artifacts.
