package com.hercare.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

public class HerCarePartnerWidgetProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAllWidgets(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName componentName = new ComponentName(context, HerCarePartnerWidgetProvider.class);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(componentName);

        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    private static void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        WidgetStorage.PartnerSnapshot snapshot = WidgetStorage.readPartnerSnapshot(context);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.hercare_partner_widget);

        views.setTextViewText(R.id.partner_widget_title, snapshot.ownerNameText);
        views.setTextViewText(R.id.partner_widget_status, snapshot.statusText);
        views.setTextViewText(R.id.partner_widget_updated_text, snapshot.updatedText);
        views.setTextViewText(R.id.partner_widget_hydration_value, snapshot.hydrationText);
        views.setTextViewText(R.id.partner_widget_meals_value, snapshot.mealsText);
        views.setTextViewText(R.id.partner_widget_study_value, snapshot.studyText);
        views.setTextViewText(R.id.partner_widget_note_value, snapshot.noteText);

        views.setOnClickPendingIntent(R.id.partner_widget_header_card, createLaunchPendingIntent(context, "partner_dashboard", 300));
        views.setOnClickPendingIntent(R.id.partner_widget_metric_hydration_card, createLaunchPendingIntent(context, "partner_dashboard", 301));
        views.setOnClickPendingIntent(R.id.partner_widget_metric_meals_card, createLaunchPendingIntent(context, "partner_dashboard", 302));
        views.setOnClickPendingIntent(R.id.partner_widget_study_card, createLaunchPendingIntent(context, "partner_dashboard", 303));
        views.setOnClickPendingIntent(R.id.partner_widget_note_card, createLaunchPendingIntent(context, "partner_dashboard", 304));
        views.setOnClickPendingIntent(R.id.partner_widget_action_board, createLaunchPendingIntent(context, "partner_dashboard", 305));
        views.setOnClickPendingIntent(R.id.partner_widget_action_settings, createLaunchPendingIntent(context, "partner_settings", 306));

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
}
