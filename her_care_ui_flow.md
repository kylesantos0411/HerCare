# HerCare App – Full UI Flow & Navigation

## Overview
A Nurse Shift Companion + Wellness Tracker designed for adaptive schedules, daily health tracking, and emotional support.

---

## Core Navigation Structure

Bottom Navigation Tabs:
- Home
- Meals
- Wellness
- Notes
- You

Shift management is accessed via Home.

---

## First-Time User Flow

1. Splash Screen
2. Welcome Screen
3. Personal Setup
4. Shift Setup
5. Wellness Goals Setup
6. Notification Preferences
7. Home Dashboard

---

## Screen-by-Screen UI Flow

### Splash Screen
- Logo (center)
- App name: HerCare
- Subtitle: "For busy days, long shifts, and gentle care."
- Auto-transition (2 seconds)

---

### Welcome Screen
- Illustration (nurse + icons)
- Heading: "Built to care for the one who cares for everyone."
- Description text
- Buttons:
  - Get Started → Personal Setup
  - Already Set Up → Home

---

### Personal Setup
Fields:
- Name
- Role
- Preferred greeting name
- Optional: Age, Height, Weight
- Goal selection

Navigation:
- Next → Shift Setup

---

### Shift Setup
Options:
- Fixed Day
- Fixed Night
- Rotating
- Manual

Fields:
- Start time
- End time

Navigation:
- Next → Wellness Goals

---

### Wellness Goals Setup
- Water target
- Meal frequency
- Sleep target
- Mood check frequency

Navigation:
- Next → Notifications

---

### Notification Preferences
Toggles:
- Hydration
- Meals
- Sleep
- Pre-shift
- Post-shift
- Encouragement messages

Navigation:
- Finish → Home

---

## Main App Screens

### Home Dashboard
Sections:
- Greeting + Shift preview
- Today’s Shift Card
- Wellness Snapshot
- Quick Actions
- Encouragement Card
- Daily Summary

Navigation:
- Shift Card → Shift Details
- Quick actions → respective screens

---

### Shift Details
- Today’s shift
- Weekly calendar
- Add/Edit shift

Modal Fields:
- Date
- Shift type
- Time
- Notes

---

### Meals Tab
Sections:
- Meal progress
- Quick log buttons
- Meal history
- Suggestions
- Water shortcut

Navigation:
- Add Meal → Add Meal Screen

---

### Add Meal Screen
Fields:
- Meal type
- Time
- Status
- Notes
- Optional photo

Navigation:
- Save → Meals

---

### Wellness Tab
Sections:
- Hydration tracker
- Sleep tracker
- Mood check
- Trend graphs
- Suggestions

Navigation:
- Hydration → Hydration Screen
- Sleep → Sleep Log
- Mood → Mood Check

---

### Mood Check
Fields:
- Mood selection
- Energy level
- Stress level
- Notes

Navigation:
- Save → Wellness

---

### Sleep Log
Fields:
- Sleep start/end
- Quality
- Notes

Navigation:
- Save → Wellness

---

### Hydration Screen
- Intake buttons
- History log
- Reminder settings

Navigation:
- Save → Wellness

---

### Notes Tab
Sections:
- Notes list
- Categories
- Add note

Navigation:
- Add → Note Editor

---

### Note Editor
Fields:
- Title
- Category
- Content
- Reminder toggle

Navigation:
- Save → Notes

---

### You Tab
Sections:
- Messages
- Special dates
- Comfort corner
- Open When cards

Navigation:
- Open card → Open When Screen

---

### Open When Screen
- Personalized message
- Optional image/audio

---

### Settings
- Profile
- Shift preferences
- Notifications
- Theme

---

## Navigation Map

Splash → Welcome → Setup → Home

Home → Shift / Meals / Wellness / Notes / You

Meals → Add Meal
Wellness → Mood / Sleep / Hydration
Notes → Editor
You → Messages / Open When

---

## UI Style Guide

- Soft pastel colors
- Rounded cards
- Minimal layout
- Clean typography

Suggested Colors:
- Background: Off-white
- Primary: Lavender
- Secondary: Sage green
- Accent: Coral

---

## Minimum Viable Screens

- Home
- Shift Details
- Meals
- Add Meal
- Wellness
- Mood Check
- Notes
- You
- Settings

---

## Build Priority

1. Home
2. Shift
3. Meals
4. Hydration
5. Mood
6. Notes
7. You
8. Sleep

---

## Suggested Page Structure

- SplashPage
- WelcomePage
- SetupPages
- MainNavigationPage
  - HomePage
  - MealsPage
  - WellnessPage
  - NotesPage
  - YouPage
- ShiftDetailsPage
- AddMealPage
- MoodCheckPage
- SleepLogPage
- HydrationPage
- NoteEditorPage
- SettingsPage

---

## Future Enhancements

- Cycle tracker
- Grocery planner
- Voice messages
- Widgets
- Smart AI suggestions

---

## Notes

Keep the app simple, adaptive, and emotionally supportive. Avoid overcomplication in early builds.

