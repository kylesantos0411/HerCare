# HerCare APK Implementation Plan

This plan is for creating a personal Android APK from the current HerCare app without preparing for Play Store release yet. The goal is a repeatable, low-risk process that turns the existing Vite + React app into a local installable Android app using Capacitor.

## Current Repo State

- The app is currently a web app built with Vite + React + TypeScript.
- `npm.cmd run build` already works and outputs the production web app to `dist/`.
- There is no `android/` folder yet.
- There is no Capacitor config yet.
- App data currently relies on browser-like local storage, which should continue to work inside a Capacitor WebView.

## Final Target

- Add Capacitor to the repo.
- Generate an Android project.
- Sync the web build into Android.
- Produce a debug APK for personal installation.
- Keep the flow simple and avoid Play Store release setup for now.

## Recommended Approach

Use Capacitor as the Android wrapper.

Why this is the safest fit for the current codebase:
- It works well with Vite and static web builds.
- It lets the existing React app stay mostly unchanged.
- It supports local storage in a predictable way for this app.
- It gives a clear path from web app to Android app with minimal native code.

## Preconditions

Before starting the APK build process later, make sure these are available on the machine:

1. Node.js and `npm`
2. Android Studio
3. Android SDK installed through Android Studio
4. A working Java JDK that Android Studio can use
5. A physical Android phone or emulator for testing

Optional but strongly recommended:
- Enable USB debugging on the phone
- Install Android Platform Tools so `adb` is available
- Make a backup copy of the project folder before starting if there is no git remote or backup workflow

## Implementation Steps

### 1. Freeze a Known-Good Web Build Baseline

Purpose:
- Make sure the web app is healthy before Android wrapping begins.

Actions:
- Run `npm.cmd install` if dependencies are missing
- Run `npx.cmd tsc -b`
- Run `npm.cmd run build`

Success criteria:
- TypeScript passes
- Vite build passes
- `dist/` is updated successfully

Do not proceed if:
- The web build is failing
- Core app flows are still visibly broken in browser testing

### 2. Install Capacitor Packages

Purpose:
- Add the Android wrapper toolchain to this repo.

Actions:
- Install the core CLI and runtime packages
- Install the Android platform package

Expected packages:
- `@capacitor/core`
- `@capacitor/cli`
- `@capacitor/android`

Success criteria:
- `package.json` updates cleanly
- `node_modules` resolves the Capacitor packages

Risk note:
- This step changes dependency state. If install errors happen, stop and fix package resolution before doing any Android generation.

### 3. Initialize Capacitor

Purpose:
- Create Capacitor configuration for this app.

Actions:
- Run Capacitor init with:
  - app name: `HerCare`
  - app id: a stable local package id such as `com.hercare.app`

Expected output:
- A Capacitor config file in the repo root, usually `capacitor.config.ts`

Required config:
- `appId`
- `appName`
- `webDir: 'dist'`

Success criteria:
- Capacitor config exists
- `webDir` points to `dist`

Important note:
- The package id should be chosen carefully because changing it later creates a different Android app identity.

### 4. Build the Web App Again

Purpose:
- Make sure Capacitor will copy a fresh production build into Android.

Actions:
- Run `npm.cmd run build`

Success criteria:
- `dist/` exists and contains the current web build

Why this matters:
- Capacitor wraps the built web output, not the source files directly.

### 5. Add the Android Platform

Purpose:
- Generate the native Android project inside this repo.

Actions:
- Run Capacitor's Android add command

Expected output:
- A new `android/` directory

Success criteria:
- The Android project is created successfully
- No path or configuration errors appear

Do not proceed if:
- `android/` generation fails
- Capacitor reports missing or invalid config

### 6. Sync Web Assets Into Android

Purpose:
- Copy the built web app into the Android project and sync Capacitor dependencies.

Actions:
- Run Capacitor sync for Android

When to repeat this step:
- Every time the web app changes and a fresh APK is needed

Success criteria:
- Capacitor copies web assets into Android without errors

### 7. Open Android Studio

Purpose:
- Use Android's native build environment to create the APK.

Actions:
- Open the generated Android project in Android Studio

Initial checks inside Android Studio:
- Let Gradle finish syncing
- Confirm the project opens without missing SDK or JDK errors
- Confirm the app module is detected properly

