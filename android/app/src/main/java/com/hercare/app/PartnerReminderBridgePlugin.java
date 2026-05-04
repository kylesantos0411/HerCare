package com.hercare.app;

import android.content.Context;
import android.content.Intent;
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
}
