package com.hercare.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import com.getcapacitor.JSArray;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

final class WidgetStorage {
    private static final String PREFS_NAME = "hercare_widget_state";
    private static final String KEY_TRACKING_DAY = "tracking_day";
    private static final String KEY_HYDRATION_CURRENT = "hydration_current";
    private static final String KEY_HYDRATION_GOAL = "hydration_goal";
    private static final String KEY_MEAL_GOAL = "meal_goal";
    private static final String KEY_BREAKFAST_LOGGED = "breakfast_logged";
    private static final String KEY_LUNCH_LOGGED = "lunch_logged";
    private static final String KEY_DINNER_LOGGED = "dinner_logged";
    private static final String KEY_SNACK_LOGGED = "snack_logged";
    private static final String KEY_MOOD_TEXT = "mood_text";
    private static final String KEY_SLEEP_TEXT = "sleep_text";
    private static final String KEY_SUPPORT_TEXT = "support_text";
    private static final String KEY_PENDING_TARGET = "pending_target";
    private static final String KEY_PENDING_ACTIONS = "pending_actions";

    private static final int DEFAULT_HYDRATION_GOAL = 8;
    private static final int DEFAULT_MEAL_GOAL = 4;
    private static final String DEFAULT_SUPPORT_TEXT = "Tap a stat to open. Use quick buttons to log.";

    static final String EXTRA_LAUNCH_TARGET = "com.hercare.app.widget.LAUNCH_TARGET";
    static final String ACTION_LOG_HYDRATION = "com.hercare.app.widget.LOG_HYDRATION";
    static final String ACTION_LOG_MEAL = "com.hercare.app.widget.LOG_MEAL";
    static final String EXTRA_HYDRATION_AMOUNT = "com.hercare.app.widget.HYDRATION_AMOUNT";
    static final String EXTRA_MEAL_TYPE = "com.hercare.app.widget.MEAL_TYPE";

    private WidgetStorage() {}

    static final class Snapshot {
        String trackingDayKey;
        int hydrationCurrent;
        int hydrationGoal;
        int mealGoal;
        boolean breakfastLogged;
        boolean lunchLogged;
        boolean dinnerLogged;
        boolean snackLogged;
        String moodText;
        String sleepText;
        String supportText;

        Snapshot(
            String trackingDayKey,
            int hydrationCurrent,
            int hydrationGoal,
            int mealGoal,
            boolean breakfastLogged,
            boolean lunchLogged,
            boolean dinnerLogged,
            boolean snackLogged,
            String moodText,
            String sleepText,
            String supportText
        ) {
            this.trackingDayKey = trackingDayKey;
            this.hydrationCurrent = hydrationCurrent;
            this.hydrationGoal = hydrationGoal;
            this.mealGoal = mealGoal;
            this.breakfastLogged = breakfastLogged;
            this.lunchLogged = lunchLogged;
            this.dinnerLogged = dinnerLogged;
            this.snackLogged = snackLogged;
            this.moodText = moodText;
            this.sleepText = sleepText;
            this.supportText = supportText;
        }

        int getCompletedMealCount() {
            int count = 0;

            if (breakfastLogged) {
                count += 1;
            }

            if (lunchLogged) {
                count += 1;
            }

            if (dinnerLogged) {
                count += 1;
            }

            if (snackLogged) {
                count += 1;
            }

            return count;
        }

        String getHydrationDisplay() {
            return hydrationCurrent + "/" + hydrationGoal;
        }

        String getMealsDisplay() {
            return getCompletedMealCount() + "/" + mealGoal;
        }

        void markMealLogged(String mealType) {
            switch (mealType) {
                case "Breakfast":
                    breakfastLogged = true;
                    break;
                case "Lunch":
                    lunchLogged = true;
                    break;
                case "Dinner":
                    dinnerLogged = true;
                    break;
                case "Snack":
                    snackLogged = true;
                    break;
                default:
                    break;
            }
        }
    }

    static Snapshot readSnapshot(Context context) {
        SharedPreferences preferences = getPreferences(context);
        Snapshot snapshot = readSnapshot(preferences);
        return normalizeForToday(preferences, snapshot);
    }

    static void saveSnapshot(Context context, Snapshot snapshot) {
        SharedPreferences preferences = getPreferences(context);
        saveSnapshot(preferences, sanitizeSnapshot(snapshot));
    }

