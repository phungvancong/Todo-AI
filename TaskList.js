import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

export default function TaskList({
  taskList,
  onToggleComplete,
  onDeleteTask,
  onEditTask,
  onBreakdownTask,
  onToggleSubTask,
  loadingTaskId,
}) {
  // State quản lý việc thu gọn/mở rộng subtasks của từng task
  const [collapsedTasks, setCollapsedTasks] = useState({});

  const toggleCollapse = (taskId) => {
    setCollapsedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const getDateKey = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const nowObj = new Date();
  const tomorrowObj = new Date();
  tomorrowObj.setDate(nowObj.getDate() + 1);

  const todayKey = getDateKey(nowObj);
  const tomorrowKey = getDateKey(tomorrowObj);

  const safeTaskList = Array.isArray(taskList) ? taskList : [];

  const todayTasks = safeTaskList
    .filter((t) => {
      if (!t || t.completed) return false;
      if (t.dateKey === todayKey) return true;
      if (t.dateTimeStr) {
        const [dPart] = t.dateTimeStr.split(' ');
        const [day, month, year] = (dPart || '').split('/').map(Number);
        return (
          day === nowObj.getDate() &&
          month === nowObj.getMonth() + 1 &&
          year === nowObj.getFullYear()
        );
      }
      return false;
    })
    .sort((a, b) => (a?.timestamp || 0) - (b?.timestamp || 0));

  const tomorrowTasks = safeTaskList
    .filter((t) => {
      if (!t || t.completed) return false;
      if (t.dateKey === tomorrowKey) return true;
      if (t.dateTimeStr) {
        const [dPart] = t.dateTimeStr.split(' ');
        const [day, month, year] = (dPart || '').split('/').map(Number);
        return (
          day === tomorrowObj.getDate() &&
          month === tomorrowObj.getMonth() + 1 &&
          year === tomorrowObj.getFullYear()
        );
      }
      return false;
    })
    .sort((a, b) => (a?.timestamp || 0) - (b?.timestamp || 0));

  const renderTaskItem = (item, index) => {
    const isSubTasksCollapsed = !!collapsedTasks[item.id];
    const isLoadingThisTask = loadingTaskId === item.id;

    return (
      <View key={`${item.id}-${index}`} style={styles.taskCardContainer}>
        <View style={styles.taskCard}>
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
            {/* NÚT AI HỖ TRỢ VỚI TRẠNG THÁI LOADING */}
            <TouchableOpacity
              style={[styles.aiBtn, isLoadingThisTask && styles.aiBtnLoading]}
              onPress={() => onBreakdownTask && onBreakdownTask(item.id)}
              disabled={isLoadingThisTask}
            >
              {isLoadingThisTask ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#8E44AD" />
                  <Text style={styles.loadingBtnText}> Đang chia...</Text>
                </View>
              ) : (
                <Text style={styles.aiBtnText}>🧩 AI</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.editBtn} onPress={() => onEditTask(item)}>
              <Text style={styles.btnIcon}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => onDeleteTask(item.id)}>
              <Text style={styles.btnIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CỤM SUB-TASKS CÓ THỂ THU GỌN / MỞ RỘNG */}
        {Array.isArray(item.subTasks) && item.subTasks.length > 0 && (
          <View style={styles.subTaskContainer}>
            <TouchableOpacity
              style={styles.subTaskHeaderRow}
              onPress={() => toggleCollapse(item.id)}
            >
              <Text style={styles.subTaskHeaderTitle}>
                💡 Gợi ý 3 bước chia nhỏ ({item.subTasks.filter(s => s.completed).length}/3)
              </Text>
              <Text style={styles.collapseIcon}>
                {isSubTasksCollapsed ? '▼' : '▲'}
              </Text>
            </TouchableOpacity>

            {!isSubTasksCollapsed && (
              <View style={styles.subTaskList}>
                {item.subTasks.map((sub) => (
                  <TouchableOpacity
                    key={sub.id}
                    style={styles.subTaskRow}
                    onPress={() => onToggleSubTask && onToggleSubTask(item.id, sub.id)}
                  >
                    <View style={[styles.subCheckbox, sub.completed && styles.subCheckedBox]}>
                      {sub.completed && <Text style={styles.subCheckmark}>✓</Text>}
                    </View>
                    <Text style={[styles.subTaskText, sub.completed && styles.completedSubText]}>
                      {sub.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

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
  taskCardContainer: {
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  taskCard: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
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
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  aiBtn: {
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#8E44AD',
  },
  aiBtnLoading: {
    backgroundColor: '#F3E5F5',
    borderColor: '#8E44AD',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingBtnText: {
    fontSize: 10,
    color: '#8E44AD',
    fontWeight: 'bold',
  },
  aiBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8E44AD',
  },
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
  // STYLES CHO SUB-TASKS & COLLAPSE
  subTaskContainer: {
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3E5F5',
  },
  subTaskHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  subTaskHeaderTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8E44AD',
  },
  collapseIcon: {
    fontSize: 11,
    color: '#8E44AD',
    fontWeight: 'bold',
  },
  subTaskList: {
    marginTop: 6,
  },
  subTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    paddingLeft: 4,
  },
  subCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#8E44AD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  subCheckedBox: {
    backgroundColor: '#8E44AD',
  },
  subCheckmark: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  subTaskText: {
    fontSize: 13,
    color: '#424242',
    flex: 1,
  },
  completedSubText: {
    textDecorationLine: 'line-through',
    color: '#BDBDBD',
  },
});