// utils/util.js

// 格式化日期
function formatDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 格式化时间
function formatTime(date) {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// 显示加载提示
function showLoading(title = '加载中...') {
  wx.showLoading({
    title: title,
    mask: true
  });
}

// 隐藏加载提示
function hideLoading() {
  wx.hideLoading();
}

// 显示Toast
function showToast(title, icon = 'success') {
  wx.showToast({
    title: title,
    icon: icon
  });
}

// 显示模态框
function showModal(title, content, success) {
  wx.showModal({
    title: title,
    content: content,
    success: success
  });
}

// 保存数据到本地存储
function saveData(key, data) {
  try {
    wx.setStorageSync(key, data);
    return true;
  } catch (e) {
    console.error('保存数据失败:', e);
    return false;
  }
}

// 从本地存储获取数据
function getData(key, defaultValue = null) {
  try {
    const value = wx.getStorageSync(key);
    return value || defaultValue;
  } catch (e) {
    console.error('获取数据失败:', e);
    return defaultValue;
  }
}

// 移除本地存储数据
function removeData(key) {
  try {
    wx.removeStorageSync(key);
    return true;
  } catch (e) {
    console.error('移除数据失败:', e);
    return false;
  }
}

// 拨打电话
function makePhoneCall(phoneNumber) {
  wx.makePhoneCall({
    phoneNumber: phoneNumber
  });
}

// 复制文本到剪贴板
function copyText(text) {
  wx.setClipboardData({
    data: text,
    success: () => {
      showToast('已复制到剪贴板');
    }
  });
}

// 获取当前日期字符串
function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()];
  return `${year}年${month}月${day}日 ${weekDay}`;
}

// 验证手机号
function validatePhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

// 验证邮箱
function validateEmail(email) {
  return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(email);
}

// 获取星期几
function getWeekDay(date) {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[date.getDay()];
}

module.exports = {
  formatDate,
  formatTime,
  showLoading,
  hideLoading,
  showToast,
  showModal,
  saveData,
  getData,
  removeData,
  makePhoneCall,
  copyText,
  getCurrentDate,
  validatePhone,
  validateEmail,
  getWeekDay
};
