# HerCare

HerCare is a soft, supportive care companion app built for a girlfriend who works long and draining shifts. It brings together shift planning, wellness tracking, partner check-ins, and a gentle study timer in one calm mobile experience.

![HerCare logo](design/logo/HerCare.png)

## What It Does

- Shift planning for upcoming duty schedules
- Today's wellness tracking for water, sleep, mood, and meals
- Smart insight cards based on recent wellness signals
- Quick Partner Check-In with message presets and optional location sharing
- Quick Focus with a flexible Pomodoro flow: `2m`, `5m`, `10m`, `25m`
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
- Firebase Auth + Firestore
- Capacitor Local Notifications and Push Notifications

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Add environment variables

Create a local `.env` file from [`.env.example`](.env.example) and fill in your Firebase web config:

```env
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
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

`android/app/build/outputs/apk/release/HerCare-v1.0.0-release.apk`

### 6. Build the signed Android App Bundle

```bash
npm run aab:release
```

The Play Store bundle is generated at:

`android/app/build/outputs/bundle/release/HerCare-v1.0.0-release.aab`

## Firebase Notes

- Partner sharing depends on Firebase being configured correctly
- [firebase.rules](firebase.rules) contains the Firestore rules used by the app
- `android/app/google-services.json` is intentionally not committed and should stay local

## Useful Scripts

- `npm run dev` - start the Vite dev server
- `npm run build` - run TypeScript build and Vite production build
- `npm run apk:debug` - build the debug APK
- `npm run apk:release` - build the signed release APK
- `npm run aab:release` - build the signed release App Bundle
- `npm run push:deploy` - deploy Firebase functions only
- `npm run lint` - run ESLint

## Project Structure

```text
src/
  components/    Reusable UI pieces
  hooks/         Local state helpers
  pages/         App screens
  utils/         Domain logic for wellness, partner sync, study timer, and notifications
android/         Capacitor Android project
functions/       Firebase Cloud Functions
design/          Logo and supporting design assets
```

## Current Highlights

- Flexible Pomodoro with supportive Taglish copy
- Android study completion alerts with custom sound
- Partner View live study countdown derived from synced session timing
- Home flow ordered as:
  `Shift Planning -> Today's Wellness -> Smart Insight -> Quick Partner Check-In -> Quick Focus`

## Status

This repository is the active codebase for the HerCare app and includes the latest Android-ready implementation used to generate the current signed release artifacts.
