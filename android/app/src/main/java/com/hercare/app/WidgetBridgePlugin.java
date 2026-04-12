package com.hercare.app;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {
    @PluginMethod
    public void syncSnapshot(PluginCall call) {
        WidgetStorage.saveSnapshot(
            getContext(),
            new WidgetStorage.Snapshot(
                call.getString("trackingDayKey", null),
                call.getInt("hydrationCurrent", 0),
                call.getInt("hydrationGoal", 8),
                call.getInt("mealGoal", 4),
                call.getBoolean("breakfastLogged", false),
                call.getBoolean("lunchLogged", false),
                call.getBoolean("dinnerLogged", false),
                call.getBoolean("snackLogged", false),
                call.getString("moodText", "Good"),
                call.getString("sleepText", "Goal 7.5h"),
                call.getString("supportText", "Tap a stat to open. Use quick buttons to log.")
            )
        );

        HerCareQuickWidgetProvider.updateAllWidgets(getContext());
        call.resolve();
    }

    @PluginMethod
    public void consumeLaunchAction(PluginCall call) {
        JSObject result = new JSObject();
        result.put("target", WidgetStorage.consumePendingLaunchTarget(getContext()));
        call.resolve(result);
    }

    @PluginMethod
    public void consumePendingQuickActions(PluginCall call) {
        JSArray actions = WidgetStorage.consumePendingQuickActions(getContext());
        JSObject result = new JSObject();
        result.put("actions", actions);
        call.resolve(result);
    }
}
