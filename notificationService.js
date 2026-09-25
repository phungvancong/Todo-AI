import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Cấu hình Handler hiển thị thông báo
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Đăng ký quyền nhận thông báo Push Notifications
 */
export const registerForPushNotificationsAsync = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }
};

/**
 * Đặt lịch hẹn phát thông báo nhắc nhở công việc (Cảnh báo trước 5 phút)
 * @returns {Promise<string|null>} notificationId để lưu vào Task Object
 */
export const scheduleNotification = async (taskTitle, dateObj) => {
  try {
    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    const notifyTimeMs = dateObj.getTime() - FIVE_MINUTES_MS;
    const nowMs = new Date().getTime();

    const triggerSeconds = Math.max(1, Math.floor((notifyTimeMs - nowMs) / 1000));

    // Lấy chuỗi notificationId trả về từ Expo Notifications
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Cảnh báo: Sắp đến giờ làm!',
        body: `Công việc "${taskTitle}" sẽ bắt đầu sau 5 phút nữa!`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: triggerSeconds,
        repeats: false,
      },
    });

    console.log(`🔔 Đã đặt lịch thông báo ID: ${notificationId} cho task "${taskTitle}"`);
    return notificationId; // 👈 Trả về ID thông báo thay vì boolean
  } catch (error) {
    console.log('Lỗi lập lịch thông báo:', error);
    return null;
  }
};

/**
 * 🔕 Hủy thông báo báo thức theo ID (Dùng khi Task đã Hoàn thành hoặc bị Xóa)
 */
export const cancelNotification = async (notificationId) => {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`🔕 Đã hủy lịch thông báo ID: ${notificationId}`);
  } catch (error) {
    console.log('Lỗi hủy thông báo:', error);
  }
};