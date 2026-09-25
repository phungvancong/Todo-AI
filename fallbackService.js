/**
 * DỊCH VỤ BÓC TÁCH VÀ TẠO BÁO CÁO OFFLINE (FALLBACK)
 * Tự động chạy khi toàn bộ API Keys bị hết Quota hoặc thiết bị mất mạng
 */

// 1. Phân tích câu nói giọng nói thành tên công việc + giờ thủ công
export function fallbackTimeParser(text) {
  if (!text) return null;

  const now = new Date();
  let hour = now.getHours() + 1;
  let minute = 0;

  const hourMatch = text.match(/(\d{1,2})\s*(giờ|h)/i);
  if (hourMatch) {
    hour = parseInt(hourMatch[1], 10);
  }

  if (/chiều/i.test(text) && hour < 12) hour += 12;
  if (/tối|đêm/i.test(text) && hour < 12) hour += 12;

  if (/rưỡi/i.test(text)) {
    minute = 30;
  } else {
    const minuteMatch = text.match(/(\d{1,2})\s*phút/i);
    if (minuteMatch) {
      minute = parseInt(minuteMatch[1], 10);
    }
  }

  let cleanTask = text
    .replace(/(lúc|vào|ngày|hôm nay|ngày mai)\s*\d{1,2}\s*(giờ|h|phút)?/gi, '')
    .replace(/(sáng|chiều|tối|đêm|rưỡi)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    taskName: cleanTask || text,
    hour: hour > 23 ? 23 : hour,
    minute: minute > 59 ? 59 : minute,
  };
}

/**
 * TỰ TẠO BÁO CÁO OFFLINE (XỬ LÝ CHUẨN CÔNG VIỆC QUÁ HẠN)
 */
export function generateLocalReport(taskList) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Lọc danh sách công việc hôm nay
  const doneToday = taskList.filter(t => t.dateKey === todayStr && t.completed);
  
  // Phân loại việc chưa xong: Đã quá hạn vs Đang chờ trong tương lai
  const pendingToday = taskList.filter(t => t.dateKey === todayStr && !t.completed);
  const overdueToday = [];
  const upcomingToday = [];

  pendingToday.forEach(t => {
    if (t.dateTimeStr) {
      const [datePart, timePart] = t.dateTimeStr.split(' ');
      if (datePart && timePart) {
        const [day, month, year] = datePart.split('/').map(Number);
        const [hour, minute] = timePart.split(':').map(Number);
        const taskTime = new Date(year, month - 1, day, hour, minute);

        if (taskTime.getTime() < now.getTime()) {
          overdueToday.push(t); // Đã qua giờ
        } else {
          upcomingToday.push(t); // Sắp tới giờ
        }
      } else {
        upcomingToday.push(t);
      }
    } else {
      upcomingToday.push(t);
    }
  });

  const tasksTomorrow = taskList.filter(t => t.dateKey === tomorrowStr);

  const getTimeStr = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    const parts = dateTimeStr.split(' ');
    return parts[1] ? `lúc ${parts[1]}` : '';
  };

  let reportParts = [];

  // Báo cáo chi tiết hôm nay
  if (doneToday.length > 0 || overdueToday.length > 0 || upcomingToday.length > 0) {
    let details = [];

    if (doneToday.length > 0) {
      const doneText = doneToday.map(t => `${t.text} ${getTimeStr(t.dateTimeStr)}`).join(', ');
      details.push(`bạn đã hoàn thành ${doneText}`);
    }

    if (overdueToday.length > 0) {
      const overdueText = overdueToday.map(t => `${t.text} ${getTimeStr(t.dateTimeStr)}`).join(', ');
      details.push(`bạn có các việc đã quá hạn chưa hoàn thành là ${overdueText}`);
    }

    if (upcomingToday.length > 0) {
      const upcomingText = upcomingToday.map(t => `${t.text} ${getTimeStr(t.dateTimeStr)}`).join(', ');
      details.push(`còn ${upcomingText} sắp tới giờ`);
    }

    reportParts.push('Hôm nay: ' + details.join('; ') + '.');
  }

  // Báo cáo việc ngày mai
  if (tasksTomorrow.length > 0) {
    const tomorrowText = tasksTomorrow.map(t => `${t.text} ${getTimeStr(t.dateTimeStr)}`).join(', ');
    reportParts.push(`Ngày mai: bạn có lịch ${tomorrowText}.`);
  }

  if (reportParts.length === 0) {
    return 'Hôm nay và ngày mai bạn chưa có lịch trình công việc nào.';
  }

  return reportParts.join(' ');
}