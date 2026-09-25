import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';

export default function TaskHistory({ taskList, onToggleComplete }) {
  // Mặc định true = Thu gọn khung Lịch Sử
  const [isCollapsed, setIsCollapsed] = useState(true);

  const safeTaskList = Array.isArray(taskList) ? taskList : [];
  
  // Lọc ra các task đã hoàn thành
  const completedTasks = safeTaskList.filter((t) => t && t.completed);

  if (completedTasks.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* HEADER BẤM ĐỂ THU GỌN / MỞ RỘNG */}
      <TouchableOpacity
        style={styles.headerRow}
        onPress={() => setIsCollapsed(!isCollapsed)}
        activeOpacity={0.7}
      >
        <View style={styles.titleGroup}>
          <Text style={styles.headerTitle}>✅ Lịch Sử Đã Hoàn Thành</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{completedTasks.length}</Text>
          </View>
        </View>

        <Text style={styles.toggleIcon}>{isCollapsed ? '▼' : '▲'}</Text>
      </TouchableOpacity>

      {/* DANH SÁCH CÔNG VIỆC (ĐÃ BỎ NÚT XÓA 🗑️) */}
      {!isCollapsed && (
        <View style={styles.historyList}>
          {completedTasks.map((item, index) => (
            <View key={`${item.id}-${index}`} style={styles.taskCard}>
              <TouchableOpacity
                style={styles.checkboxArea}
                onPress={() => onToggleComplete(item.id)}
              >
                <View style={[styles.checkbox, styles.checkedBox]}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.taskInfo}>
                <Text style={styles.completedTaskText}>{item.text}</Text>
                {item.dateTimeStr && (
                  <Text style={styles.timeText}>⏰ {item.dateTimeStr}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  badgeText: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: 'bold',
  },
  toggleIcon: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  historyList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  taskCard: {
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F2F6',
  },
  checkboxArea: {
    marginRight: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#2E7D32',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  taskInfo: {
    flex: 1,
  },
  completedTaskText: {
    fontSize: 13,
    color: '#9E9E9E',
    textDecorationLine: 'line-through',
  },
  timeText: {
    fontSize: 11,
    color: '#BDBDBD',
    marginTop: 2,
  },
});