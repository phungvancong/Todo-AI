import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Modal } from 'react-native';

export default function EditTaskModal({
  visible,
  onClose,
  editTitle,
  setEditTitle,
  editDate,
  setEditDate,
  editTime,
  setEditTime,
  onSave,
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>✏️ Chỉnh Sửa Công Việc</Text>

          <Text style={styles.label}>Tên công việc:</Text>
          <TextInput style={styles.modalInput} value={editTitle} onChangeText={setEditTitle} />

          <Text style={styles.label}>Ngày (DD/MM/YYYY):</Text>
          <TextInput style={styles.modalInput} value={editDate} onChangeText={setEditDate} />

          <Text style={styles.label}>Giờ (HH:MM):</Text>
          <TextInput style={styles.modalInput} value={editTime} onChangeText={setEditTime} />

          <View style={styles.modalBtnRow}>
            <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={onClose}>
              <Text style={styles.modalBtnText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={onSave}>
              <Text style={styles.modalBtnText}>Lưu Lại</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', backgroundColor: '#FFF', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E88E5', marginBottom: 15, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginTop: 8, marginBottom: 4 },
  modalInput: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, backgroundColor: '#FAFAFA' },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  modalBtn: { flex: 0.48, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#757575' },
  saveBtn: { backgroundColor: '#2E7D32' },
  modalBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});