package com.hercare.app;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import androidx.annotation.Nullable;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import org.json.JSONObject;

public class PartnerReminderPollingService extends Service {
    static final String ACTION_REFRESH_CONFIG = "com.hercare.app.partner_reminder.REFRESH_CONFIG";
    private static final long POLL_INTERVAL_SECONDS = 20L;
    private static final int CONNECT_TIMEOUT_MS = 10_000;
    private static final int READ_TIMEOUT_MS = 15_000;

    private ScheduledExecutorService scheduler;
    private ScheduledFuture<?> scheduledPoll;
    private final AtomicBoolean pollInFlight = new AtomicBoolean(false);

    @Override
    public void onCreate() {
        super.onCreate();
        PartnerReminderNotifier.ensureChannels(this);
        scheduler = Executors.newSingleThreadScheduledExecutor();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        PartnerReminderStorage.Config config = PartnerReminderStorage.readConfig(this);

        if (!config.isComplete()) {
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }

        startForeground(
            PartnerReminderNotifier.SERVICE_NOTIFICATION_ID,
            PartnerReminderNotifier.buildServiceNotification(this, config.role, config.shareCode).build()
        );
        schedulePolling();
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        if (scheduledPoll != null) {
            scheduledPoll.cancel(true);
            scheduledPoll = null;
        }

        if (scheduler != null) {
            scheduler.shutdownNow();
            scheduler = null;
        }

        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void schedulePolling() {
        if (scheduler == null) {
            return;
        }

        if (scheduledPoll != null && !scheduledPoll.isCancelled()) {
            return;
        }

        scheduledPoll = scheduler.scheduleWithFixedDelay(this::pollSafely, 0L, POLL_INTERVAL_SECONDS, TimeUnit.SECONDS);
    }

    private void pollSafely() {
        if (!pollInFlight.compareAndSet(false, true)) {
            return;
        }

        try {
            pollOnce();
        } catch (Exception ignored) {
            // Keep the reminder service quiet and best-effort.
        } finally {
            pollInFlight.set(false);
        }
    }

    private void pollOnce() throws Exception {
        PartnerReminderStorage.Config config = PartnerReminderStorage.readConfig(this);

        if (!config.isComplete()) {
            return;
        }

        ReminderPayload payload = fetchLatestReminder(config);

        if (payload == null || payload.createdAtIso.isEmpty()) {
            return;
        }

        String lastSeenCreatedAt = PartnerReminderStorage.getLastSeenCreatedAt(this);

        if (lastSeenCreatedAt.isEmpty()) {
            PartnerReminderStorage.setLastSeenCreatedAt(this, payload.createdAtIso);
            return;
        }

        if (payload.createdAtIso.equals(lastSeenCreatedAt)) {
            return;
        }

        PartnerReminderStorage.setLastSeenCreatedAt(this, payload.createdAtIso);
        PartnerReminderNotifier.showReminder(
            this,
            (int) (System.currentTimeMillis() % Integer.MAX_VALUE),
            payload.title,
            payload.message,
            payload.shareCode,
            payload.launchTarget,
            true
        );
    }

    private ReminderPayload fetchLatestReminder(PartnerReminderStorage.Config config) throws Exception {
        String endpoint = config.supabaseUrl + "/rest/v1/rpc/get_partner_reminder_poll";
        HttpURLConnection connection = (HttpURLConnection) new URL(endpoint).openConnection();

        try {
            connection.setRequestMethod("POST");
            connection.setConnectTimeout(CONNECT_TIMEOUT_MS);
            connection.setReadTimeout(READ_TIMEOUT_MS);
            connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Accept", "application/json");
            connection.setRequestProperty("apikey", config.publishableKey);
            connection.setRequestProperty("Authorization", "Bearer " + config.publishableKey);
            connection.setRequestProperty("x-hercare-platform", "android-background-service");

            JSONObject requestBody = new JSONObject()
                .put("share_code_input", config.shareCode)
                .put("role_input", config.role);

            byte[] requestBytes = requestBody.toString().getBytes(StandardCharsets.UTF_8);

            try (OutputStream outputStream = connection.getOutputStream()) {
                outputStream.write(requestBytes);
            }

            int responseCode = connection.getResponseCode();

            if (responseCode < 200 || responseCode >= 300) {
                return null;
            }

            String responseText = readStream(connection.getInputStream());

            if (responseText.isEmpty() || "null".equals(responseText)) {
                return null;
            }

            JSONObject responseJson = new JSONObject(responseText);
            String createdAtIso = responseJson.optString("createdAtIso", "").trim();

            if (createdAtIso.isEmpty()) {
                return null;
            }

            return new ReminderPayload(
                responseJson.optString("shareCode", config.shareCode),
                responseJson.optString("title", getString(R.string.partner_reminder_default_title)),
                responseJson.optString("message", getString(R.string.partner_reminder_default_message)),
                createdAtIso,
                responseJson.optString("launchTarget", "hydration")
            );
        } finally {
            connection.disconnect();
        }
    }

    private String readStream(InputStream inputStream) throws Exception {
        if (inputStream == null) {
            return "";
        }

        StringBuilder builder = new StringBuilder();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String line;

            while ((line = reader.readLine()) != null) {
                builder.append(line);
            }
        }

        return builder.toString().trim();
    }

    private static final class ReminderPayload {
        final String shareCode;
        final String title;
        final String message;
        final String createdAtIso;
        final String launchTarget;

        ReminderPayload(String shareCode, String title, String message, String createdAtIso, String launchTarget) {
            this.shareCode = shareCode == null ? "" : shareCode.trim();
            this.title = title == null ? "" : title.trim();
            this.message = message == null ? "" : message.trim();
            this.createdAtIso = createdAtIso == null ? "" : createdAtIso.trim();
            this.launchTarget = launchTarget == null ? "hydration" : launchTarget.trim();
        }
    }
}
