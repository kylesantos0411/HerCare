package com.hercare.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

public class HerCareFirebaseMessagingService extends FirebaseMessagingService {
    private static final String ALERT_CHANNEL_ID = "hercare-partner-alerts";
    private static final String REMINDER_CHANNEL_ID = "hercare-partner-reminders";

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
        boolean fullScreenReminder = "partner_partner_nudge".equals(type) && "hydration".equals(nudgeType);
        int notificationId = (int) (System.currentTimeMillis() % Integer.MAX_VALUE);

        ensureChannels();
        showNotification(notificationId, title, body, shareCode, type, fullScreenReminder);
    }

    private void showNotification(
        int notificationId,
        String title,
        String body,
        String shareCode,
        String type,
        boolean fullScreenReminder
    ) {
        PendingIntent contentIntent = fullScreenReminder
            ? createReminderPendingIntent(notificationId, title, body, shareCode)
            : createAppPendingIntent(type);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(
            this,
            fullScreenReminder ? REMINDER_CHANNEL_ID : ALERT_CHANNEL_ID
        )
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(fullScreenReminder ? NotificationCompat.PRIORITY_MAX : NotificationCompat.PRIORITY_HIGH)
            .setCategory(fullScreenReminder ? NotificationCompat.CATEGORY_REMINDER : NotificationCompat.CATEGORY_MESSAGE)
            .setContentIntent(contentIntent);

        if (fullScreenReminder) {
            builder.setFullScreenIntent(contentIntent, true);
        }

        NotificationManagerCompat.from(this).notify(notificationId, builder.build());
    }

    private PendingIntent createAppPendingIntent(String type) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        String launchTarget = "partner_dashboard";

        if ("partner_partner_nudge".equals(type)) {
            launchTarget = "hydration";
        }

        intent.putExtra(WidgetStorage.EXTRA_LAUNCH_TARGET, launchTarget);

        return PendingIntent.getActivity(
            this,
            launchTarget.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private PendingIntent createReminderPendingIntent(int notificationId, String title, String body, String shareCode) {
        Intent intent = new Intent(this, PartnerHydrationReminderActivity.class);
        intent.putExtra(PartnerHydrationReminderActivity.EXTRA_NOTIFICATION_ID, notificationId);
        intent.putExtra(PartnerHydrationReminderActivity.EXTRA_TITLE, title);
        intent.putExtra(PartnerHydrationReminderActivity.EXTRA_MESSAGE, body);
        intent.putExtra(PartnerHydrationReminderActivity.EXTRA_SHARE_CODE, shareCode);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        return PendingIntent.getActivity(
            this,
            notificationId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private void ensureChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        if (manager == null) {
            return;
        }

        NotificationChannel alertsChannel = new NotificationChannel(
            ALERT_CHANNEL_ID,
            getString(R.string.partner_alerts_channel_name),
            NotificationManager.IMPORTANCE_HIGH
        );
        alertsChannel.setDescription(getString(R.string.partner_alerts_channel_description));

        NotificationChannel reminderChannel = new NotificationChannel(
            REMINDER_CHANNEL_ID,
            getString(R.string.partner_reminder_channel_name),
            NotificationManager.IMPORTANCE_HIGH
        );
        reminderChannel.setDescription(getString(R.string.partner_reminder_channel_description));
        reminderChannel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);

        manager.createNotificationChannel(alertsChannel);
        manager.createNotificationChannel(reminderChannel);
    }

    private String valueOrDefault(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value.trim();
    }
}
