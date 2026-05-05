package com.hercare.app;

import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.ContextCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "PartnerReminderBridge")
public class PartnerReminderBridgePlugin extends Plugin {
    @PluginMethod
    public void syncConfig(PluginCall call) {
        Context context = getContext();
        boolean enabled = call.getBoolean("enabled", false);
        String role = call.getString("role", "");
        String shareCode = call.getString("shareCode", "");
        String supabaseUrl = call.getString("supabaseUrl", "");
        String publishableKey = call.getString("publishableKey", "");

        if (!enabled) {
            PartnerReminderStorage.clearConfig(context);
            context.stopService(new Intent(context, PartnerReminderPollingService.class));
            call.resolve();
            return;
        }

        PartnerReminderStorage.Config config = new PartnerReminderStorage.Config(
            true,
            role,
            shareCode,
            supabaseUrl,
            publishableKey
        );

        if (!config.isComplete()) {
            call.reject("Background reminders need a valid share code, role, and Supabase config.");
            return;
        }

        PartnerReminderStorage.saveConfig(context, config);

        Intent serviceIntent = new Intent(context, PartnerReminderPollingService.class);
        serviceIntent.setAction(PartnerReminderPollingService.ACTION_REFRESH_CONFIG);
        ContextCompat.startForegroundService(context, serviceIntent);
        call.resolve();
    }

    @PluginMethod
    public void canUseFullScreenIntent(PluginCall call) {
        boolean supported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE;
        boolean allowed = true;

        if (supported) {
            NotificationManager notificationManager = context().getSystemService(NotificationManager.class);
            allowed = notificationManager != null && notificationManager.canUseFullScreenIntent();
        }

        call.resolve(JSObjectBuilder.create()
            .put("supported", supported)
            .put("allowed", allowed)
            .build());
    }

    @PluginMethod
    public void openFullScreenIntentSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            call.resolve();
            return;
        }

        Intent intent = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT);
        intent.setData(Uri.parse("package:" + context().getPackageName()));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context().startActivity(intent);
        call.resolve();
    }

    private Context context() {
        return getContext();
    }
}