    static void captureLaunchTarget(Context context, Intent intent) {
        String target = sanitizeTarget(intent.getStringExtra(EXTRA_LAUNCH_TARGET));

        if (target == null) {
            return;
        }

        getPreferences(context).edit().putString(KEY_PENDING_TARGET, target).apply();
    }

    static String consumePendingLaunchTarget(Context context) {
        SharedPreferences preferences = getPreferences(context);
        String target = sanitizeTarget(preferences.getString(KEY_PENDING_TARGET, null));

        preferences.edit().remove(KEY_PENDING_TARGET).apply();
        return target;
    }

    static void enqueueHydrationQuickLog(Context context, int amount) {
        int safeAmount = Math.max(1, Math.min(amount, 6));
        SharedPreferences preferences = getPreferences(context);
        Snapshot snapshot = normalizeForToday(preferences, readSnapshot(preferences));
        long loggedAtMillis = System.currentTimeMillis();

        snapshot.hydrationCurrent += safeAmount;
        snapshot.supportText = safeAmount == 1
            ? "Water +1 logged from the widget."
            : "Water +" + safeAmount + " logged from the widget.";

        saveSnapshot(preferences, snapshot);
        appendPendingAction(preferences, buildHydrationAction(safeAmount, loggedAtMillis));
    }

    static void enqueueMealQuickLog(Context context, String mealType) {
        String sanitizedMealType = sanitizeMealType(mealType);

        if (sanitizedMealType == null) {
            return;
        }

        SharedPreferences preferences = getPreferences(context);
        Snapshot snapshot = normalizeForToday(preferences, readSnapshot(preferences));
        long loggedAtMillis = System.currentTimeMillis();

        snapshot.markMealLogged(sanitizedMealType);
        snapshot.supportText = sanitizedMealType + " logged from the widget.";

        saveSnapshot(preferences, snapshot);
        appendPendingAction(preferences, buildMealAction(sanitizedMealType, loggedAtMillis));
    }

    static JSArray consumePendingQuickActions(Context context) {
        SharedPreferences preferences = getPreferences(context);
        String rawActions = preferences.getString(KEY_PENDING_ACTIONS, "[]");
        preferences.edit().remove(KEY_PENDING_ACTIONS).apply();

        try {
            return new JSArray(rawActions);
        } catch (JSONException ignored) {
            return new JSArray();
        }
    }

