# HerCare Partner Push Setup

This project now includes the app-side and backend-side code for real partner push alerts.

What it sends:
- quick check-in pushes
- location pin pushes

What still has to be done manually in Firebase:

## 1. Add the Android app in Firebase

In Firebase console:
- Project settings
- Your apps
- Add app
- Android

Use this package name:

```text
com.hercare.app
```

Download the generated `google-services.json` file and place it here:

```text
android/app/google-services.json
```

## 2. Enable Cloud Messaging API

In Firebase console:
- Project settings
- Cloud Messaging

Make sure the Firebase Cloud Messaging API / HTTP v1 API is enabled for this project.

## 3. Make sure billing is enabled if Functions deployment requires it

Cloud Functions for Firebase may require the Blaze plan before deployment succeeds.

## 4. Deploy the backend function

From the project root:

```powershell
cd C:\Users\kyle\Desktop\HerCare
npx firebase-tools login
npm.cmd run push:deploy
```

This repo is already pointed at:

```text
hercare-4c0b8
```

via [`.firebaserc`](c:/Users/kyle/Desktop/HerCare/.firebaserc).

## 5. Rebuild the APK

After `google-services.json` is added and the function is deployed:

```powershell
cd C:\Users\kyle\Desktop\HerCare
npm.cmd run apk:debug
```

APK output:

[app-debug.apk](c:/Users/kyle/Desktop/HerCare/android/app/build/outputs/apk/debug/app-debug.apk)

## 6. Test on both phones

1. Install the same APK on both phones.
2. On her phone:
   - open the normal app
   - go to `Settings -> Partner Sharing`
   - create the share code
3. On your phone:
   - open `Partner View`
   - enter the code
4. Leave the partner phone app in background or fully close it.
5. From her phone:
   - send a quick check-in
   - share a location pin
6. Confirm your phone receives real push notifications.

## Notes

- Push alerts only work in the Android app, not in `npm run dev`.
- Firestore live syncing still works even before push is finished.
- If the partner phone turns off `Background push alerts` in `Partner Settings`, the saved push token is cleared from Firebase.
