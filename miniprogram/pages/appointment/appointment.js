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
    times: ['09:00', '11:00', '15:00', '17:00'],
    bookedTimes: [], 
    dateBookedStatus: {}, 
    showBookingModal: false,
    bookingReason: '',
    appointments: [],
    loading: false
  },

  onLoad: function () {
    this.loadCounselors();
    this.generateDates();
    this.loadAppointments();
  },

  onShow: function () {
    this.loadAppointments();
  },

  // 加载咨询师列表
  loadCounselors: function () {
    const db = wx.cloud.database();
    db.collection('counselor').where({
      available: true
    }).get({
      success: res => {
        const counselors = res.data.map(item => ({
          _id: item._id,
          openid: item.openid || '',  // 咨询师openid
          name: item.name || '未命名咨询师',
          title: item.title || '心理咨询师',
          avatar: item.avatar || '👨‍⚕️',
          profile: item.profile || '',
          specialties: item.specialties || [],
          experience: item.experience || '3年以上',
          rating: item.rating || 5.0,
          consults: item.consults || 0,
          price: item.price || 200,
          available: item.available !== false
        }));
        this.setData({ counselors: counselors });
      },
      fail: err => {
        console.error('获取咨询师列表失败', err);
        wx.showToast({ title: '加载咨询师失败', icon: 'none' });
      }
    });
  },

  // 生成日期
  generateDates: function () {
    const dates = [];
    const today = new Date();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');

      dates.push({
        date: `${year}-${month}-${day}`,
        displayDate: `${month}月${day}日`,
        weekDay: weekDays[date.getDay()],
        day: date.getDate(),
        month: date.getMonth() + 1
      });
    }
    this.setData({ dates });
  },

  // 加载用户预约
  loadAppointments: function () {
    const openid = app.getOpenid();
    const db = wx.cloud.database();
    
    db.collection('appointment').where({
      openid: openid
    }).orderBy('createTimeStr', 'desc').get({
      success: res => {
        console.log('加载用户预约', res.data);
        this.setData({ appointments: res.data });
        wx.setStorageSync('appointments', res.data);
        wx.setStorageSync('allAppointments', res.data);
      },
      fail: err => {
        console.error('加载用户预约失败', err);
        const appointments = wx.getStorageSync('appointments') || [];
        this.setData({ appointments });
      }
    });
  },

  // 选择咨询师 → 打开弹窗
  selectCounselor: function (e) {
    const id = e.currentTarget.dataset.id;
    const counselor = this.data.counselors.find(c => c._id === id);

    if (!counselor.available) {
      wx.showToast({ title: '该咨询师暂不可预约', icon: 'none' });
      return;
    }

    this.setData({
      selectedCounselor: counselor,
      showBookingModal: true,
      selectedDate: '',
      selectedTime: '',
      bookingReason: '',
      bookedTimes: []
    }, () => {
      this.getBookedTimesForAllDates();
    });
  },

  // 选择日期 → 自动刷新已约时间段
  selectDate: function (e) {
    const date = e.currentTarget.dataset.date;
    this.setData({ selectedDate: date, selectedTime: '' });
    this.getBookedTimes();
  },

  // 选择时间
  selectTime: function (e) {
    const time = e.currentTarget.dataset.time;
    this.setData({ selectedTime: time });
  },

  // 获取已预约时间段
  getBookedTimes: function () {
    const { selectedCounselor, selectedDate } = this.data;
    if (!selectedCounselor || !selectedDate) return;

    const allAppointments = wx.getStorageSync('allAppointments') || [];

    const booked = allAppointments.filter(item => {
      return item.counselorId === selectedCounselor._id
        && item.date === selectedDate
        && item.status !== '已拒绝'
        && item.status !== '已取消';
    }).map(item => item.time);

    this.setData({ bookedTimes: [...new Set(booked)] });
  },

  //获取所有日期的已约时间（用于判断日期是否约满）
  getBookedTimesForAllDates: function () {
    const { selectedCounselor, dates } = this.data;
    if (!selectedCounselor) return;

    const allAppointments = wx.getStorageSync('allAppointments') || [];
    const dateBookedStatus = {};

    dates.forEach(item => {
      const date = item.date;
      const booked = allAppointments.filter(a => {
        return a.counselorId === selectedCounselor._id
          && a.date === date
          && a.status !== '已拒绝'
          && a.status !== '已取消';
      }).map(a => a.time);
      dateBookedStatus[date] = booked;
    });

    this.setData({ dateBookedStatus });
  },

  //判断日期是否全部约满
  isDateFullyBooked: function (date) {
    const { times, dateBookedStatus } = this.data;
    const booked = dateBookedStatus[date] || [];
    return times.every(time => booked.includes(time));
  },

  // 输入原因
  onReasonInput: function (e) {
    this.setData({ bookingReason: e.detail.value });
  },

  // 确认预约
  confirmBooking: function () {
    const { selectedCounselor, selectedDate, selectedTime, bookingReason, appointments, bookedTimes } = this.data;

    if (!selectedDate) { wx.showToast({ title: '请选日期', icon: 'none' }); return; }
    if (!selectedTime) { wx.showToast({ title: '请选时间', icon: 'none' }); return; }

    if (bookedTimes.includes(selectedTime)) {
      wx.showToast({ title: '该时段已被预约', icon: 'none' });
      return;
    }

    const userInfo = app.getUserInfo() || {};
    const appointmentData = {
      openid: app.getOpenid(),
      userName: userInfo.nickName || '用户',
      userAvatar: userInfo.avatarUrl || '',
      counselorId: selectedCounselor._id,
      counselorName: selectedCounselor.name,
      counselorTitle: selectedCounselor.title,
      counselorOpenid: selectedCounselor.openid || '',  // 咨询师openid
      date: selectedDate,
      time: selectedTime,
      reason: bookingReason.trim() || '未填写',
      status: '待确认',
      createTimeStr: new Date().toLocaleString(),
      updateTimeStr: new Date().toLocaleString()
    };

    this.setData({ loading: true });

    wx.cloud.callFunction({
      name: 'appointment',
      data: {
        action: 'create',
        data: appointmentData
      },
      success: res => {
        console.log('预约已同步到云数据库', res);
        const cloudId = res.result._id;
        if (cloudId) {
          const newAppointment = { ...appointmentData, _id: cloudId };
          const newAppList = [newAppointment, ...appointments];
          wx.setStorageSync('appointments', newAppList);
          wx.setStorageSync('allAppointments', newAppList);

          this.setData({
            appointments: newAppList,
            selectedTime: '',
            bookingReason: '',
            loading: false
          });

          wx.showToast({ title: '预约成功', icon: 'success' });
          this.getBookedTimes();
          this.getBookedTimesForAllDates();

          setTimeout(() => {
            this.closeModal();
          }, 1000);
        }
      },
      fail: err => {
        console.error('同步预约到云数据库失败', err);
        this.setData({ loading: false });
        wx.showToast({ title: '预约失败', icon: 'none' });
      }
    });
  },

  // 取消预约
  cancelAppointment: function (e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '取消预约',
      content: '确定要取消这个预约吗？',
      success: res => {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'appointment',
            data: {
              action: 'cancel',
              appointmentId: id
            },
            success: () => {
              const appointments = this.data.appointments.map(a => {
                if (a._id === id) {
                  return { ...a, status: '已取消', updateTimeStr: new Date().toLocaleString() };
                }
                return a;
              });
              wx.setStorageSync('appointments', appointments);
              wx.setStorageSync('allAppointments', appointments);
              this.setData({ appointments });
              this.getBookedTimes();
              this.getBookedTimesForAllDates();
              wx.showToast({ title: '已取消', icon: 'success' });
            },
            fail: err => {
              console.error('取消预约失败', err);
              wx.showToast({ title: '取消失败', icon: 'none' });
            }
          });
        }
      }
    });
  },

  // 关闭弹窗
  closeModal: function () {
    this.setData({
      showBookingModal: false,
      selectedDate: '',
      selectedTime: '',
      bookingReason: '',
      bookedTimes: [],
      dateBookedStatus: {}
    });
    this.loadAppointments();
  }
});
