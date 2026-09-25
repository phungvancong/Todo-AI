import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';

// Import UI Components
import TaskList from './TaskList';
import TaskHistory from './TaskHistory';
import CalendarView from './CalendarView';
import SettingsView from './SettingsView';
import EditTaskModal from './EditTaskModal';
import AiReportBox from './AiReportBox';
import TaskInputBox from './TaskInputBox';
import NoteList from './NoteList';

// Import Custom Hooks
import { useTasks } from './useTasks';
import { useNotes } from './useNotes';

export default function App() {
  const [activeTab, setActiveTab] = useState('tasks');

  // Lấy state & hàm từ useTasks
  const {
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
  } = useTasks();

  const { noteList, addNote, deleteNote } = useNotes();

  // Settings & Edit Modal State
  const [groqApiKey, setGroqApiKey] = useState('');
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  const openEditModal = (taskItem) => {
    setEditingTaskId(taskItem.id);
    setEditTitle(taskItem.text);
    if (taskItem.dateTimeStr) {
      const [dPart, tPart] = taskItem.dateTimeStr.split(' ');
      setEditDate(dPart || '');
      setEditTime(tPart || '');
    }
    setIsEditModalVisible(true);
  };

  const saveEditedTask = () => {
    saveEditedTaskService({
      editingTaskId,
      editTitle,
      editDate,
      editTime,
      setIsEditModalVisible,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.appHeader}>📝 Quản Lý Công Việc AI</Text>

        {/* THÔNG BÁO STATUS MSG */}
        {statusMsg ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{statusMsg}</Text>
          </View>
        ) : null}

        {/* TAB 1: DANH SÁCH CÔNG VIỆC */}
        {activeTab === 'tasks' && (
          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            {/* 1. Ô NHẬP CÔNG VIỆC MỚI */}
            <TaskInputBox
              task={taskInput}
              setTask={setTaskInput}
              onManualAdd={handleManualAddTask}
              onAiParse={handleAiParseTask}
              loadingAi={loadingAi}
            />

            {/* 2. KHUNG AI TẠO BÁO CÁO */}
            <AiReportBox
              aiReport={aiReport}
              setAiReport={setAiReport}
              loadingAi={loadingAi}
              onGenerateReport={handleGetReport}
              taskList={taskList}
            />

            {/* 3. DANH SÁCH CÔNG VIỆC CẦN LÀM */}
            <TaskList
              taskList={taskList}
              onToggleComplete={toggleTaskComplete}
              onDeleteTask={deleteTask}
              onEditTask={openEditModal}
            />

            {/* 4. LỊCH SỬ CÔNG VIỆC ĐÃ HOÀN THÀNH */}
            <TaskHistory
              taskList={taskList}
              onToggleComplete={toggleTaskComplete}
              onDeleteTask={deleteTask}
            />
          </ScrollView>
        )}

        {/* TAB 2: GHI CHÚ */}
        {activeTab === 'notes' && (
          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            <NoteList
              notes={noteList}
              onAddNote={addNote}
              onDeleteNote={deleteNote}
            />
          </ScrollView>
        )}

        {/* TAB 3: XEM LỊCH */}
        {activeTab === 'calendar' && (
          <CalendarView
            taskList={taskList}
            onToggleComplete={toggleTaskComplete}
            onDeleteTask={deleteTask}
            onEditTask={openEditModal}
            onSyncCalendar={handleSyncCalendar}
            isSyncing={isSyncing}
          />
        )}

        {/* TAB 4: CÀI ĐẶT */}
        {activeTab === 'settings' && (
          <SettingsView
            apiKey={groqApiKey}
            onSaveApiKey={setGroqApiKey}
          />
        )}

        {/* BOTTOM TAB MENU */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'tasks' && styles.activeTabItem]}
            onPress={() => setActiveTab('tasks')}
          >
            <Text style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}>📋 Công Việc</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'notes' && styles.activeTabItem]}
            onPress={() => setActiveTab('notes')}
          >
            <Text style={[styles.tabText, activeTab === 'notes' && styles.activeTabText]}>📌 Ghi Chú</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'calendar' && styles.activeTabItem]}
            onPress={() => setActiveTab('calendar')}
          >
            <Text style={[styles.tabText, activeTab === 'calendar' && styles.activeTabText]}>📅 Lịch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'settings' && styles.activeTabItem]}
            onPress={() => setActiveTab('settings')}
          >
            <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>⚙️ Cài Đặt</Text>
          </TouchableOpacity>
        </View>

        <EditTaskModal
          visible={isEditModalVisible}
          onClose={() => setIsEditModalVisible(false)}
          editTitle={editTitle}
          setEditTitle={setEditTitle}
          editDate={editDate}
          setEditDate={setEditDate}
          editTime={editTime}
          setEditTime={setEditTime}
          onSave={saveEditedTask}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  innerContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  appHeader: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', textAlign: 'center', marginBottom: 10 },
  statusBox: { backgroundColor: '#E3F2FD', padding: 8, borderRadius: 8, marginBottom: 8, alignItems: 'center' },
  statusText: { color: '#1E88E5', fontWeight: 'bold', fontSize: 13 },
  scrollList: { flex: 1 },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#E0E0E0', paddingTop: 8, paddingBottom: 6, backgroundColor: '#FFFFFF' },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 8 },
  activeTabItem: { backgroundColor: '#E3F2FD' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#666' },
  activeTabText: { color: '#1E88E5', fontWeight: 'bold' },
});