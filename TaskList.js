import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';

export default function TaskList({ taskList, onToggleComplete, onDeleteTask, onEditTask }) {
  // Hàm tạo chuỗi dateKey (YYYY-MM-DD) chuẩn
  const getDateKey = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Tính Ngày Hôm Nay & Ngày Mai
  const nowObj = new Date();
  const tomorrowObj = new Date();
  tomorrowObj.setDate(nowObj.getDate() + 1);

  const todayKey = getDateKey(nowObj);
  const tomorrowKey = getDateKey(tomorrowObj);

  const safeTaskList = Array.isArray(taskList) ? taskList : [];

  // Lọc task Hôm Nay
  const todayTasks = safeTaskList
    .filter(t => {
      if (!t || t.completed) return false;
      // Trường hợp có dateKey khớp HOẶC kiểm tra chuỗi ngày trong dateTimeStr
      if (t.dateKey === todayKey) return true;
      if (t.dateTimeStr) {
        const [dPart] = t.dateTimeStr.split(' ');
        const [day, month, year] = (dPart || '').split('/').map(Number);
        return day === nowObj.getDate() && month === (nowObj.getMonth() + 1) && year === nowObj.getFullYear();
      }
      return false;
    })
    .sort((a, b) => (a?.timestamp || 0) - (b?.timestamp || 0));

  // Lọc task Ngày Mai (Xử lý đa tầng an toàn)
  const tomorrowTasks = safeTaskList
    .filter(t => {
      if (!t || t.completed) return false;
      // 1. Kiểm tra theo dateKey chuẩn YYYY-MM-DD
      if (t.dateKey === tomorrowKey) return true;
      
      // 2. Fallback: Parse từ chuỗi dateTimeStr dạng DD/MM/YYYY
      if (t.dateTimeStr) {
        const [dPart] = t.dateTimeStr.split(' ');
        const [day, month, year] = (dPart || '').split('/').map(Number);
        return day === tomorrowObj.getDate() && month === (tomorrowObj.getMonth() + 1) && year === tomorrowObj.getFullYear();
      }
      return false;
    })
    .sort((a, b) => (a?.timestamp || 0) - (b?.timestamp || 0));

  const renderTaskItem = (item, index) => (
    <View key={`${item.id}-${index}`} style={styles.taskCard}>
      <TouchableOpacity
        style={styles.checkboxArea}
        onPress={() => onToggleComplete(item.id)}
      >
        <View style={[styles.checkbox, item.completed && styles.checkedBox]}>
          {item.completed && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>

      <View style={styles.taskInfo}>
        <Text style={[styles.taskText, item.completed && styles.completedTaskText]}>
          {item.text}
        </Text>
        {item.dateTimeStr && (
          <Text style={styles.timeText}>⏰ {item.dateTimeStr}</Text>
        )}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.editBtn} onPress={() => onEditTask(item)}>
          <Text style={styles.btnIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => onDeleteTask(item.id)}>
          <Text style={styles.btnIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* NHÓM 1: HÔM NAY */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📌 Hôm Nay</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{todayTasks.length}</Text>
        </View>
      </View>

      {todayTasks.length > 0 ? (
        todayTasks.map((item, index) => renderTaskItem(item, index))
      ) : (
        <Text style={styles.emptyText}>🎉 Không có công việc nào cần làm hôm nay!</Text>
      )}

      {/* NHÓM 2: NGÀY MAI */}
      <View style={[styles.sectionHeader, styles.tomorrowHeader]}>
        <Text style={styles.sectionTitle}>📌 Ngày Mai</Text>
        <View style={[styles.badge, styles.tomorrowBadge]}>
          <Text style={styles.badgeText}>{tomorrowTasks.length}</Text>
        </View>
      </View>

      {tomorrowTasks.length > 0 ? (
        tomorrowTasks.map((item, index) => renderTaskItem(item, index))
      ) : (
        <Text style={styles.emptyText}>✨ Chưa có lịch trình cho ngày mai.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 10, marginBottom: 15 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 10,
  },
  tomorrowHeader: { marginTop: 18 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#1E88E5',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tomorrowBadge: {
    backgroundColor: '#FB8C00',
  },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  checkboxArea: { marginRight: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: { backgroundColor: '#1E88E5' },
  checkmark: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  taskInfo: { flex: 1 },
  taskText: { fontSize: 14, color: '#212121', fontWeight: '500' },
  completedTaskText: { textDecorationLine: 'line-through', color: '#9E9E9E' },
  timeText: { fontSize: 11, color: '#757575', marginTop: 4 },
  actionRow: { flexDirection: 'row' },
  editBtn: { padding: 4, marginRight: 6 },
  deleteBtn: { padding: 4 },
  btnIcon: { fontSize: 15 },
  emptyText: {
    fontSize: 12,
    color: '#9E9E9E',
    fontStyle: 'italic',
    marginVertical: 6,
    marginLeft: 4,
  },
});