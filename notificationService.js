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
 */
export const scheduleNotification = async (taskTitle, dateObj) => {
  try {
    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    // Lùi mốc thời gian thông báo lại 5 phút trước giờ bắt đầu
    const notifyTimeMs = dateObj.getTime() - FIVE_MINUTES_MS;
    const nowMs = new Date().getTime();

    // Tính số giây từ hiện tại đến mốc thông báo (Nếu thời gian đã qua hoặc < 5 phút thì phát sau 1s)
    const triggerSeconds = Math.max(1, Math.floor((notifyTimeMs - nowMs) / 1000));

    await Notifications.scheduleNotificationAsync({
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

    console.log(`🔔 Đã đặt lịch thông báo trước 5 phút cho task "${taskTitle}" (sau ${triggerSeconds} giây)`);
    return true;
  } catch (error) {
    console.log('Lỗi lập lịch thông báo:', error);
    return false;
  }
};