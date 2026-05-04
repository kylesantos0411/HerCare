package com.hercare.app;

import android.content.Context;
import android.content.SharedPreferences;

final class PartnerReminderStorage {
    private static final String PREFS_NAME = "hercare_partner_reminder_state";
    private static final String KEY_ENABLED = "enabled";
    private static final String KEY_ROLE = "role";
    private static final String KEY_SHARE_CODE = "share_code";
    private static final String KEY_SUPABASE_URL = "supabase_url";
    private static final String KEY_PUBLISHABLE_KEY = "publishable_key";
    private static final String KEY_LAST_SEEN_CREATED_AT = "last_seen_created_at";

    static final class Config {
        final boolean enabled;
        final String role;
        final String shareCode;
        final String supabaseUrl;
        final String publishableKey;

        Config(boolean enabled, String role, String shareCode, String supabaseUrl, String publishableKey) {
            this.enabled = enabled;
            this.role = sanitizeRole(role);
            this.shareCode = sanitizeShareCode(shareCode);
            this.supabaseUrl = sanitizeUrl(supabaseUrl);
            this.publishableKey = sanitizeKey(publishableKey);
        }

        boolean isComplete() {
            return enabled
                && !role.isEmpty()
                && !shareCode.isEmpty()
                && !supabaseUrl.isEmpty()
                && !publishableKey.isEmpty();
        }
    }

    private PartnerReminderStorage() {}

    static void saveConfig(Context context, Config config) {
        SharedPreferences preferences = getPreferences(context);
        Config previous = readConfig(context);
        boolean resetLastSeen = !previous.shareCode.equals(config.shareCode) || !previous.role.equals(config.role);

        SharedPreferences.Editor editor = preferences
            .edit()
            .putBoolean(KEY_ENABLED, config.enabled)
            .putString(KEY_ROLE, config.role)
            .putString(KEY_SHARE_CODE, config.shareCode)
            .putString(KEY_SUPABASE_URL, config.supabaseUrl)
            .putString(KEY_PUBLISHABLE_KEY, config.publishableKey);

        if (resetLastSeen) {
            editor.remove(KEY_LAST_SEEN_CREATED_AT);
        }

        editor.apply();
    }

    static Config readConfig(Context context) {
        SharedPreferences preferences = getPreferences(context);
        return new Config(
            preferences.getBoolean(KEY_ENABLED, false),
            preferences.getString(KEY_ROLE, ""),
            preferences.getString(KEY_SHARE_CODE, ""),
            preferences.getString(KEY_SUPABASE_URL, ""),
            preferences.getString(KEY_PUBLISHABLE_KEY, "")
        );
    }

    static void clearConfig(Context context) {
        getPreferences(context)
            .edit()
            .putBoolean(KEY_ENABLED, false)
            .remove(KEY_ROLE)
            .remove(KEY_SHARE_CODE)
            .remove(KEY_SUPABASE_URL)
            .remove(KEY_PUBLISHABLE_KEY)
            .remove(KEY_LAST_SEEN_CREATED_AT)
            .apply();
    }

    static String getLastSeenCreatedAt(Context context) {
        return sanitizeSimple(getPreferences(context).getString(KEY_LAST_SEEN_CREATED_AT, ""));
    }

    static void setLastSeenCreatedAt(Context context, String createdAtIso) {
        getPreferences(context).edit().putString(KEY_LAST_SEEN_CREATED_AT, sanitizeSimple(createdAtIso)).apply();
    }

    private static SharedPreferences getPreferences(Context context) {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    private static String sanitizeRole(String value) {
        String cleaned = sanitizeSimple(value).toLowerCase();
        return ("owner".equals(cleaned) || "partner".equals(cleaned)) ? cleaned : "";
    }

    private static String sanitizeShareCode(String value) {
        return sanitizeSimple(value).toUpperCase().replaceAll("[^A-Z0-9]", "");
    }

    private static String sanitizeUrl(String value) {
        String cleaned = sanitizeSimple(value);
        if (!cleaned.startsWith("https://")) {
            return "";
        }

        return cleaned.endsWith("/") ? cleaned.substring(0, cleaned.length() - 1) : cleaned;
    }

    private static String sanitizeKey(String value) {
        String cleaned = sanitizeSimple(value);
        return cleaned.startsWith("sb_publishable_") ? cleaned : "";
    }

    private static String sanitizeSimple(String value) {
        return value == null ? "" : value.trim();
    }
}
