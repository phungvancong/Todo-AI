import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseTaskFromVoice, getGeminiReport } from './groqService';
import {
  addEventToNativeCalendar,
  deleteEventFromNativeCalendar,
  updateEventInNativeCalendar,
  syncEventsFromCalendar,
} from './calendarService';
import { registerForPushNotificationsAsync, scheduleNotification } from './notificationService';

const STORAGE_TASK_KEY = 'APP_TASK_LIST';

export function useTasks() {
  const [taskList, setTaskList] = useState([]);
  const [taskInput, setTaskInput] = useState('');
  const [aiReport, setAiReport] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    registerForPushNotificationsAsync();
    loadTasks();
  }, []);

  const showToast = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => {
      setStatusMsg('');
    }, 3500);
  };

  const loadTasks = async () => {
    try {
      const savedTasksJson = await AsyncStorage.getItem(STORAGE_TASK_KEY);
      if (savedTasksJson) {
        const parsedTasks = JSON.parse(savedTasksJson);
        if (Array.isArray(parsedTasks)) {
          const uniqueTasks = Array.from(
            new Map(parsedTasks.map((t) => [t.id, t])).values()
          );
          setTaskList(uniqueTasks);
        }
      }
    } catch (e) {
      console.log('Lỗi tải danh sách công việc:', e);
    }
  };

  // 🛡️ HÀM LƯU BẢO VỆ CHẮC CHẮN ĐÚNG DẠNG MẢNG
  const saveTasks = async (tasks) => {
    try {
      let tasksArray = tasks;

      // Nếu tasks truyền vào là một hàm updater (prev => ...), giải phỏng thành mảng thực tế
      if (typeof tasks === 'function') {
        tasksArray = tasks(taskList);
      }

      if (!Array.isArray(tasksArray)) {
        console.log('⚠️ Dữ liệu truyền vào saveTasks không phải là mảng hợp lệ:', tasksArray);
        return;
      }

      const validTasks = tasksArray.filter(t => t && t.id);
      const uniqueTasks = Array.from(
        new Map(validTasks.map((t) => [String(t.id), t])).values()
      );

      setTaskList(uniqueTasks);
      await AsyncStorage.setItem(STORAGE_TASK_KEY, JSON.stringify(uniqueTasks));
    } catch (e) {
      console.log('Lỗi lưu công việc:', e);
    }
  };

  // 🤖 1. TẠO BÁO CÁO AI VÀ TỰ ĐỘNG PHÁT GIỌNG ĐỌC
  const handleGetReport = async () => {
    setLoadingAi(true);
    try {
      if (Speech && typeof Speech.stop === 'function') {
        Speech.stop();
      }

      const res = await getGeminiReport(taskList);

      if (res && res.success && res.text) {
        setAiReport(res.text);

        let speechText = res.text;
        if (res.text.includes('🔊 Văn nói:')) {
          speechText = res.text.split('🔊 Văn nói:')[1].trim();
        }

        if (speechText && Speech && typeof Speech.speak === 'function') {
          Speech.speak(speechText, {
            language: 'vi-VN',
            pitch: 1.2,
            rate: 1.1,
          });
        }
      }
    } catch (error) {
      console.log('Lỗi tạo báo cáo:', error);
      Alert.alert('❌ Lỗi', 'Không thể tạo báo cáo lúc này.');
    } finally {
      setLoadingAi(false);
    }
  };

  // 📝 2. THÊM CÔNG VIỆC THỦ CÔNG
  const handleManualAddTask = async (selectedDate) => {
    if (!taskInput.trim()) {
      Alert.alert('💡 Thông báo', 'Vui lòng nhập nội dung công việc!');
      return;
    }

    const targetDate = new Date(selectedDate);
    const calendarEventId = await addEventToNativeCalendar(taskInput, targetDate);

    const yearStr = targetDate.getFullYear();
    const monthStr = (targetDate.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = targetDate.getDate().toString().padStart(2, '0');
    const dateKey = `${yearStr}-${monthStr}-${dayStr}`;
    const formattedDateTime = `${dayStr}/${monthStr}/${yearStr} ${targetDate
      .getHours()
      .toString()
      .padStart(2, '0')}:${targetDate
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    await scheduleNotification(taskInput, targetDate);

    const newTask = {
      id: `task_manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      calendarEventId,
      text: taskInput,
      completed: false,
      dateTimeStr: formattedDateTime,
      dateKey,
      timestamp: targetDate.getTime(),
    };

    const addedText = taskInput;
    await saveTasks([...taskList, newTask]);
    setTaskInput('');

    if (Speech && typeof Speech.speak === 'function') {
      Speech.stop();
      Speech.speak(`Đã thêm công việc ${addedText}`, { language: 'vi-VN', rate: 0.9 });
    }

    showToast(`🎉 Đã thêm công việc: "${addedText}"`);
  };

  // 🤖 3. AI TỰ ĐỘNG BÓC TÁCH VÀ TẠO TASK
  const handleAiParseTask = async () => {
    if (!taskInput.trim()) {
      if (Speech && typeof Speech.speak === 'function') {
        Speech.stop();
        Speech.speak('Bạn hãy nhập nội dung kèm thời gian', {
          language: 'vi-VN',
          rate: 1.1,
        });
      }

      Alert.alert(
        '💡 Hướng dẫn AI Auto',
        'Hãy nhập câu có chứa thời gian.\nVí dụ: "Học bài lúc 20g30" hoặc "Họp nhóm ngày mai 10g" rồi nhấn lại nút AI nhé!'
      );
      return;
    }

    setLoadingAi(true);

    try {
      const parsedData = await parseTaskFromVoice(taskInput);

      if (parsedData && parsedData.taskName && !isNaN(parsedData.hour)) {
        const targetDate = new Date();
        targetDate.setHours(parsedData.hour, parsedData.minute || 0, 0, 0);

        const now = new Date();
        if (
          taskInput.toLowerCase().includes('ngày mai') ||
          targetDate.getTime() <= now.getTime()
        ) {
          targetDate.setDate(targetDate.getDate() + 1);
        }

        await scheduleNotification(parsedData.taskName, targetDate);
        const calendarEventId = await addEventToNativeCalendar(parsedData.taskName, targetDate);

        const yearStr = targetDate.getFullYear();
        const monthStr = (targetDate.getMonth() + 1).toString().padStart(2, '0');
        const dayStr = targetDate.getDate().toString().padStart(2, '0');
        const dateKey = `${yearStr}-${monthStr}-${dayStr}`;
        const formattedDateTime = `${dayStr}/${monthStr}/${yearStr} ${targetDate
          .getHours()
          .toString()
          .padStart(2, '0')}:${targetDate
          .getMinutes()
          .toString()
          .padStart(2, '0')}`;

        const newTask = {
          id: `task_ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          calendarEventId,
          text: parsedData.taskName,
          completed: false,
          dateTimeStr: formattedDateTime,
          dateKey,
          timestamp: targetDate.getTime(),
        };

        await saveTasks([...taskList, newTask]);
        setTaskInput('');

        const timeFormatted = `${targetDate.getHours().toString().padStart(2, '0')}:${targetDate
          .getMinutes()
          .toString()
          .padStart(2, '0')}`;

        if (Speech && typeof Speech.speak === 'function') {
          Speech.stop();
          Speech.speak(`Đã lên lịch ${parsedData.taskName} lúc ${timeFormatted}`, {
            language: 'vi-VN',
            rate: 1.1,
          });
        }

        showToast(`🎉 AI đã tạo: "${parsedData.taskName}" lúc ${timeFormatted}`);
      } else {
        if (Speech && typeof Speech.speak === 'function') {
          Speech.stop();
          Speech.speak('Chưa nhận diện được thời gian, bạn hãy thêm giờ vào nhé', {
            language: 'vi-VN',
          });
        }

        Alert.alert(
          '⚠️ Chưa nhận diện được giờ',
          'AI không tìm thấy mốc thời gian. Bạn vui lòng ghi rõ giờ (ví dụ: "Làm bài tập lúc 15g")!'
        );
      }
    } catch (err) {
      console.log('Lỗi khi AI bóc tách công việc:', err);
      Alert.alert('❌ Lỗi', 'Có sự cố xảy ra khi AI phân tích công việc.');
    } finally {
      setLoadingAi(false);
    }
  };

  const toggleTaskComplete = async (id) => {
    const updatedList = taskList.map((t) =>
      String(t.id) === String(id) ? { ...t, completed: !t.completed } : t
    );
    await saveTasks(updatedList);
  };

  // 🗑️ HÀM XÓA TRỰC TIẾP
  const deleteTask = async (id) => {
    try {
      const taskToDelete = taskList.find((t) => String(t.id) === String(id));
      if (taskToDelete && taskToDelete.calendarEventId) {
        try {
          await deleteEventFromNativeCalendar(taskToDelete.calendarEventId);
        } catch (calErr) {
          console.log('Lỗi xóa trên Lịch native:', calErr);
        }
      }

      const updatedList = taskList.filter((t) => String(t.id) !== String(id));
      await saveTasks(updatedList);
      showToast('🗑️ Đã xóa công việc!');
    } catch (err) {
      console.log('Lỗi khi xóa task:', err);
    }
  };

  // ✏️ HÀM SỬA TRỰC TIẾP
  const saveEditedTaskService = async ({
    editingTaskId,
    editTitle,
    editDate,
    editTime,
    setIsEditModalVisible,
  }) => {
    if (!editTitle || !editTitle.trim()) {
      Alert.alert('💡 Thông báo', 'Vui lòng nhập tên công việc!');
      return;
    }

    try {
      const updatedList = taskList.map((t) => {
        if (String(t.id) === String(editingTaskId)) {
          let newDateKey = editDate;
          let formattedDateTime = `${editDate} ${editTime}`.trim();

          if (editDate && editDate.includes('/')) {
            const [d, m, y] = editDate.split('/');
            newDateKey = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          }

          if (t.calendarEventId) {
            try {
              const [y, m, d] = newDateKey.split('-');
              const [hh, mm] = (editTime || '00:00').split(':');
              const newStartDateObj = new Date(y, parseInt(m) - 1, d, hh, mm);
              updateEventInNativeCalendar(t.calendarEventId, editTitle, newStartDateObj);
            } catch (e) {
              console.log('Lỗi cập nhật Native Calendar:', e);
            }
          }

          return {
            ...t,
            text: editTitle,
            dateTimeStr: formattedDateTime,
            dateKey: newDateKey,
          };
        }
        return t;
      });

      await saveTasks(updatedList);
      if (setIsEditModalVisible) setIsEditModalVisible(false);
      showToast('✏️ Đã cập nhật công việc!');
    } catch (err) {
      console.log('Lỗi khi lưu sửa task:', err);
    }
  };

  // 🔄 HÀM TRUYỀN CALLBACK ĐỒNG BỘ CHUẨN ĐÚNG DẠNG STATE UPDATER
  const handleSyncCalendar = () => {
    syncEventsFromCalendar((updatedTaskList) => {
      saveTasks(updatedTaskList);
    }, setIsSyncing);
  };

  return {
    taskList,
    taskInput,
    setTaskInput,
    aiReport,
    setAiReport,
    loadingAi,
    isSyncing,
    statusMsg,
    handleManualAddTask,
    handleAiParseTask,
    handleGetReport,
    toggleTaskComplete,
    deleteTask,
    handleSyncCalendar,
    saveEditedTaskService,
  };
}