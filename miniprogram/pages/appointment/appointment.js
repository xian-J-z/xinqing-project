// pages/appointment/appointment.js
const app = getApp();

Page({
  data: {
    userRole: 'user',
    counselors: [],
    selectedCounselor: null,
    selectedDate: '',
    selectedTime: '',
    dates: [],
    times: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
    showBookingModal: false,
    bookingReason: '',
    appointments: [],
    myConsultations: [],  // 咨询师的预约列表
    loading: false,
    currentView: 'booking'  // booking=预约列表, manage=管理预约
  },

  onLoad: function() {
    this.setData({ userRole: app.getUserRole() });
    this.loadCounselors();
    this.generateDates();
    this.loadAppointments();
    this.loadMyConsultations();
  },

  onShow: function() {
    this.setData({ userRole: app.getUserRole() });
    this.loadAppointments();
    this.loadMyConsultations();
  },

  // 加载咨询师列表
  loadCounselors: function() {
    const counselors = [
      {
        id: '1',
        name: '张明',
        title: '资深心理咨询师',
        avatar: '👨‍⚕️',
        specialties: ['焦虑抑郁', '人际关系', '学业压力'],
        experience: '10年',
        rating: 4.9,
        consults: 1200,
        price: 200,
        available: true
      },
      {
        id: '2',
        name: '李芳',
        title: '国家二级心理咨询师',
        avatar: '👩‍⚕️',
        specialties: ['情感问题', '自我成长', '职业规划'],
        experience: '8年',
        rating: 4.8,
        consults: 980,
        price: 180,
        available: true
      },
      {
        id: '3',
        name: '王强',
        title: '心理治疗师',
        avatar: '👨‍🏫',
        specialties: ['睡眠问题', '情绪管理', '青少年心理'],
        experience: '12年',
        rating: 4.9,
        consults: 1500,
        price: 220,
        available: false
      },
      {
        id: '4',
        name: '陈静',
        title: '临床心理咨询师',
        avatar: '👩‍🔬',
        specialties: ['创伤修复', '强迫症', '社交恐惧'],
        experience: '15年',
        rating: 5.0,
        consults: 2000,
        price: 250,
        available: true
      }
    ];
    
    this.setData({ counselors: counselors });
  },

  // 生成可预约日期
  generateDates: function() {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        weekDay: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()],
        day: date.getDate()
      });
    }
    
    this.setData({ dates: dates });
  },

  // 加载预约记录（普通用户）
  loadAppointments: function() {
    const appointments = wx.getStorageSync('appointments') || [];
    this.setData({ appointments: appointments });
  },

  // 加载咨询师的预约列表
  loadMyConsultations: function() {
    if (this.data.userRole !== 'counselor') return;
    
    // 从本地存储获取所有预约，筛选出当前咨询师的
    const allAppointments = wx.getStorageSync('allAppointments') || [];
    const myConsultations = allAppointments.filter(a => {
      return a.counselorOpenid === app.getOpenid();
    });
    
    this.setData({ myConsultations: myConsultations });
  },

  // 选择咨询师
  selectCounselor: function(e) {
    const id = e.currentTarget.dataset.id;
    const counselor = this.data.counselors.find(c => c.id === id);
    
    if (!counselor.available) {
      wx.showToast({ title: '该咨询师暂不可预约', icon: 'none' });
      return;
    }
    
    this.setData({
      selectedCounselor: counselor,
      showBookingModal: true
    });
  },

  // 选择日期
  selectDate: function(e) {
    const date = e.currentTarget.dataset.date;
    this.setData({ selectedDate: date });
  },

  // 选择时间
  selectTime: function(e) {
    const time = e.currentTarget.dataset.time;
    this.setData({ selectedTime: time });
  },

  // 输入预约原因
  onReasonInput: function(e) {
    this.setData({ bookingReason: e.detail.value });
  },

  // 确认预约
  confirmBooking: function() {
    const { selectedCounselor, selectedDate, selectedTime, bookingReason, appointments, userRole } = this.data;
    
    // 咨询师不能预约
    if (userRole === 'counselor') {
      wx.showToast({ title: '咨询师身份无法预约', icon: 'none' });
      return;
    }
    
    if (!selectedDate) {
      wx.showToast({ title: '请选择预约日期', icon: 'none' });
      return;
    }
    
    if (!selectedTime) {
      wx.showToast({ title: '请选择预约时间', icon: 'none' });
      return;
    }
    
    if (!bookingReason.trim()) {
      wx.showToast({ title: '请填写预约原因', icon: 'none' });
      return;
    }

    const userInfo = app.getUserInfo();
    const newAppointment = {
      id: Date.now().toString(),
      openid: app.getOpenid(),
      userName: userInfo.nickName || '用户',
      userAvatar: userInfo.avatarUrl || '',
      counselorOpenid: selectedCounselor.openid || '',
      counselorId: selectedCounselor.id,
      counselorName: selectedCounselor.name,
      counselorTitle: selectedCounselor.title,
      date: selectedDate,
      time: selectedTime,
      reason: bookingReason,
      status: '待确认',
      createTime: new Date().toISOString()
    };

    appointments.unshift(newAppointment);
    wx.setStorageSync('appointments', appointments);
    wx.setStorageSync('appointmentRecords', appointments);
    
    // 保存到所有预约（供咨询师查看）
    const allAppointments = wx.getStorageSync('allAppointments') || [];
    allAppointments.unshift(newAppointment);
    wx.setStorageSync('allAppointments', allAppointments);
    
    this.setData({
      showBookingModal: false,
      appointments: appointments,
      selectedCounselor: null,
      selectedDate: '',
      selectedTime: '',
      bookingReason: ''
    });
    
    wx.showToast({ title: '预约成功', icon: 'success' });
  },

  // 取消预约
  cancelAppointment: function(e) {
    const id = e.currentTarget.dataset.id;
    const appointments = this.data.appointments.filter(a => a.id !== id);
    wx.setStorageSync('appointments', appointments);
    this.setData({ appointments: appointments });
    wx.showToast({ title: '已取消预约', icon: 'success' });
  },

  // 关闭弹窗
  closeModal: function() {
    this.setData({
      showBookingModal: false,
      selectedDate: '',
      selectedTime: '',
      bookingReason: ''
    });
  },

  // 切换视图（预约/管理）
  switchView: function(e) {
    const view = e.currentTarget.dataset.view;
    this.setData({ currentView: view });
  },

  // 咨询师确认预约
  confirmConsultation: function(e) {
    const id = e.currentTarget.dataset.id;
    let allAppointments = wx.getStorageSync('allAppointments') || [];
    
    allAppointments = allAppointments.map(a => {
      if (a.id === id) {
        return { ...a, status: '已确认' };
      }
      return a;
    });
    
    wx.setStorageSync('allAppointments', allAppointments);
    this.loadMyConsultations();
    wx.showToast({ title: '已确认预约', icon: 'success' });
  },

  // 咨询师拒绝预约
  rejectConsultation: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '拒绝预约',
      content: '确定要拒绝此预约吗？',
      success: (res) => {
        if (res.confirm) {
          let allAppointments = wx.getStorageSync('allAppointments') || [];
          
          allAppointments = allAppointments.map(a => {
            if (a.id === id) {
              return { ...a, status: '已拒绝' };
            }
            return a;
          });
          
          wx.setStorageSync('allAppointments', allAppointments);
          this.loadMyConsultations();
          wx.showToast({ title: '已拒绝预约', icon: 'success' });
        }
      }
    });
  },

  // 咨询师完成咨询
  completeConsultation: function(e) {
    const id = e.currentTarget.dataset.id;
    let allAppointments = wx.getStorageSync('allAppointments') || [];
    
    allAppointments = allAppointments.map(a => {
      if (a.id === id) {
        return { ...a, status: '已完成' };
      }
      return a;
    });
    
    wx.setStorageSync('allAppointments', allAppointments);
    this.loadMyConsultations();
    wx.showToast({ title: '咨询已完成', icon: 'success' });
  }
});
