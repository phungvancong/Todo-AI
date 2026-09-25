import { Audio } from 'expo-av';

let recordingObject = null;

// Xin quyền dùng Micro
export async function requestAudioPermissions() {
  const { status } = await Audio.requestPermissionsAsync();
  return status === 'granted';
}

// Bắt đầu thu âm
export async function startRecording() {
  try {
    const hasPermission = await requestAudioPermissions();
    if (!hasPermission) return false;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    recordingObject = recording;
    return true;
  } catch (err) {
    console.error('Lỗi khởi tạo thu âm:', err);
    return false;
  }
}

// Dừng thu âm và lấy file
export async function stopRecording() {
  try {
    if (!recordingObject) return null;

    await recordingObject.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    const uri = recordingObject.getURI();
    recordingObject = null;
    return uri;
  } catch (err) {
    console.error('Lỗi dừng thu âm:', err);
    return null;
  }
}