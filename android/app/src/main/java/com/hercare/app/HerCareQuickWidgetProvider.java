package com.hercare.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

public class HerCareQuickWidgetProvider extends AppWidgetProvider {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null || intent == null) {
            super.onReceive(context, intent);
            return;
        }

        String action = intent.getAction();

        if (WidgetStorage.ACTION_LOG_HYDRATION.equals(action)) {
            WidgetStorage.enqueueHydrationQuickLog(context, intent.getIntExtra(WidgetStorage.EXTRA_HYDRATION_AMOUNT, 1));
            updateAllWidgets(context);
            return;
        }

        if (WidgetStorage.ACTION_LOG_MEAL.equals(action)) {
            WidgetStorage.enqueueMealQuickLog(context, intent.getStringExtra(WidgetStorage.EXTRA_MEAL_TYPE));
            updateAllWidgets(context);
            return;
        }

        super.onReceive(context, intent);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAllWidgets(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName componentName = new ComponentName(context, HerCareQuickWidgetProvider.class);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(componentName);

        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    private static void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        WidgetStorage.Snapshot snapshot = WidgetStorage.readSnapshot(context);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.hercare_quick_widget);

        views.setTextViewText(R.id.widget_hydration_value, snapshot.getHydrationDisplay());
        views.setTextViewText(R.id.widget_meals_value, snapshot.getMealsDisplay());
        views.setTextViewText(R.id.widget_mood_value, snapshot.moodText);
        views.setTextViewText(R.id.widget_sleep_value, snapshot.sleepText);
        views.setTextViewText(R.id.widget_support_text, snapshot.supportText);

        views.setOnClickPendingIntent(R.id.widget_header_card, createLaunchPendingIntent(context, "home", 100));
        views.setOnClickPendingIntent(R.id.widget_metric_hydration_card, createLaunchPendingIntent(context, "hydration", 101));
        views.setOnClickPendingIntent(R.id.widget_metric_meals_card, createLaunchPendingIntent(context, "meals", 102));
        views.setOnClickPendingIntent(R.id.widget_metric_mood_card, createLaunchPendingIntent(context, "mood", 103));
        views.setOnClickPendingIntent(R.id.widget_metric_sleep_card, createLaunchPendingIntent(context, "sleep", 104));
        views.setOnClickPendingIntent(R.id.widget_action_hydration, createHydrationLogPendingIntent(context, 1, 201));
        views.setOnClickPendingIntent(R.id.widget_action_breakfast, createMealLogPendingIntent(context, "Breakfast", 202));
        views.setOnClickPendingIntent(R.id.widget_action_lunch, createMealLogPendingIntent(context, "Lunch", 203));
        views.setOnClickPendingIntent(R.id.widget_action_dinner, createMealLogPendingIntent(context, "Dinner", 204));
        views.setOnClickPendingIntent(R.id.widget_action_snack, createMealLogPendingIntent(context, "Snack", 205));
        views.setOnClickPendingIntent(R.id.widget_action_shift, createLaunchPendingIntent(context, "shift", 206));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static PendingIntent createLaunchPendingIntent(Context context, String target, int requestCode) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.putExtra(WidgetStorage.EXTRA_LAUNCH_TARGET, target);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        return PendingIntent.getActivity(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private static PendingIntent createHydrationLogPendingIntent(Context context, int amount, int requestCode) {
        Intent intent = new Intent(context, HerCareQuickWidgetProvider.class);
        intent.setAction(WidgetStorage.ACTION_LOG_HYDRATION);
        intent.putExtra(WidgetStorage.EXTRA_HYDRATION_AMOUNT, amount);

        return PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private static PendingIntent createMealLogPendingIntent(Context context, String mealType, int requestCode) {
        Intent intent = new Intent(context, HerCareQuickWidgetProvider.class);
        intent.setAction(WidgetStorage.ACTION_LOG_MEAL);
        intent.putExtra(WidgetStorage.EXTRA_MEAL_TYPE, mealType);

        return PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }
}
