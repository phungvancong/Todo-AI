// import { fallbackTimeParser, generateLocalReport } from './fallbackService';

// const GROQ_API_KEY = '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';

// async function getDynamicGroqModel() {
//   try {
//     const res = await fetch('https://api.groq.com/openai/v1/models', {
//       method: 'GET',
//       headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
//     });
//     const data = await res.json();
//     if (data && data.data && data.data.length > 0) {
//       const chatModels = data.data.filter(m => {
//         const id = m.id.toLowerCase();
//         return !id.includes('guard') && !id.includes('whisper') && !id.includes('safeguard');
//       });
//       const preferredModel = chatModels.find(m => 
//         m.id.includes('llama-3.3') || m.id.includes('llama-3.1') || m.id.includes('qwen')
//       ) || chatModels[0];
//       if (preferredModel) return preferredModel.id;
//     }
//   } catch (err) {
//     console.log('Lỗi lấy model Groq:', err);
//   }
//   return 'llama-3.3-70b-versatile';
// }

// async function callGroqApi(promptText, isJson = false) {
//   const url = 'https://api.groq.com/openai/v1/chat/completions';
//   const targetModel = await getDynamicGroqModel();

//   const bodyData = {
//     model: targetModel,
//     messages: [
//       { role: 'system', content: 'Bạn là trợ lý cá nhân thông minh và ngắn gọn.' },
//       { role: 'user', content: promptText },
//     ],
//     temperature: 0.2,
//     max_tokens: isJson ? 150 : 350,
//   };

//   if (isJson) bodyData.response_format = { type: 'json_object' };

//   const response = await fetch(url, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${GROQ_API_KEY}`,
//     },
//     body: JSON.stringify(bodyData),
//   });

//   const data = await response.json();
//   if (response.ok && data.choices && data.choices[0]?.message?.content) {
//     return data.choices[0].message.content.trim();
//   }
//   throw new Error('Lỗi Groq API');
// }

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

//   const promptText = `Hôm nay:
// - Đã xong: ${doneToday.map(t => t.text).join(', ') || 'Không có'}
// - Chưa xong: ${pendingToday.map(t => `${t.text} (${getTimeOnly(t.dateTimeStr)})`).join(', ') || 'Không có'}
// Ngày mai:
// - Kế hoạch: ${tasksTomorrow.map(t => `${t.text} (${getTimeOnly(t.dateTimeStr)})`).join(', ') || 'Không có'}

// Hãy tổng hợp ngắn gọn theo 2 phần:
// 📋 Báo cáo:
// 1. Đã làm: ...
// 2. Chưa làm: ...
// 3. Ngày mai: ...

// 🔊 Văn nói: (viết 1 câu siêu ngắn gọn dịu dàng dưới 30 từ để đọc cho người dùng)`;

//   try {
//     const resultText = await callGroqApi(promptText, false);
//     return { success: true, text: resultText };
//   } catch (err) {
//     return { success: true, text: generateLocalReport(taskList) };
//   }
// }

// export async function parseTaskFromVoice(voiceText) {
//   if (!voiceText) return null;
//   const now = new Date();
//   const promptText = `Thời gian hiện tại: ${now.getHours()}:${now.getMinutes()}.\nCâu: "${voiceText}"\nTrả về JSON: {"taskName": "Tên việc", "hour": 15, "minute": 30}`;
//   try {
//     const resultText = await callGroqApi(promptText, true);
//     const parsed = JSON.parse(resultText);
//     return {
//       taskName: parsed.taskName || voiceText,
//       hour: Number(parsed.hour) || now.getHours() + 1,
//       minute: Number(parsed.minute) || 0,
//     };
//   } catch (err) {
//     return fallbackTimeParser(voiceText);
//   }
// }