// import { fallbackTimeParser, generateLocalReport } from './fallbackService';

// // 🔑 DANH SÁCH API KEYS (Hỗ trợ cả Key mới dạng AQ.Ab8... và Key AIzaSy...)
// const GEMINI_API_KEYS = [
//   'AQ.Ab8RN6LQ0D7Am8ejvT9I4d78fpcAQ3YvMxN2ovPtitaJU9gh_Q', // Key Auth mới từ AI Studio
//   'AIzaSyDUtpXqLnHEUn0o4l8pL7Yc9IH33K7Wb5Q',
//   'AIzaSyBqOHDj0MbEKlF3qgNMc1A7q_lWXYoD8c0',
// ];

// /**
//  * 🛠️ Hàm tự động kiểm tra tên mô hình sẵn có trên API Key
//  */
// async function getActiveModelName(apiKey) {
//   try {
//     const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
//       method: 'GET',
//       headers: { 'x-goog-api-key': apiKey },
//     });
//     const data = await res.json();
//     if (data && data.models) {
//       // Tìm mô hình hỗ trợ generateContent (ưu tiên flash)
//       const flashModel = data.models.find(m => 
//         m.name.includes('flash') && m.supportedGenerationMethods?.includes('generateContent')
//       );
//       if (flashModel) {
//         return flashModel.name.replace('models/', '');
//       }
//       const anyValidModel = data.models.find(m => m.supportedGenerationMethods?.includes('generateContent'));
//       if (anyValidModel) {
//         return anyValidModel.name.replace('models/', '');
//       }
//     }
//   } catch (err) {
//     console.log('Không thể lấy danh sách mô hình từ API, sử dụng tên mặc định:', err);
//   }
//   return 'gemini-1.5-flash-latest'; // Tên mô hình fallback mặc định
// }

// /**
//  * 🌐 Hàm helper gửi Request đến Google Gemini API
//  */
// async function callGeminiApi(apiKey, promptText, isJson = false) {
//   // Lấy chính xác tên mô hình mà Key đang hỗ trợ
//   const modelName = await getActiveModelName(apiKey);
//   const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

//   const payload = {
//     contents: [{ parts: [{ text: promptText }] }],
//   };

//   if (isJson) {
//     payload.generationConfig = { responseMimeType: 'application/json' };
//   }

//   const response = await fetch(url, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'x-goog-api-key': apiKey,
//     },
//     body: JSON.stringify(payload),
//   });

//   const data = await response.json();

//   if (response.ok && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
//     return data.candidates[0].content.parts[0].text.trim();
//   }

//   throw new Error(data.error?.message || `Lỗi gọi API từ Google (Mô hình: ${modelName})`);
// }

// /**
//  * 1. HÀM TẠO BÁO CÁO LỊCH TRÌNH
//  */
// export async function getGeminiReport(taskList) {
//   const now = new Date();
//   const year = now.getFullYear();
//   const month = (now.getMonth() + 1).toString().padStart(2, '0');
//   const day = now.getDate().toString().padStart(2, '0');
//   const todayStr = `${year}-${month}-${day}`;

//   const tomorrowObj = new Date();
//   tomorrowObj.setDate(now.getDate() + 1);
//   const tomYear = tomorrowObj.getFullYear();
//   const tomMonth = (tomorrowObj.getMonth() + 1).toString().padStart(2, '0');
//   const tomDay = tomorrowObj.getDate().toString().padStart(2, '0');
//   const tomorrowStr = `${tomYear}-${tomMonth}-${tomDay}`;

//   const doneToday = taskList.filter(t => t.dateKey === todayStr && t.completed);
//   const pendingToday = taskList.filter(t => t.dateKey === todayStr && !t.completed);
//   const tasksTomorrow = taskList.filter(t => t.dateKey === tomorrowStr && !t.completed);

//   const getTimeOnly = (dateTimeStr) => (dateTimeStr ? dateTimeStr.split(' ')[1] || '' : '');

//   let contextText = `Lịch trình công việc:\n`;
//   if (doneToday.length > 0) {
//     contextText +=
//       `- Các việc ĐÃ HOÀN THÀNH HÔM NAY:\n` +
//       doneToday.map(t => `  + ${t.text} (${getTimeOnly(t.dateTimeStr)})`).join('\n') +
//       '\n';
//   }
//   if (pendingToday.length > 0) {
//     contextText +=
//       `- Các việc ĐANG CHỜ LÀM HÔM NAY:\n` +
//       pendingToday.map(t => `  + ${t.text} (${getTimeOnly(t.dateTimeStr)})`).join('\n') +
//       '\n';
//   }
//   if (tasksTomorrow.length > 0) {
//     contextText +=
//       `- Các việc DỰ KIẾN NGÀY MAI:\n` +
//       tasksTomorrow.map(t => `  + ${t.text} (${getTimeOnly(t.dateTimeStr)})`).join('\n') +
//       '\n';
//   }

