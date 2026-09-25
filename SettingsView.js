import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsView() {
  const [groqApiKey, setGroqApiKey] = useState('');
  const [savedKey, setSavedKey] = useState('');

  useEffect(() => {
    loadKey();
  }, []);

  const loadKey = async () => {
    try {
      const key = await AsyncStorage.getItem('GROQ_API_KEY');
      if (key) {
        setSavedKey(key);
        setGroqApiKey(key);
      }
    } catch (e) {
      console.log('Lỗi đọc Groq API Key:', e);
    }
  };

  const handleSave = async () => {
    const trimmedKey = groqApiKey.trim();
    if (!trimmedKey) {
      Alert.alert('💡 Thông báo', 'Vui lòng nhập mã Groq API Key!');
      return;
    }

    try {
      await AsyncStorage.setItem('GROQ_API_KEY', trimmedKey);
      setSavedKey(trimmedKey);
      Alert.alert('✅ Thành công', 'Đã lưu Groq API Key cá nhân!');
    } catch (e) {
      Alert.alert('❌ Lỗi', 'Không thể lưu API Key.');
    }
  };

  const handleClearKey = async () => {
    try {
      await AsyncStorage.removeItem('GROQ_API_KEY');
      setSavedKey('');
      setGroqApiKey('');
      Alert.alert('🗑️ Đã xóa', 'Đã xóa API Key cá nhân. Ứng dụng sẽ dùng Key mặc định.');
    } catch (e) {
      console.log('Lỗi xóa API Key:', e);
    }
  };

  const maskApiKey = (key) => {
    if (!key || key.length < 10) return key;
    return `${key.substring(0, 6)}...${key.substring(key.length - 4)}`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.header}>⚙️ Cài Đặt & HƯỚNG DẪN</Text>

      {/* 1. CẤU HÌNH GROQ API KEY */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔑 Cấu hình AI Groq API Cá Nhân</Text>
        <Text style={styles.subLabel}>
          Nhập Groq API Key để bật tính năng tự động bóc tách giọng nói và tạo báo cáo lịch trình AI siêu tốc cho riêng bạn.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Dán mã gsk_... vào đây"
          value={groqApiKey}
          onChangeText={setGroqApiKey}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={true}
        />

        {savedKey ? (
          <Text style={styles.savedStatusText}>
            ✅ Đang dùng Key cá nhân: <Text style={styles.boldText}>{maskApiKey(savedKey)}</Text>
          </Text>
        ) : (
          <Text style={styles.defaultStatusText}>
            ⚠️ Chưa có Key cá nhân. Đang dùng Key hệ thống mặc định.
          </Text>
        )}

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>💾 Lưu API Key</Text>
          </TouchableOpacity>

          {savedKey ? (
            <TouchableOpacity style={styles.clearBtn} onPress={handleClearKey}>
              <Text style={styles.clearBtnText}>🗑️ Xóa Key</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* 2. HƯỚNG DẪN CẤU HÌNH API KEY MIỄN PHÍ */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🌐 Cách lấy Groq API Key miễn phí</Text>
        <View style={styles.stepRow}>
          <Text style={styles.stepNum}>1.</Text>
          <Text style={styles.stepText}>Truy cập trang chủ: <Text style={styles.linkText}>console.groq.com</Text></Text>
        </View>
        <View style={styles.stepRow}>
          <Text style={styles.stepNum}>2.</Text>
          <Text style={styles.stepText}>Đăng nhập bằng tài khoản Google của bạn.</Text>
        </View>
        <View style={styles.stepRow}>
          <Text style={styles.stepNum}>3.</Text>
          <Text style={styles.stepText}>Chọn mục <Text style={styles.boldText}>API Keys</Text> {'->'} Nhấn <Text style={styles.boldText}>Create API Key</Text>.</Text>
        </View>
        <View style={styles.stepRow}>
          <Text style={styles.stepNum}>4.</Text>
          <Text style={styles.stepText}>Sao chép mã bắt đầu bằng <Text style={styles.boldText}>gsk_...</Text> và dán vào ô bên trên.</Text>
        </View>
      </View>

      {/* 3. HƯỚNG DẪN ĐỒNG BỘ LỊCH MÁY NATIVE */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📅 Hướng dẫn Đồng bộ Lịch máy</Text>
        <Text style={styles.subLabel}>
          Ứng dụng hỗ trợ đồng bộ hai chiều trực tiếp với Ứng dụng Lịch gốc (Apple Calendar / Google Calendar) trên điện thoại:
        </Text>

        <View style={styles.guideBox}>
          <Text style={styles.guideTitle}>📲 Cấp quyền truy cập Lịch:</Text>
          <Text style={styles.guideText}>
            • Lần đầu tiên sử dụng, ứng dụng sẽ hỏi quyền truy cập Lịch máy. Hãy chọn <Text style={styles.boldText}>Allow / Cho phép</Text>.{'\n'}
            • Nếu lỡ từ chối, hãy vào <Text style={styles.boldText}>Cài đặt thiết bị {'->'} Quyền riêng tư {'->'} Lịch</Text> và bật cấp quyền cho Expo / App.
          </Text>
        </View>

        <View style={styles.guideBox}>
          <Text style={styles.guideTitle}>🔄 Thao tác đồng bộ hai chiều:</Text>
          <Text style={styles.guideText}>
            • <Text style={styles.boldText}>Tự động thêm:</Text> Khi tạo công việc trên app, công việc đó sẽ tự động xuất hiện trên Lịch máy.{'\n'}
            • <Text style={styles.boldText}>Lấy sự kiện từ Lịch máy:</Text> Bấm nút <Text style={styles.boldText}>🔄 Đồng Bộ Lịch Máy</Text> ở màn hình Công việc để tải các sự kiện từ Lịch điện thoại vào danh sách app.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F8F9FA',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 14,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 6,
  },
  subLabel: {
    fontSize: 12,
    color: '#636E72',
    marginBottom: 12,
    lineHeight: 18,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#2D3436',
    marginBottom: 8,
  },
  savedStatusText: {
    fontSize: 12,
    color: '#2E7D32',
    marginBottom: 10,
  },
  defaultStatusText: {
    fontSize: 12,
    color: '#E65100',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#1E88E5',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  clearBtn: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    alignItems: 'center',
  },
  clearBtnText: {
    color: '#D32F2F',
    fontWeight: 'bold',
    fontSize: 13,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  stepNum: {
    fontWeight: 'bold',
    color: '#1E88E5',
    width: 20,
    fontSize: 13,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: '#2D3436',
    lineHeight: 18,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#2D3436',
  },
  linkText: {
    color: '#1E88E5',
    fontWeight: 'bold',
  },
  guideBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  guideText: {
    fontSize: 12,
    color: '#4A5568',
    lineHeight: 18,
  },
});