    private static SharedPreferences getPreferences(Context context) {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    private static Snapshot readSnapshot(SharedPreferences preferences) {
        return new Snapshot(
            preferences.getString(KEY_TRACKING_DAY, getTodayKey()),
            sanitizeNonNegativeInt(preferences.getInt(KEY_HYDRATION_CURRENT, 0), 0),
            sanitizePositiveInt(preferences.getInt(KEY_HYDRATION_GOAL, DEFAULT_HYDRATION_GOAL), DEFAULT_HYDRATION_GOAL),
            sanitizePositiveInt(preferences.getInt(KEY_MEAL_GOAL, DEFAULT_MEAL_GOAL), DEFAULT_MEAL_GOAL),
            preferences.getBoolean(KEY_BREAKFAST_LOGGED, false),
            preferences.getBoolean(KEY_LUNCH_LOGGED, false),
            preferences.getBoolean(KEY_DINNER_LOGGED, false),
            preferences.getBoolean(KEY_SNACK_LOGGED, false),
            sanitizeText(preferences.getString(KEY_MOOD_TEXT, null), "Good", 24),
            sanitizeText(preferences.getString(KEY_SLEEP_TEXT, null), "Goal 7.5h", 24),
            sanitizeText(preferences.getString(KEY_SUPPORT_TEXT, null), DEFAULT_SUPPORT_TEXT, 96)
        );
    }

    private static Snapshot normalizeForToday(SharedPreferences preferences, Snapshot snapshot) {
        String todayKey = getTodayKey();
        Snapshot normalized = sanitizeSnapshot(snapshot);

        if (!todayKey.equals(normalized.trackingDayKey)) {
            normalized.trackingDayKey = todayKey;
            normalized.hydrationCurrent = 0;
            normalized.breakfastLogged = false;
            normalized.lunchLogged = false;
            normalized.dinnerLogged = false;
            normalized.snackLogged = false;
            normalized.supportText = DEFAULT_SUPPORT_TEXT;
            saveSnapshot(preferences, normalized);
        }

        return normalized;
    }

    private static Snapshot sanitizeSnapshot(Snapshot snapshot) {
        return new Snapshot(
            sanitizeDayKey(snapshot.trackingDayKey),
            sanitizeNonNegativeInt(snapshot.hydrationCurrent, 0),
            sanitizePositiveInt(snapshot.hydrationGoal, DEFAULT_HYDRATION_GOAL),
            sanitizePositiveInt(snapshot.mealGoal, DEFAULT_MEAL_GOAL),
            snapshot.breakfastLogged,
            snapshot.lunchLogged,
            snapshot.dinnerLogged,
            snapshot.snackLogged,
            sanitizeText(snapshot.moodText, "Good", 24),
            sanitizeText(snapshot.sleepText, "Goal 7.5h", 24),
            sanitizeText(snapshot.supportText, DEFAULT_SUPPORT_TEXT, 96)
        );
    }

    private static void saveSnapshot(SharedPreferences preferences, Snapshot snapshot) {
        Snapshot normalized = sanitizeSnapshot(snapshot);

        preferences
            .edit()
            .putString(KEY_TRACKING_DAY, normalized.trackingDayKey)
            .putInt(KEY_HYDRATION_CURRENT, normalized.hydrationCurrent)
            .putInt(KEY_HYDRATION_GOAL, normalized.hydrationGoal)
            .putInt(KEY_MEAL_GOAL, normalized.mealGoal)
            .putBoolean(KEY_BREAKFAST_LOGGED, normalized.breakfastLogged)
            .putBoolean(KEY_LUNCH_LOGGED, normalized.lunchLogged)
            .putBoolean(KEY_DINNER_LOGGED, normalized.dinnerLogged)
            .putBoolean(KEY_SNACK_LOGGED, normalized.snackLogged)
            .putString(KEY_MOOD_TEXT, normalized.moodText)
            .putString(KEY_SLEEP_TEXT, normalized.sleepText)
            .putString(KEY_SUPPORT_TEXT, normalized.supportText)
            .apply();
    }

    private static void appendPendingAction(SharedPreferences preferences, JSONObject action) {
        JSONArray actions = readPendingActions(preferences);
        actions.put(action);
        preferences.edit().putString(KEY_PENDING_ACTIONS, actions.toString()).apply();
    }

    private static JSONArray readPendingActions(SharedPreferences preferences) {
        try {
            return new JSONArray(preferences.getString(KEY_PENDING_ACTIONS, "[]"));
        } catch (JSONException ignored) {
            return new JSONArray();
        }
    }

    private static JSONObject buildHydrationAction(int amount, long loggedAtMillis) {
        JSONObject action = new JSONObject();

        try {
            action.put("kind", "hydration");
            action.put("amount", amount);
            action.put("loggedAtMillis", loggedAtMillis);
        } catch (JSONException ignored) {}

        return action;
    }

    private static JSONObject buildMealAction(String mealType, long loggedAtMillis) {
        JSONObject action = new JSONObject();

        try {
            action.put("kind", "meal");
            action.put("mealType", mealType);
            action.put("loggedAtMillis", loggedAtMillis);
        } catch (JSONException ignored) {}

        return action;
    }

    private static String getTodayKey() {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
    }

    private static String sanitizeDayKey(String value) {
        String cleaned = value == null ? "" : value.trim();
        return cleaned.isEmpty() ? getTodayKey() : cleaned;
    }

    private static int sanitizeNonNegativeInt(int value, int fallback) {
        return value >= 0 ? value : fallback;
    }

    private static int sanitizePositiveInt(int value, int fallback) {
        return value > 0 ? value : fallback;
    }

    private static String sanitizeMealType(String value) {
        if (value == null) {
            return null;
        }

        switch (value.trim()) {
            case "Breakfast":
            case "Lunch":
            case "Dinner":
            case "Snack":
                return value.trim();
            default:
                return null;
        }
    }

    private static String sanitizeTarget(String value) {
        if (value == null) {
            return null;
        }

        switch (value.trim()) {
            case "home":
            case "hydration":
            case "meals":
            case "mood":
            case "sleep":
            case "shift":
            case "notes":
                return value.trim();
            default:
                return null;
        }
    }

    private static String sanitizeText(String value, String fallback, int maxLength) {
        String cleaned = value == null ? "" : value.trim().replaceAll("\\s+", " ");

        if (cleaned.isEmpty()) {
            return fallback;
        }

        if (cleaned.length() <= maxLength) {
            return cleaned;
        }

        return cleaned.substring(0, Math.max(0, maxLength - 1)).trim() + "\u2026";
    }
}
