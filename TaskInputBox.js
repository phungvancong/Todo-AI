import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function TaskInputBox({
  task,
  setTask,
  onManualAdd,
  onAiParse,
  loadingAi,
}) {
  const [manualDate, setManualDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleManualAddPress = () => {
    if (!task.trim()) {
      Alert.alert('💡 Thông báo', 'Vui lòng nhập tên công việc!');
      return;
    }
    onManualAdd(manualDate);
  };

  return (
    <View style={styles.inputContainer}>
      {/* Ô nhập tên công việc */}
      <TextInput
        style={styles.input}
        placeholder="Gõ hoặc nói công việc (Ví dụ: Đi họp lúc 15h30)..."
        value={task}
        onChangeText={setTask}
      />

      {/* Hàng nút chọn Ngày, Giờ và Nút Thêm/AI */}
      <View style={styles.pickerRow}>
        <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.pickerBtnText}>
            📅 {manualDate.getDate()}/{(manualDate.getMonth() + 1).toString().padStart(2, '0')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTimePicker(true)}>
          <Text style={styles.pickerBtnText}>
            ⏰ {manualDate.getHours().toString().padStart(2, '0')}:{manualDate.getMinutes().toString().padStart(2, '0')}
          </Text>
        </TouchableOpacity>

        {/* Nút Tạo Thủ Công */}
        <TouchableOpacity style={styles.manualAddBtn} onPress={handleManualAddPress}>
          <Text style={styles.btnText}>➕ Thêm</Text>
        </TouchableOpacity>

        {/* Nút Tạo AI Auto */}
        <TouchableOpacity style={styles.aiParseBtn} onPress={onAiParse} disabled={loadingAi}>
          <Text style={styles.aiBtnText}>🪄 AI Auto</Text>
        </TouchableOpacity>
      </View>

      {/* Bộ Picker Ngày */}
      {showDatePicker && (
        <DateTimePicker
          value={manualDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setManualDate(selectedDate);
          }}
        />
      )}

      {/* Bộ Picker Giờ */}
      {showTimePicker && (
        <DateTimePicker
          value={manualDate}
          mode="time"
          display="default"
          onChange={(event, selectedDate) => {
            setShowTimePicker(false);
            if (selectedDate) setManualDate(selectedDate);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerBtn: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    justifyContent: 'center',
  },
  pickerBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  manualAddBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    justifyContent: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  aiParseBtn: {
    backgroundColor: '#E65100',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    justifyContent: 'center',
  },
  aiBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
});