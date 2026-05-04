package com.hercare.app;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

public class HerCareFirebaseMessagingService extends FirebaseMessagingService {
    private static final String NUDGE_TYPE_HYDRATION = "hydration";
    private static final String NUDGE_TYPE_MEALS = "meals";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Map<String, String> data = remoteMessage.getData();

        if (data == null || data.isEmpty()) {
            return;
        }

        String type = valueOrDefault(data.get("type"), "");

        if (!type.startsWith("partner_")) {
            return;
        }

        String title = valueOrDefault(data.get("title"), "HerCare");
        String body = valueOrDefault(data.get("body"), "Open HerCare for the latest partner update.");
        String shareCode = valueOrDefault(data.get("shareCode"), "");
        String nudgeType = valueOrDefault(data.get("nudgeType"), "");
        boolean fullScreenReminder = shouldUseFullScreenReminder(type, nudgeType);
        int notificationId = (int) (System.currentTimeMillis() % Integer.MAX_VALUE);

        PartnerReminderNotifier.showReminder(
            this,
            notificationId,
            title,
            body,
            shareCode,
            getLaunchTargetForMessageType(type, nudgeType),
            fullScreenReminder
        );
    }

    private String valueOrDefault(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value.trim();
    }

    private boolean shouldUseFullScreenReminder(String type, String nudgeType) {
        return ("partner_partner_nudge".equals(type) || "partner_owner_nudge".equals(type))
            && (NUDGE_TYPE_HYDRATION.equals(nudgeType) || NUDGE_TYPE_MEALS.equals(nudgeType));
    }

    private String getLaunchTargetForMessageType(String type, String nudgeType) {
        if ("partner_owner_nudge".equals(type)) {
            return "partner_dashboard";
        }

        return getMainLaunchTargetForNudgeType(nudgeType);
    }

    private String getMainLaunchTargetForNudgeType(String nudgeType) {
        if (NUDGE_TYPE_MEALS.equals(nudgeType)) {
            return "meals";
        }

        return "hydration";
    }
}