//   const promptText = `Bạn là trợ lý cá nhân thân thiện. Hãy báo cáo ngắn gọn dưới 40 từ về lịch trình sau:\n${contextText}`;

//   for (let i = 0; i < GEMINI_API_KEYS.length; i++) {
//     try {
//       const resultText = await callGeminiApi(GEMINI_API_KEYS[i], promptText);
//       return { success: true, text: resultText };
//     } catch (err) {
//       console.log(`Key số ${i + 1} gặp lỗi:`, err.message);
//     }
//   }

//   console.log('Tất cả API Keys đều lỗi/hết Quota. Chuyển sang Báo cáo Offline!');
//   return { success: true, text: generateLocalReport(taskList) };
// }

// /**
//  * 2. HÀM BÓC TÁCH GIỌNG NÓI TỰ ĐỘNG TẠO LỊCH TRÌNH
//  */
// export async function parseTaskFromVoice(voiceText) {
//   if (!voiceText) return null;

//   const now = new Date();
//   const currentHour = now.getHours();
//   const currentMinute = now.getMinutes();

//   const promptText = `Bóc tách thời gian từ câu: "${voiceText}". Hiện tại là ${currentHour}:${currentMinute}. Trả về JSON duy nhất dạng: {"taskName": "tên việc", "hour": 15, "minute": 30}`;

//   for (let i = 0; i < GEMINI_API_KEYS.length; i++) {
//     try {
//       const resultText = await callGeminiApi(GEMINI_API_KEYS[i], promptText, true);
//       const parsed = JSON.parse(resultText);
//       return {
//         taskName: parsed.taskName || voiceText,
//         hour: Number(parsed.hour) || currentHour + 1,
//         minute: Number(parsed.minute) || 0,
//       };
//     } catch (err) {
//       console.log(`Key phân tích số ${i + 1} gặp lỗi:`, err.message);
//     }
//   }

//   console.log('Tất cả API Keys lỗi. Chuyển sang Bóc tách Offline!');
//   return fallbackTimeParser(voiceText);
// }
import { fallbackTimeParser, generateLocalReport } from './fallbackService';

// 🔑 API Key Groq của bạn
const GROQ_API_KEY = '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';

/**
 * 🛠️ Hàm tự động lấy mô hình Chat/LLM đang hoạt động thực tế trên Groq
 * (Đã loại bỏ các mô hình kiểm duyệt như prompt-guard, whisper)
 */
async function getDynamicGroqModel() {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
    });
    const data = await res.json();

    if (data && data.data && data.data.length > 0) {
      const chatModels = data.data.filter(m => {
        const id = m.id.toLowerCase();
        return !id.includes('guard') && !id.includes('whisper') && !id.includes('safeguard');
      });

      const preferredModel = chatModels.find(m => 
        m.id.includes('llama-3.3') || 
        m.id.includes('llama-3.1') || 
        m.id.includes('qwen') || 
        m.id.includes('mixtral')
      ) || chatModels[0];

      if (preferredModel) {
        console.log(`🤖 Tự động chọn mô hình Groq Chat chuẩn: ${preferredModel.id}`);
        return preferredModel.id;
      }
    }
  } catch (err) {
    console.log('Không dò được danh sách model Groq:', err);
  }
  return 'llama-3.3-70b-versatile';
}

/**
 * Hàm helper gọi REST API của Groq
 */
async function callGroqApi(promptText, isJson = false) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const targetModel = await getDynamicGroqModel();

  const systemMessage = isJson
    ? 'Bạn là bộ bóc tách thời gian công việc. Hãy luôn phản hồi ở định dạng JSON chuẩn.'
    : 'Bạn là một trợ lý cá nhân thân thiện, ấm áp. Hãy báo cáo lịch trình công việc một cách tự nhiên và lưu khoát.';

  const bodyData = {
    model: targetModel,
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: promptText },
    ],
    temperature: 0.3,
    max_tokens: isJson ? 150 : 300, // Đủ dung lượng cho bài báo cáo đầy đủ
  };

  if (isJson) {
    bodyData.response_format = { type: 'json_object' };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(bodyData),
  });

  const data = await response.json();

  if (response.ok && data.choices && data.choices[0]?.message?.content) {
    return data.choices[0].message.content.trim();
  }

  throw new Error(data.error?.message || 'Lỗi gọi API từ Groq');
}

/**
 * 1. HÀM TẠO BÁO CÁO AI TỔNG HỢP LỊCH TRÌNH (FORM GEMINI CHUẨN CŨ)
 */
