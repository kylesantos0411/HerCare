package com.hercare.app;

import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

public class PartnerHydrationReminderActivity extends AppCompatActivity {
    public static final String EXTRA_NOTIFICATION_ID = "partner_reminder_notification_id";
    public static final String EXTRA_TITLE = "partner_reminder_title";
    public static final String EXTRA_MESSAGE = "partner_reminder_message";
    public static final String EXTRA_SHARE_CODE = "partner_reminder_share_code";
    public static final String EXTRA_LAUNCH_TARGET = "partner_reminder_launch_target";

    private static final long REMINDER_DURATION_MS = 60_000L;

    private CountDownTimer countDownTimer;
    private int notificationId;
    private String launchTarget;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_partner_hydration_reminder);
        keepScreenVisible();

        notificationId = getIntent().getIntExtra(EXTRA_NOTIFICATION_ID, -1);
        String title = getIntent().getStringExtra(EXTRA_TITLE);
        String message = getIntent().getStringExtra(EXTRA_MESSAGE);
        launchTarget = getIntent().getStringExtra(EXTRA_LAUNCH_TARGET);

        TextView titleView = findViewById(R.id.partner_reminder_title);
        TextView messageView = findViewById(R.id.partner_reminder_message);
        TextView timerView = findViewById(R.id.partner_reminder_timer);
        Button openReminderButton = findViewById(R.id.partner_reminder_open_button);
        Button dismissButton = findViewById(R.id.partner_reminder_dismiss_button);

        titleView.setText(title == null || title.trim().isEmpty()
            ? getString(R.string.partner_reminder_default_title)
            : title);
        messageView.setText(message == null || message.trim().isEmpty()
            ? getString(R.string.partner_reminder_default_message)
            : message);
        openReminderButton.setText(getOpenButtonTextResId());

        openReminderButton.setOnClickListener(view -> {
            cancelNotification();
            openReminderTarget();
            finish();
        });

        dismissButton.setOnClickListener(view -> {
            cancelNotification();
            finish();
        });

        countDownTimer = new CountDownTimer(REMINDER_DURATION_MS, 1000L) {
            @Override
            public void onTick(long millisUntilFinished) {
                long secondsRemaining = Math.max(1L, millisUntilFinished / 1000L);
                timerView.setText(getString(R.string.partner_reminder_timer_format, secondsRemaining));
            }

            @Override
            public void onFinish() {
                timerView.setText(getString(R.string.partner_reminder_timer_done));
                cancelNotification();
                finish();
            }
        };

        countDownTimer.start();
    }

    @Override
    protected void onDestroy() {
        if (countDownTimer != null) {
            countDownTimer.cancel();
        }

        super.onDestroy();
    }

    private void keepScreenVisible() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        }

        getWindow().addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                | WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON
                | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
        );
    }

    private void openReminderTarget() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.putExtra(WidgetStorage.EXTRA_LAUNCH_TARGET, getLaunchTarget());
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(intent);
    }

    private String getLaunchTarget() {
        if ("meals".equals(launchTarget)) {
            return "meals";
        }

        if ("partner_dashboard".equals(launchTarget)) {
            return "partner_dashboard";
        }

        return "hydration";
    }

    private int getOpenButtonTextResId() {
        String target = getLaunchTarget();

        if ("meals".equals(target)) {
            return R.string.partner_reminder_open_meals_action;
        }

        if ("partner_dashboard".equals(target)) {
            return R.string.partner_reminder_open_partner_view_action;
        }

        return R.string.partner_reminder_open_hydration_action;
    }

    private void cancelNotification() {
        if (notificationId < 0) {
            return;
        }

        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        if (notificationManager != null) {
            notificationManager.cancel(notificationId);
        }
    }
}
