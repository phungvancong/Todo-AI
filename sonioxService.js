// 🔑 ĐIỀN SONIOX API KEY CỦA BẠN VÀO ĐÂY
const SONIOX_API_KEY = '20536bee39e04b72633531e4fc66e35bab8f2fcc42d97540bb25ba258213d968';

/**
 * Hàm gửi file âm thanh lên Soniox để chuyển thành văn bản
 */
export async function transcribeAudioWithSoniox(fileUri) {
  if (!SONIOX_API_KEY || SONIOX_API_KEY.includes('20536bee39e04b72633531e4fc66e35bab8f2fcc42d97540bb25ba258213d968')) {
    return { success: false, message: 'Chưa điền Soniox API Key!' };
  }

  try {
    const formData = new FormData();
    formData.append('api_key', SONIOX_API_KEY);
    formData.append('model', 'v1'); // Mô hình mặc định của Soniox
    formData.append('file', {
      uri: fileUri,
      type: 'audio/m4a',
      name: 'speech.m4a',
    });

    const response = await fetch('https://api.soniox.com/transcribe_file', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();

    if (response.ok && data.text) {
      return { success: true, text: data.text };
    } else {
      return { success: false, message: data.error || 'Không nhận diện được giọng nói' };
    }
  } catch (error) {
    return { success: false, message: `Lỗi kết nối Soniox: ${error.message}` };
  }
}