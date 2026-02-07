import * as Notifications from "expo-notifications";

/**
 * Cancel all scheduled local notifications
 * Call this before clearing local data on logout or app reset
 */
export const cancelAllScheduledNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log("[Notifications] All scheduled notifications cancelled");
};

/**
 * Get all currently scheduled notifications
 * Useful for debugging
 */
export const getAllScheduledNotifications = async () => {
  return await Notifications.getAllScheduledNotificationsAsync();
};
