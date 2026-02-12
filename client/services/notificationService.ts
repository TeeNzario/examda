import * as Notifications from "expo-notifications";
import * as db from "./database";

/**
 * Notification Service
 * Handles all local notification scheduling via Expo Notifications
 * and persists notification metadata to SQLite.
 * Fully offline-first: no server dependency.
 */

interface NotificationScheduleResult {
  minutesBefore: number;
  scheduledAt: string;
  notificationId: string | null;
  error?: string;
}

/**
 * Schedule local notifications for an exam
 * Saves notification records to SQLite with the Expo notification ID
 */
export const scheduleExamNotifications = async (
  examId: number,
  examName: string,
  examDate: Date,
  reminderMinutes: number[],
): Promise<NotificationScheduleResult[]> => {
  const results: NotificationScheduleResult[] = [];
  const now = new Date();

  console.log(
    `[NotificationService] Scheduling ${reminderMinutes.length} notifications for exam ${examId}`,
  );

  for (const minutes of reminderMinutes) {
    const notifyAt = new Date(examDate.getTime() - minutes * 60 * 1000);

    // Skip if notification time is in the past
    if (notifyAt <= now) {
      console.log(
        `[NotificationService] Skipping notification ${minutes}min before - already passed`,
      );
      results.push({
        minutesBefore: minutes,
        scheduledAt: notifyAt.toISOString(),
        notificationId: null,
        error: "Notification time already passed",
      });
      continue;
    }

    const secondsUntil = Math.floor(
      (notifyAt.getTime() - now.getTime()) / 1000,
    );

    // Generate notification body text
    let timeString = "";
    if (minutes === 1) timeString = "อีก 1 นาทีจะสอบคร้าบบ";
    else if (minutes === 60) timeString = "อีก 1 ชั่วโมงจะสอบคร้าบบ";
    else if (minutes === 1440) timeString = "พรุ่งนี้จะสอบคร้าบบ";
    else timeString = `อีก ${minutes} นาทีจะสอบ`;

    try {
      // Schedule the Expo notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "📚 เตือนการสอบคร้าบบ",
          body: `${examName} ${timeString}!`,
          data: { examId, examName },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsUntil,
        },
      });

      console.log(
        `[NotificationService] Scheduled notification: ${notificationId} (${minutes}min before)`,
      );

      // Save to SQLite
      await db.saveNotificationSchedule({
        examId,
        minutesBefore: minutes,
        scheduledAt: notifyAt.toISOString(),
        notificationId,
      });

      console.log(
        `[Database] Saved notification schedule: examId=${examId}, notificationId=${notificationId}`,
      );

      results.push({
        minutesBefore: minutes,
        scheduledAt: notifyAt.toISOString(),
        notificationId,
      });
    } catch (error: any) {
      console.error(
        `[NotificationService] Error scheduling notification for ${minutes}min:`,
        error,
      );
      results.push({
        minutesBefore: minutes,
        scheduledAt: notifyAt.toISOString(),
        notificationId: null,
        error: error.message || "Failed to schedule notification",
      });
    }
  }

  return results;
};

/**
 * Cancel all notifications for an exam
 * Removes from both Expo scheduler and SQLite
 */
export const cancelExamNotifications = async (
  examId: number,
): Promise<void> => {
  console.log(
    `[NotificationService] Cancelling notifications for exam ${examId}`,
  );

  try {
    // Get all notification IDs from SQLite
    const schedules = await db.getNotificationSchedulesForExam(examId);

    // Cancel each Expo notification
    for (const schedule of schedules) {
      if (schedule.notificationId) {
        try {
          await Notifications.cancelScheduledNotificationAsync(
            schedule.notificationId,
          );
          console.log(
            `[NotificationService] Cancelled notification: ${schedule.notificationId}`,
          );
        } catch (error) {
          console.warn(
            `[NotificationService] Failed to cancel notification ${schedule.notificationId}:`,
            error,
          );
        }
      }
    }

    // Delete from SQLite
    await db.deleteNotificationSchedulesForExam(examId);
    console.log(
      `[NotificationService] Deleted ${schedules.length} notification schedules from SQLite`,
    );
  } catch (error) {
    console.error(
      `[NotificationService] Error cancelling notifications for exam ${examId}:`,
      error,
    );
    throw error;
  }
};

/**
 * Reschedule notifications for an exam (cancel old, schedule new)
 * Used when exam date/time or notification settings are updated
 */
export const rescheduleExamNotifications = async (
  examId: number,
  examName: string,
  examDate: Date,
  reminderMinutes: number[],
): Promise<NotificationScheduleResult[]> => {
  console.log(
    `[NotificationService] Rescheduling notifications for exam ${examId}`,
  );

  // Cancel existing notifications
  await cancelExamNotifications(examId);

  // Schedule new notifications
  return scheduleExamNotifications(examId, examName, examDate, reminderMinutes);
};

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[NotificationService] Notification permissions not granted");
    return false;
  }

  console.log("[NotificationService] Notification permissions granted");
  return true;
};
