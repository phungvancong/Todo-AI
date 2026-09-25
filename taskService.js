import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { deleteEventFromNativeCalendar, updateEventInNativeCalendar } from './calendarService';

/**
 * Hàm cài đặt thông báo nhắc nhở
 */
export const scheduleNotification = async (taskTitle, dateObj) => {
  try {
    const triggerSeconds = Math.max(1, Math.floor((dateObj.getTime() - new Date().getTime()) / 1000));

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Nhắc nhở công việc',
        body: `Đã đến giờ làm: ${taskTitle}`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: triggerSeconds,
        repeats: false,
      },
    });
    return true;
  } catch (error) {
    console.log('Lỗi lập lịch thông báo:', error);
    return false;
  }
};

/**
 * Service Xóa công việc khỏi App và Lịch
 */
export const deleteTaskService = async (taskId, taskList, setTaskList) => {
  const taskToDelete = taskList.find(t => t.id === taskId);
  
  if (taskToDelete) {
    // Xóa sự kiện tương ứng trên Lịch
    await deleteEventFromNativeCalendar(taskToDelete.calendarEventId || taskToDelete.id);
  }

  // Cập nhật lại danh sách State
  setTaskList(prev => prev.filter(t => t.id !== taskId));
};

/**
 * Service Cập nhật (Sửa) công việc trên App và Lịch
 */
export const saveEditedTaskService = async ({
  editingTaskId,
  editTitle,
  editDate,
  editTime,
  taskList,
  setTaskList,
  setIsEditModalVisible,
}) => {
  if (!editTitle.trim()) return;

  const [day, month, year] = editDate.split('/').map(Number);
  const [hour, minute] = editTime.split(':').map(Number);

  const targetDate = new Date(year, month - 1, day, hour, minute);
  const dateKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  const formattedDateTime = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

  // Đặt lại thông báo nhắc nhở
  await scheduleNotification(editTitle, targetDate);

  // Cập nhật thông tin sự kiện trên Lịch
  const currentTask = taskList.find(t => t.id === editingTaskId);
  if (currentTask) {
    await updateEventInNativeCalendar(
      currentTask.calendarEventId || currentTask.id,
      editTitle,
      targetDate
    );
  }

  // Cập nhật State trong App
  setTaskList(prev =>
    prev.map(t =>
      t.id === editingTaskId
        ? {
            ...t,
            text: editTitle,
            dateTimeStr: formattedDateTime,
            dateKey: dateKey,
            timestamp: targetDate.getTime(),
          }
        : t
    )
  );

  setIsEditModalVisible(false);
  Alert.alert('✅ Thành công', 'Đã cập nhật công việc trên App và Lịch!');
};