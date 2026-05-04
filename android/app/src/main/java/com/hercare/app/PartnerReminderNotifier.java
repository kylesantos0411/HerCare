package com.hercare.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

final class PartnerReminderNotifier {
    static final String ALERT_CHANNEL_ID = "hercare-partner-alerts";
    static final String REMINDER_CHANNEL_ID = "hercare-partner-reminders";
    static final String SERVICE_CHANNEL_ID = "hercare-partner-reminder-service";
    static final int SERVICE_NOTIFICATION_ID = 49021;

    private PartnerReminderNotifier() {}

    static void ensureChannels(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        if (manager == null) {
            return;
        }

        NotificationChannel alertsChannel = new NotificationChannel(
            ALERT_CHANNEL_ID,
            context.getString(R.string.partner_alerts_channel_name),
            NotificationManager.IMPORTANCE_HIGH
        );
        alertsChannel.setDescription(context.getString(R.string.partner_alerts_channel_description));

        NotificationChannel reminderChannel = new NotificationChannel(
            REMINDER_CHANNEL_ID,
            context.getString(R.string.partner_reminder_channel_name),
            NotificationManager.IMPORTANCE_HIGH
        );
        reminderChannel.setDescription(context.getString(R.string.partner_reminder_channel_description));
        reminderChannel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);

        NotificationChannel serviceChannel = new NotificationChannel(
            SERVICE_CHANNEL_ID,
            context.getString(R.string.partner_reminder_service_channel_name),
            NotificationManager.IMPORTANCE_LOW
        );
        serviceChannel.setDescription(context.getString(R.string.partner_reminder_service_channel_description));
        serviceChannel.setShowBadge(false);

        manager.createNotificationChannel(alertsChannel);
        manager.createNotificationChannel(reminderChannel);
        manager.createNotificationChannel(serviceChannel);
    }

    static NotificationCompat.Builder buildServiceNotification(Context context, String role, String shareCode) {
        String roleLabel = "partner".equals(role)
            ? context.getString(R.string.partner_reminder_service_role_partner)
            : context.getString(R.string.partner_reminder_service_role_owner);
        String body = context.getString(R.string.partner_reminder_service_text, roleLabel, shareCode);

        Intent intent = new Intent(context, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        String launchTarget = "partner".equals(role) ? "partner_dashboard" : "home";
        intent.putExtra(WidgetStorage.EXTRA_LAUNCH_TARGET, launchTarget);

        PendingIntent contentIntent = PendingIntent.getActivity(
            context,
            launchTarget.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(context, SERVICE_CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(context.getString(R.string.partner_reminder_service_title))
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setContentIntent(contentIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE);
    }

    static void showReminder(
        Context context,
        int notificationId,
        String title,
        String body,
        String shareCode,
        String launchTarget,
        boolean fullScreenReminder
    ) {
        ensureChannels(context);

        PendingIntent contentIntent = fullScreenReminder
            ? createReminderPendingIntent(context, notificationId, title, body, shareCode, launchTarget)
            : createAppPendingIntent(context, launchTarget);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(
            context,
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

        NotificationManagerCompat.from(context).notify(notificationId, builder.build());
    }

    private static PendingIntent createAppPendingIntent(Context context, String launchTarget) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra(WidgetStorage.EXTRA_LAUNCH_TARGET, sanitizeLaunchTarget(launchTarget));

        return PendingIntent.getActivity(
            context,
            sanitizeLaunchTarget(launchTarget).hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private static PendingIntent createReminderPendingIntent(
        Context context,
        int notificationId,
        String title,
        String body,
        String shareCode,
        String launchTarget
    ) {
        Intent intent = new Intent(context, PartnerHydrationReminderActivity.class);
        intent.putExtra(PartnerHydrationReminderActivity.EXTRA_NOTIFICATION_ID, notificationId);
        intent.putExtra(PartnerHydrationReminderActivity.EXTRA_TITLE, title);
        intent.putExtra(PartnerHydrationReminderActivity.EXTRA_MESSAGE, body);
        intent.putExtra(PartnerHydrationReminderActivity.EXTRA_SHARE_CODE, shareCode);
        intent.putExtra(PartnerHydrationReminderActivity.EXTRA_LAUNCH_TARGET, sanitizeLaunchTarget(launchTarget));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        return PendingIntent.getActivity(
            context,
            notificationId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private static String sanitizeLaunchTarget(String launchTarget) {
        if ("meals".equals(launchTarget) || "partner_dashboard".equals(launchTarget) || "partner_settings".equals(launchTarget)) {
            return launchTarget;
        }

        return "hydration";
    }
}
