import { fallbackTimeParser } from './fallbackService';

// 🔑 API Key Groq của bạn
const GROQ_API_KEY = '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';

/**
 * 🛠️ Hàm tự động lấy mô hình Chat/LLM đang hoạt động thực tế trên Groq
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
    max_tokens: isJson ? 150 : 300,
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
 * 1. HÀM TẠO BÁO CÁO AI TỔNG HỢP LỊCH TRÌNH
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

/**
 * 3. HÀM TẠO BÁO CÁO OFFLINE MẪU CỨNG MERGE DỮ LIỆU THỰC TẾ GỬI SẾP
 */
export function generateLocalReport(taskList = []) {
  const now = new Date();
  
  // Tạo chuỗi ngày hôm nay dạng DD/MM/YYYY và YYYY-MM-DD
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const todayFormatted = `${day}/${month}/${year}`;
  const todayStr = `${year}-${month}-${day}`;

  // Tạo chuỗi ngày mai
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  const tDay = String(tomorrow.getDate()).padStart(2, '0');
  const tMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const tYear = tomorrow.getFullYear();
  const tomorrowStr = `${tYear}-${tMonth}-${tDay}`;

  // Hàm chuẩn hóa dateKey về YYYY-MM-DD từ bất kỳ định dạng nào của task
  const getNormalizedDateKey = (task) => {
    if (task.dateKey) {
      if (task.dateKey.includes('/')) {
        const [d, m, y] = task.dateKey.split('/');
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
      return task.dateKey.trim();
    }
    if (task.dateTimeStr) {
      const [datePart] = task.dateTimeStr.split(' ');
      if (datePart && datePart.includes('/')) {
        const [d, m, y] = datePart.split('/');
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }
    return '';
  };

  // Lấy phần giờ (HH:mm) để hiển thị
  const getTimeOnly = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    const parts = dateTimeStr.split(' ');
    return parts[1] ? `(lúc ${parts[1]})` : '';
  };

  // Merge & Phân loại dữ liệu thực tế từ taskList
  const doneToday = taskList.filter(t => getNormalizedDateKey(t) === todayStr && t.completed);
  const pendingToday = taskList.filter(t => getNormalizedDateKey(t) === todayStr && !t.completed);
  const tasksTomorrow = taskList.filter(t => getNormalizedDateKey(t) === tomorrowStr);

  let reportLines = [];

  reportLines.push(`📋 BÁO CÁO CÔNG VIỆC NGÀY ${todayFormatted}`);
  reportLines.push(`----------------------------------------`);

  // Mục I: Hoàn thành
  reportLines.push(`I. CÔNG VIỆC ĐÃ HOÀN THÀNH (${doneToday.length})`);
  if (doneToday.length > 0) {
    doneToday.forEach((t, idx) => {
      reportLines.push(`  ${idx + 1}. [✓] ${t.text}${getTimeOnly(t.dateTimeStr)}`);
    });
  } else {
    reportLines.push(`  - Chưa có công việc nào hoàn thành.`);
  }

  reportLines.push(``);

  // Mục II: Chưa hoàn thành
  reportLines.push(`II. CÔNG VIỆC CHƯA HOÀN THÀNH (${pendingToday.length})`);
  if (pendingToday.length > 0) {
    pendingToday.forEach((t, idx) => {
      reportLines.push(`  ${idx + 1}. [!] ${t.text}${getTimeOnly(t.dateTimeStr)}`);
    });
  } else {
    reportLines.push(`  - Tất cả công việc trong ngày đã hoàn tất.`);
  }

  reportLines.push(``);

  // Mục III: Kế hoạch ngày mai
  reportLines.push(`III. KẾ HOẠCH NGÀY MAI (${tDay}/${tMonth}) (${tasksTomorrow.length})`);
  if (tasksTomorrow.length > 0) {
    tasksTomorrow.forEach((t, idx) => {
      reportLines.push(`  ${idx + 1}. [ ] ${t.text} ${getTimeOnly(t.dateTimeStr)}`);
    });
  } else {
    reportLines.push(`  - Chưa có kế hoạch cho ngày mai.`);
  }

  return reportLines.join('\n');
}
/**
 * 4. AI HỖ TRỢ CHIA NHỎ TASK KHÓ THÀNH CÁC SUB-TASKS
 */
/**
 * 4. AI HỖ TRỢ CHIA NHỎ TASK KHÓ THÀNH CÁC SUB-TASKS (XỬ LÝ ẨN KẾT QUẢ KHI LỖI)
 */
export async function breakdownTaskWithAi(taskText) {
  if (!taskText) return [];

  const promptText = `Công việc: "${taskText}".
Hãy chia nhỏ công việc này thành 3 bước ngắn gọn.
Chỉ trả về JSON duy nhất theo mẫu: {"steps": ["Bước 1", "Bước 2", "Bước 3"]}`;

  try {
    const resultText = await callGroqApi(promptText, true);
    
    // Làm sạch chuỗi trước khi ép kiểu JSON
    const cleanText = resultText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanText);

    let stepsArray = [];
    if (Array.isArray(parsed)) {
      stepsArray = parsed;
    } else if (parsed && Array.isArray(parsed.steps)) {
      stepsArray = parsed.steps;
    } else if (parsed && typeof parsed === 'object') {
      stepsArray = Object.values(parsed);
    }

    if (!stepsArray || stepsArray.length === 0) {
      return []; // Trả về mảng rỗng để ẩn hoàn toàn UI gợi ý
    }

    return stepsArray.slice(0, 3).map((stepText, index) => ({
      id: `sub_${Date.now()}_${index}`,
      text: String(stepText),
      completed: false,
    }));
  } catch (err) {
    console.log('Lỗi AI chia nhỏ task (Ẩn UI kết quả):', err.message);
    // 🛡️ TRẢ VỀ MẢNG RỖNG KHI LỖI ĐỂ KHÔNG HIỂN THỊ UI RÁC
    return [];
  }
}