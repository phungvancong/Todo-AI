import { Alert } from 'react-native';
import * as Calendar from 'expo-calendar/legacy';

/**
 * Hàm lấy múi giờ tự động từ điện thoại (Ví dụ: Asia/Tokyo khi ở Nhật, Asia/Ho_Chi_Minh khi ở Việt Nam)
 */
const getDeviceTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tokyo';
  } catch (e) {
    return 'Asia/Tokyo'; // Fallback nếu thiết bị không hỗ trợ Intl API
  }
};

/**
 * 1. Thêm sự kiện mới vào Lịch Google / Lịch mặc định (Kèm cảnh báo trước 5 phút)
 * @returns {Promise<string|null>} Trả về eventId của Lịch
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

    const endDateObj = new Date(startDateObj.getTime() + 30 * 60 * 1000); // 30 phút
    const timeZone = getDeviceTimeZone(); // Tự động lấy múi giờ thực tế của thiết bị

    const eventId = await Calendar.createEventAsync(targetCalendarId, {
      title: title,
      startDate: startDateObj,
      endDate: endDateObj,
      timeZone: timeZone,
      notes: 'Được tạo tự động từ ứng dụng To-Do AI',
      alarms: [
        {
          relativeOffset: -5, // 🔔 Cảnh báo trước 5 phút (tính bằng phút)
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
 * 3. Cập nhật (Sửa) sự kiện trên Lịch (Giữ cảnh báo trước 5 phút)
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
            relativeOffset: -5, // 🔔 Giữ cảnh báo trước 5 phút khi cập nhật
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
 * 4. Truy vấn đồng bộ tất cả các sự kiện về ứng dụng
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

    const calendarIds = allCalendars.map(cal => cal.id);

    // 🕒 Mở rộng khoảng thời gian: Quét từ 30 ngày trước đến 180 ngày tới
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
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
        id: `sync_${event.id}_${eventDate.getTime()}_${Math.random().toString(36).substring(2, 6)}`,
        calendarEventId: event.id,
        text: event.title || 'Công việc không tên',
        completed: false,
        dateTimeStr: formattedDateTime,
        dateKey: dateKey,
        timestamp: eventDate.getTime(),
      };
    });

    setTaskList(prev => {
      // 🔄 Lọc trùng dựa trên calendarEventId hoặc kết hợp tên + mốc thời gian
      const existingCalendarEventIds = new Set(prev.map(t => t.calendarEventId).filter(Boolean));
      const existingKeys = new Set(prev.map(t => `${t.text}_${t.timestamp}`));

      const newUniqueTasks = fetchedTasks.filter(t => {
        const isDuplicateEventId = existingCalendarEventIds.has(t.calendarEventId);
        const isDuplicateKey = existingKeys.has(`${t.text}_${t.timestamp}`);
        return !isDuplicateEventId && !isDuplicateKey;
      });

      return [...prev, ...newUniqueTasks];
    });

    Alert.alert('✅ Thành công', `Đã đồng bộ ${events.length} sự kiện từ Lịch!`);
  } catch (error) {
    console.log('Lỗi đồng bộ Lịch:', error.message);
    Alert.alert('❌ Lỗi', 'Không thể truy vấn dữ liệu Lịch trên thiết bị.');
  } finally {
    setIsSyncing(false);
  }
};