import { Alert } from 'react-native';
import * as Calendar from 'expo-calendar/legacy';

/**
 * Hàm lấy múi giờ tự động từ điện thoại
 */
const getDeviceTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tokyo';
  } catch (e) {
    return 'Asia/Tokyo';
  }
};

/**
 * 1. Thêm sự kiện mới vào Lịch Google / Lịch mặc định (Kèm cảnh báo trước 5 phút)
 */
export const addEventToNativeCalendar = async (title, startDateObj) => {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Thông báo', 'Cần cấp quyền Lịch trong Cài Đặt iPhone để tự đồng bộ.');
      return null;
    }

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const googleCalendar = calendars.find(
      cal =>
        (cal.source && (cal.source.type === 'com.google' || cal.source.name?.includes('gmail.com'))) ||
        (cal.title && (cal.title.toLowerCase().includes('gmail') || cal.title.toLowerCase().includes('google')))
    );

    let targetCalendarId;
    if (googleCalendar) {
      targetCalendarId = googleCalendar.id;
      console.log('📌 Chọn Lịch Google:', googleCalendar.title);
    } else {
      const defaultCal = await Calendar.getDefaultCalendarAsync();
      targetCalendarId = defaultCal.id;
      console.log('⚠️ Dùng Lịch mặc định của thiết bị');
    }

    const endDateObj = new Date(startDateObj.getTime() + 30 * 60 * 1000);
    const timeZone = getDeviceTimeZone();

    const eventId = await Calendar.createEventAsync(targetCalendarId, {
      title: title,
      startDate: startDateObj,
      endDate: endDateObj,
      timeZone: timeZone,
      notes: 'Được tạo tự động từ ứng dụng To-Do AI',
      alarms: [
        {
          relativeOffset: -5,
          method: Calendar.AlarmMethod.ALERT,
        },
      ],
    });

    console.log(`✅ Đã tạo sự kiện kèm báo thức 5 phút trên Lịch (${timeZone}) với ID:`, eventId);
    return eventId;
  } catch (err) {
    console.log('Lỗi tạo sự kiện Lịch:', err.message);
    return null;
  }
};

/**
 * 2. Xóa sự kiện trực tiếp trên Lịch
 */
export const deleteEventFromNativeCalendar = async (eventId) => {
  if (!eventId) return;
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status === 'granted') {
      await Calendar.deleteEventAsync(eventId);
      console.log('🗑️ Đã xóa sự kiện trên Lịch:', eventId);
    }
  } catch (error) {
    console.log('Sự kiện không tồn tại trên Lịch hoặc đã bị xóa:', error.message);
  }
};

/**
 * 3. Cập nhật (Sửa) sự kiện trên Lịch
 */
export const updateEventInNativeCalendar = async (eventId, newTitle, newStartDateObj) => {
  if (!eventId) return;
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status === 'granted') {
      const newEndDateObj = new Date(newStartDateObj.getTime() + 30 * 60 * 1000);
      const timeZone = getDeviceTimeZone();

      await Calendar.updateEventAsync(eventId, {
        title: newTitle,
        startDate: newStartDateObj,
        endDate: newEndDateObj,
        timeZone: timeZone,
        notes: 'Cập nhật từ ứng dụng To-Do AI',
        alarms: [
          {
            relativeOffset: -5,
            method: Calendar.AlarmMethod.ALERT,
          },
        ],
      });
      console.log('✏️ Đã cập nhật sự kiện kèm báo thức 5 phút trên Lịch:', eventId);
    }
  } catch (error) {
    console.log('Lỗi cập nhật sự kiện Lịch:', error.message);
  }
};

/**
 * 4. Truy vấn đồng bộ tất cả các sự kiện về ứng dụng (Đã tối ưu không nuốt Data)
 */
export const syncEventsFromCalendar = async (setTaskList, setIsSyncing) => {
  setIsSyncing(true);
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Thông báo', 'Cần cấp quyền TRUY CẬP TOÀN BỘ Lịch trong Cài Đặt.');
      setIsSyncing(false);
      return;
    }

    const allCalendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    if (!allCalendars || allCalendars.length === 0) {
      Alert.alert('Thông báo', 'Không tìm thấy tài khoản Lịch nào trên thiết bị.');
      setIsSyncing(false);
      return;
    }

    // 💡 Lọc bỏ các lịch hệ thống tĩnh không phải công việc (Sinh nhật, Ngày lễ)
    const activeCalendars = allCalendars.filter(cal => {
      const titleLower = (cal.title || '').toLowerCase();
      const isHolidays = titleLower.includes('holiday') || titleLower.includes('ngày lễ');
      const isBirthdays = titleLower.includes('birthday') || titleLower.includes('sinh nhật');
      return !isHolidays && !isBirthdays;
    });

    const calendarIds = activeCalendars.length > 0 
      ? activeCalendars.map(cal => cal.id) 
      : allCalendars.map(cal => cal.id);

    // 🕒 Quét rộng: 60 ngày trước đến 180 ngày tới
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 180);

    const events = await Calendar.getEventsAsync(calendarIds, startDate, endDate);

    if (!events || events.length === 0) {
      Alert.alert('Thông báo', 'Không tìm thấy sự kiện nào trong khoảng thời gian này.');
      setIsSyncing(false);
      return;
    }

    const fetchedTasks = events.map(event => {
      const eventDate = new Date(event.startDate);
      
      const yearStr = eventDate.getFullYear();
      const monthStr = (eventDate.getMonth() + 1).toString().padStart(2, '0');
      const dayStr = eventDate.getDate().toString().padStart(2, '0');
      const dateKey = `${yearStr}-${monthStr}-${dayStr}`;

      const formattedDateTime = `${dayStr}/${monthStr}/${yearStr} ${eventDate.getHours().toString().padStart(2, '0')}:${eventDate.getMinutes().toString().padStart(2, '0')}`;

      return {
        id: `sync_${event.id}_${eventDate.getTime()}`,
        calendarEventId: event.id,
        text: event.title || 'Công việc không tên',
        completed: false,
        dateTimeStr: formattedDateTime,
        dateKey: dateKey,
        timestamp: eventDate.getTime(),
      };
    });

    setTaskList(prev => {
      // 🛡️ BỘ LỌC CHUẨN XÁC: Chỉ chặn nếu TRÙNG HẲN calendarEventId
      const existingCalendarEventIds = new Set(prev.map(t => t.calendarEventId).filter(Boolean));

      const newUniqueTasks = fetchedTasks.filter(t => !existingCalendarEventIds.has(t.calendarEventId));

      return [...prev, ...newUniqueTasks];
    });

    Alert.alert('✅ Thành công', `Đã đồng bộ thành công ${events.length} sự kiện từ Lịch!`);
  } catch (error) {
    console.log('Lỗi đồng bộ Lịch:', error.message);
    Alert.alert('❌ Lỗi', 'Không thể truy vấn dữ liệu Lịch trên thiết bị.');
  } finally {
    setIsSyncing(false);
  }
};