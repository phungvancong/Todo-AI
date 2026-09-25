import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Speech from 'expo-speech';

export default function AiReportBox({
  aiReport,
  setAiReport,
  loadingAi,
  onGenerateReport,
}) {
  /**
   * Sao chép nội dung báo cáo
   */
  const handleCopy = async () => {
    if (!aiReport) return;
    await Clipboard.setStringAsync(aiReport);
    Alert.alert('✅ Thành công', 'Đã sao chép nội dung báo cáo!');
  };

  /**
   * Dừng âm thanh đọc giọng nói
   */
  const handleStop = () => {
    if (Speech && typeof Speech.stop === 'function') {
      Speech.stop();
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. HEADER */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>🤖 AI Trợ Lý </Text>

        {aiReport && !loadingAi ? (
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              handleStop();
              if (setAiReport) setAiReport('');
            }}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* 2. NỘI DUNG BÁO CÁO HOẶC TRẠNG THÁI LOADING */}
      {loadingAi ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#1E88E5" />
          <Text style={styles.loadingText}>AI đang phân tích và soạn báo cáo...</Text>
        </View>
      ) : aiReport ? (
        <View style={styles.contentBox}>
          <Text style={styles.reportText}>{aiReport}</Text>

          {/* THANH CÔNG CỤ: CHỈ CÒN COPY VÀ DỪNG ĐỌC */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
              <Text style={styles.actionBtnText}>📋 Sao chép </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
              <Text style={styles.actionBtnText}>⏹️ Dừng đọc</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={styles.placeholderText}>
          Bấm nút bên dưới để AI tổng hợp danh sách việc cần làm của bạn nhé!
        </Text>
      )}

      {/* 3. NÚT DUY NHẤT TẠO BÁO CÁO */}
      <TouchableOpacity
        style={[styles.mainGenerateBtn, loadingAi && styles.disabledBtn]}
        onPress={onGenerateReport}
        disabled={loadingAi}
      >
        {loadingAi ? (
          <View style={styles.btnLoadingRow}>
            <ActivityIndicator size="small" color="#FFF" />
            <Text style={styles.mainGenerateBtnText}> Đang soạn báo cáo...</Text>
          </View>
        ) : (
          <Text style={styles.mainGenerateBtnText}>✨ Tạo Báo Cáo AI</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    marginVertical: 10,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F2F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#636E72',
  },
  loadingBox: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#1E88E5',
    fontWeight: '500',
  },
  contentBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 10,
  },
  reportText: {
    fontSize: 14,
    color: '#2D3436',
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#DEE2E6',
    gap: 8,
  },
  copyBtn: {
    flex: 1,
    backgroundColor: '#0984E3',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  stopBtn: {
    backgroundColor: '#FF7675',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 13,
    color: '#B2BEC3',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  mainGenerateBtn: {
    backgroundColor: '#1E88E5',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  disabledBtn: {
    backgroundColor: '#90CAF9',
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainGenerateBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});