export async function getGeminiReport(taskList) {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const tomorrowObj = new Date();
  tomorrowObj.setDate(now.getDate() + 1);
  const tomYear = tomorrowObj.getFullYear();
  const tomMonth = (tomorrowObj.getMonth() + 1).toString().padStart(2, '0');
  const tomDay = tomorrowObj.getDate().toString().padStart(2, '0');
  const tomorrowStr = `${tomYear}-${tomMonth}-${tomDay}`;

  const doneToday = taskList.filter(t => t.dateKey === todayStr && t.completed);
  const pendingToday = taskList.filter(t => t.dateKey === todayStr && !t.completed);
  const tasksTomorrow = taskList.filter(t => t.dateKey === tomorrowStr && !t.completed);

  const getTimeOnly = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    const parts = dateTimeStr.split(' ');
    return parts[1] || '';
  };

  let contextText = `Lịch trình công việc:\n`;

  if (doneToday.length > 0) {
    contextText += `- Các việc ĐÃ HOÀN THÀNH HÔM NAY (Ngày ${now.getDate()}):\n` + 
      doneToday.map(t => `  + ${t.text} (lúc ${getTimeOnly(t.dateTimeStr)})`).join('\n') + '\n';
  }

  if (pendingToday.length > 0) {
    contextText += `- Các việc ĐANG CHỜ LÀM HÔM NAY (Ngày ${now.getDate()}):\n` + 
      pendingToday.map(t => `  + ${t.text} (lúc ${getTimeOnly(t.dateTimeStr)})`).join('\n') + '\n';
  }

  if (tasksTomorrow.length > 0) {
    contextText += `- Các việc DỰ KIẾN NGÀY MAI (Ngày ${tomorrowObj.getDate()}):\n` + 
      tasksTomorrow.map(t => `  + ${t.text} (lúc ${getTimeOnly(t.dateTimeStr)})`).join('\n') + '\n';
  }

  // PROMPT CHUẨN CỦA GEMINI
  const promptText = `Bạn là một trợ lý cá nhân thân thiện, ấm áp. Hãy báo cáo lịch trình dựa trên dữ liệu sau:

${contextText}

QUY TẮC BÁO CÁO:
1. KHÔNG LẶP LẠI NGÀY NHIỀU LẦN. Chỉ cần nói "Hôm nay" MỘT LẦN DUY NHẤT ở đầu nhóm việc hôm nay. Tương tự với "Ngày mai", chỉ nói MỘT LẦN DUY NHẤT.
2. Mẫu câu chuẩn tự nhiên: "Hôm nay, bạn đã xong việc A lúc 9 giờ. Bạn vẫn còn việc B lúc 15 giờ 30 đang chờ. Ngày mai, bạn có việc C lúc 8 giờ."
3. TUYỆT ĐỐI KHÔNG NÓI THÁNG VÀ NĂM.
4. Bỏ qua hoàn toàn các mục trống.
5. Lời báo cáo dưới 50 từ, văn phong lưu khoát, tự nhiên.`;

  try {
    const resultText = await callGroqApi(promptText, false);
    return { success: true, text: resultText };
  } catch (err) {
    console.log('Groq API gặp sự cố, chuyển sang Báo cáo Offline:', err.message);
    return { success: true, text: generateLocalReport(taskList) };
  }
}

/**
 * 2. HÀM BÓC TÁCH GIỌNG NÓI TỰ ĐỘNG TẠO LỊCH TRÌNH
 */
export async function parseTaskFromVoice(voiceText) {
  if (!voiceText) return null;

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const promptText = `Thời gian hiện tại: ${currentHour}:${currentMinute}.
Câu nói của người dùng: "${voiceText}"

Quy tắc bóc tách:
- "3 giờ chiều" -> hour: 15, minute: 0
- "8 giờ tối" -> hour: 20, minute: 0
- "8 giờ sáng" -> hour: 8, minute: 0
- "rưỡi" -> minute: 30
- Nếu không có giờ, lấy giờ hiện tại + 1.

Hãy trả về duy nhất định dạng JSON:
{"taskName": "Tên công việc ngắn gọn", "hour": 15, "minute": 30}`;

  try {
    const resultText = await callGroqApi(promptText, true);
    const parsed = JSON.parse(resultText);
    return {
      taskName: parsed.taskName || voiceText,
      hour: Number(parsed.hour) || currentHour + 1,
      minute: Number(parsed.minute) || 0,
    };
  } catch (err) {
    console.log('Groq bóc tách gặp sự cố, chuyển sang Offline:', err.message);
    return fallbackTimeParser(voiceText);
  }
}