Common blockers:
- Missing Android SDK
- JDK mismatch
- Gradle sync failure

If any of those happen:
- Fix the Android Studio environment first before attempting APK generation

### 8. Build a Debug APK

Purpose:
- Create a personal-use APK that can be installed manually on an Android device.

Preferred output for now:
- `debug` APK

Ways to build:
- From Android Studio with the debug build option
- Or by using Gradle directly from the `android/` folder

Expected output path:
- `android/app/build/outputs/apk/debug/app-debug.apk`

Success criteria:
- `app-debug.apk` is generated successfully

Important note:
- A debug APK is fine for personal testing and manual install
- A signed release APK is not required for this phase

### 9. Install the APK on an Android Device

Purpose:
- Confirm the wrapped app actually runs on a phone.

Install options:
- Copy the APK to the device and tap to install
- Or use `adb install -r`

Phone-side requirements:
- Allow installs from unknown sources if prompted

Success criteria:
- App installs successfully
- App opens without crashing on launch

### 10. Run Device Validation

Purpose:
- Make sure the Android version behaves like the web version in the areas that matter most.

Must-test flows:
1. First launch and onboarding
2. Login and logout
3. Home dashboard
4. Shift schedule creation and save
5. Meal add flow and meal history
6. Hydration save and daily counters
7. Mood check save and display
8. Sleep log save and display
9. Notes save, checklist toggle, and category views
10. Night Shift theme toggle

Success criteria:
- Data persists after closing and reopening the app
- Navigation works cleanly
- No obvious layout breaks on Android screen sizes

## Expected Repo Changes

When this plan is executed, the repo will likely gain:

- `capacitor.config.ts`
- Updated `package.json` dependencies and lockfile
- `android/` project directory

Possible optional follow-up files later:
- app icons
- splash assets
- Capacitor plugin config

## Command Sequence To Follow Later

This is the expected high-level command order:

```powershell
npx.cmd tsc -b
npm.cmd run build
npm.cmd install @capacitor/core @capacitor/cli @capacitor/android
npx.cmd cap init HerCare com.hercare.app
npm.cmd run build
npx.cmd cap add android
npx.cmd cap sync android
npx.cmd cap open android
```

After that, either:

```powershell
cd android
.\gradlew.bat assembleDebug
```

Or build the debug APK directly from Android Studio.

## Safe Checkpoints

These are the places where it is safe to stop without getting lost:

1. After the clean web build passes
2. After Capacitor config is created
3. After `android/` is generated
4. After `cap sync android` succeeds
5. After Android Studio sync succeeds
6. After `app-debug.apk` is generated

At each checkpoint:
- Keep the console output
- Do not skip ahead if the current checkpoint is failing

## Known Risks And How To Avoid Them

### 1. Web build succeeds but Android build fails

Cause:
- Android environment issues, not app code

Response:
- Fix Android Studio, SDK, Gradle, or JDK configuration before changing app code

### 2. Forgetting to rebuild before sync

Cause:
- Capacitor uses the contents of `dist/`

Response:
- Always run `npm.cmd run build` before `npx.cmd cap sync android`

### 3. Local data appears missing after reinstall

Cause:
- App uninstall clears app storage on device

Response:
- Treat reinstall as a fresh local app state unless data export is added later

### 4. Package id changed midway

Cause:
- Changing `appId` later creates a separate Android identity

Response:
- Pick one package id early and keep it stable

### 5. UI looks different on Android

Cause:
- Mobile viewport differences and WebView behavior

Response:
- Test major screens on a real phone and patch layout issues after the first APK build

## Not In Scope For This APK Phase

These are intentionally not required yet:

- Play Store release
- Android App Bundle generation
- release signing workflow
- Play Store listing assets
- backend authentication
- cloud sync
- push notifications

## Post-APK Follow-Up Candidates

After the first APK is working, the next sensible improvements would be:

1. Add app icon and splash assets
2. Add safe-area and Android-specific layout polish
3. Add Capacitor plugins only if the app needs native features later
4. Add a simple export/import or backup strategy for local data
5. Create a release-signed APK if personal distribution becomes more permanent

## Execution Rule

When we execute this plan later, do not combine multiple uncertain steps at once.

Use this pace:
1. Finish one checkpoint
2. Verify it worked
3. Only then continue to the next checkpoint

That will keep the process recoverable and avoid mid-process confusion.
