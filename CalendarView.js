import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

export default function CalendarView({
  taskList,
  onToggleComplete,
  onDeleteTask,
  onEditTask,
  onSyncCalendar,
  isSyncing,
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // 1. Hàm chuẩn hóa BẤT KỲ định dạng ngày/tháng/chuỗi nào về dạng YYYY-MM-DD
  const normalizeToDateKey = (task) => {
    try {
      if (task.dateKey && task.dateKey.includes('-')) {
        const parts = task.dateKey.trim().split('-');
        if (parts.length === 3) {
          const [y, m, d] = parts;
          return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
      }

      // Nếu dateKey ở dạng DD/MM/YYYY (Ví dụ: 25/09/2026)
      if (task.dateKey && task.dateKey.includes('/')) {
        const [d, m, y] = task.dateKey.trim().split('/');
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }

      // Nếu có timestamp hoặc dateTimeStr, tự ép về ngày địa phương
      if (task.timestamp) {
        const dObj = new Date(task.timestamp);
        const y = dObj.getFullYear();
        const m = (dObj.getMonth() + 1).toString().padStart(2, '0');
        const d = dObj.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${d}`;
      }

      return task.dateKey || '';
    } catch (e) {
      return task.dateKey || '';
    }
  };

  const getLocalDateKey = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const d = dateObj.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [selectedDateKey, setSelectedDateKey] = useState(getLocalDateKey(new Date()));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const changeMonth = (direction) => {
    const newDate = new Date(year, month + direction, 1);
    setCurrentDate(newDate);
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const calendarDays = [];
  const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  for (let i = 0; i < paddingDays; i++) {
    calendarDays.push(null);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const monthStr = (month + 1).toString().padStart(2, '0');
    const dayStr = d.toString().padStart(2, '0');
    const dateKey = `${year}-${monthStr}-${dayStr}`;
    calendarDays.push({ day: d, dateKey });
  }

  // 💡 Lọc danh sách công việc thông qua hàm chuẩn hóa dateKey
  const tasksOfSelectedDate = taskList.filter(
    t => normalizeToDateKey(t) === selectedDateKey
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        {/* HEADER CHỌN THÁNG */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.navBtn} onPress={() => changeMonth(-1)}>
            <Text style={styles.navText}>◀</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            Tháng {month + 1} - {year}
          </Text>
          <TouchableOpacity style={styles.navBtn} onPress={() => changeMonth(1)}>
            <Text style={styles.navText}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* CÁC NGÀY TRONG TUẦN */}
        <View style={styles.weekRow}>
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, idx) => (
            <Text key={idx} style={styles.weekText}>{day}</Text>
          ))}
        </View>

        {/* LƯỚI Ô NGÀY TRÊN LỊCH */}
        <View style={styles.daysGrid}>
          {calendarDays.map((item, index) => {
            if (!item) {
              return <View key={`pad-${index}`} style={styles.dayBoxEmpty} />;
            }

            const isSelected = item.dateKey === selectedDateKey;
            // 💡 Hiện chấm cam chính xác dựa trên hàm chuẩn hóa dateKey
            const hasTasks = taskList.some(
              t => normalizeToDateKey(t) === item.dateKey
            );

            return (
              <TouchableOpacity
                key={item.dateKey}
                style={[styles.dayBox, isSelected && styles.selectedDayBox]}
                onPress={() => setSelectedDateKey(item.dateKey)}
              >
                <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>
                  {item.day}
                </Text>

                {hasTasks && (
                  <View style={[styles.dot, isSelected && styles.selectedDot]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* DANH SÁCH CÔNG VIỆC CỦA NGÀY ĐANG CHỌN */}
        <View style={styles.taskListContainer}>
          <Text style={styles.selectedDateHeader}>
            📅 Công việc ngày {selectedDateKey.split('-').reverse().join('/')}:
          </Text>

          {tasksOfSelectedDate.length === 0 ? (
            <Text style={styles.emptyText}>Không có công việc nào trong ngày này.</Text>
          ) : (
            tasksOfSelectedDate.map(item => (
              <View key={item.id} style={styles.taskCard}>
                <TouchableOpacity onPress={() => onToggleComplete && onToggleComplete(item.id)}>
                  <Text style={styles.checkbox}>{item.completed ? '✅' : '🔲'}</Text>
                </TouchableOpacity>

                <View style={styles.taskInfo}>
                  <Text style={[styles.taskText, item.completed && styles.strikeText]}>
                    {item.text}
                  </Text>
                  <Text style={styles.timeText}>⏰ {item.dateTimeStr}</Text>
                </View>

                {/* DANH SÁCH CÔNG VIỆC TRONG MÀN LỊCH */}
                <View style={styles.actionRow}>
                  {/* CHỈ HIỂN THỊ NÚT SỬA VÀ XÓA CHO CÔNG VIỆC CHƯA HOÀN THÀNH */}
                  {!item.completed && (
                    <>
                      <TouchableOpacity style={styles.editBtn} onPress={() => onEditTask(item)}>
                        <Text style={styles.btnIcon}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => onDeleteTask(item.id)}>
                        <Text style={styles.btnIcon}>🗑️</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* NÚT ĐỒNG BỘ LỊCH MÁY DƯỚI CÙNG */}
        <View style={styles.syncBtnContainer}>
          <TouchableOpacity
            style={styles.syncBtn}
            onPress={onSyncCalendar}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.syncBtnText}>🔄 Đồng Bộ Lịch Máy</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  navBtn: { padding: 8, backgroundColor: '#E3F2FD', borderRadius: 8 },
  navText: { fontSize: 14, color: '#1E88E5', fontWeight: 'bold' },
  monthTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  weekText: { width: '14%', textAlign: 'center', fontWeight: 'bold', color: '#757575', fontSize: 12 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayBoxEmpty: { width: '14.28%', height: 42 },
  dayBox: { width: '14.28%', height: 42, justifyContent: 'center', alignItems: 'center', marginVertical: 2, borderRadius: 8 },
  selectedDayBox: { backgroundColor: '#1E88E5' },
  dayText: { fontSize: 14, color: '#333' },
  selectedDayText: { color: '#FFFFFF', fontWeight: 'bold' },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#E65100', marginTop: 2 },
  selectedDot: { backgroundColor: '#FFFFFF' },
  taskListContainer: { flex: 1, marginTop: 14, borderTopWidth: 1, borderTopColor: '#EEEEEE', paddingTop: 10, minHeight: 120 },
  selectedDateHeader: { fontSize: 14, fontWeight: 'bold', color: '#1E88E5', marginBottom: 8 },
  emptyText: { fontSize: 13, color: '#888', fontStyle: 'italic', marginTop: 10 },
  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', padding: 10, borderRadius: 8, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#1E88E5' },
  checkbox: { fontSize: 18, marginRight: 8 },
  taskInfo: { flex: 1 },
  taskText: { fontSize: 14, color: '#333', fontWeight: '600' },
  strikeText: { textDecorationLine: 'line-through', color: '#888' },
  timeText: { fontSize: 11, color: '#666', marginTop: 2 },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { paddingLeft: 8 },
  actionIcon: { fontSize: 16 },
  syncBtnContainer: { paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EEEEEE', marginTop: 12, marginBottom: 8 },
  syncBtn: { backgroundColor: '#2E7D32', paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  syncBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
});