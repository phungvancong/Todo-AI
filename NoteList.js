import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';

export default function NoteList({ notes = [], onAddNote, onDeleteNote }) {
  const [noteInput, setNoteInput] = useState('');

  const handleAdd = () => {
    if (!noteInput.trim()) {
      Alert.alert('💡 Thông báo', 'Vui lòng nhập nội dung ghi chú!');
      return;
    }
    if (onAddNote) {
      onAddNote(noteInput.trim());
      setNoteInput('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📌 Ghi Chú & Công Việc Dự Bị</Text>

      {/* Ô NHẬP GHI CHÚ MỚI */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Thêm ý tưởng, ghi chú dự bị..."
          value={noteInput}
          onChangeText={setNoteInput}
          placeholderTextColor="#A0AEC0"
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addBtnText}>+ Thêm</Text>
        </TouchableOpacity>
      </View>

      {/* DANH SÁCH GHI CHÚ */}
      {notes.length === 0 ? (
        <Text style={styles.emptyText}>Chưa có ghi chú hoặc công việc dự bị nào.</Text>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.noteCard}>
              <Text style={styles.noteText}>{item.text}</Text>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => onDeleteNote && onDeleteNote(item.id)}
              >
                <Text style={styles.deleteBtnText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    marginVertical: 10,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#2D3436',
  },
  addBtn: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyText: {
    fontSize: 12,
    color: '#A0AEC0',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 8,
  },
  noteCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#2D3436',
    marginRight: 8,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteBtnText: {
    fontSize: 14,
  },
});