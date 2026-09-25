import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function TaskHistory({ taskList, onToggleComplete, onDeleteTask }) {
  // Lọc các công việc ĐÃ hoàn thành
  const completedTasks = taskList.filter(item => item.completed);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>✅ LỊCH SỬ ĐÃ HOÀN THÀNH ({completedTasks.length})</Text>

      {completedTasks.length === 0 ? (
        <Text style={styles.emptyText}>Chưa có công việc nào trong lịch sử.</Text>
      ) : (
        completedTasks.map(item => (
          <View key={item.id} style={styles.card}>
            <TouchableOpacity onPress={() => onToggleComplete(item.id)}>
              <Text style={styles.checkbox}>✅</Text>
            </TouchableOpacity>

            <View style={styles.infoContainer}>
              <Text style={styles.taskTitle}>{item.text}</Text>
              <Text style={styles.timeText}>🕒 Hoàn thành lịch: {item.dateTimeStr}</Text>
            </View>

            {onDeleteTask && (
              <TouchableOpacity onPress={() => onDeleteTask(item.id)}>
                <Text style={styles.deleteBtn}>🗑️</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2E7D32', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', fontStyle: 'italic', marginVertical: 6 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    opacity: 0.85,
  },
  checkbox: { fontSize: 20, marginRight: 10 },
  infoContainer: { flex: 1 },
  taskTitle: { fontSize: 15, color: '#757575', textDecorationLine: 'line-through' },
  timeText: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
  deleteBtn: { fontSize: 18, paddingLeft: 8 }
});