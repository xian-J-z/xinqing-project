// pages/mine/mine.js
const app = getApp();

Page({
  data: {
    userInfo: null,
    userRole: 'user',
    stats: {
      testCount: 0,
      appointmentCount: 0,
      treeholeCount: 0,
      aiCount: 0,
      replyCount: 0  // 咨询师回复数
    },
    currentTab: 0,
    testRecords: [],
    appointmentRecords: [],
    treeholeRecords: [],
    aiRecords: [],
    counselorStats: {
      totalReplies: 0,
      todayReplies: 0,
      avgRating: 5.0,
      totalConsults: 12
    }
  },

  onLoad: function() {
    this.loadUserInfo();
    this.loadRecords();
  },

  onShow: function() {
    this.loadUserInfo();
    this.loadRecords();
  },

  // 加载用户信息
  loadUserInfo: function() {
    const userInfo = app.getUserInfo();
    const userRole = app.getUserRole();
    this.setData({ userInfo: userInfo, userRole: userRole });
  },

  // 加载所有记录
  loadRecords: function() {
    const testRecords = wx.getStorageSync('testRecords') || [];
    const appointmentRecords = wx.getStorageSync('appointments') || [];
    const treeholeRecords = wx.getStorageSync('myPosts') || [];
    const aiRecords = wx.getStorageSync('aiRecords') || [];
    
    this.setData({
      testRecords: testRecords,
      appointmentRecords: appointmentRecords,
      treeholeRecords: treeholeRecords,
      aiRecords: aiRecords,
      stats: {
        testCount: testRecords.length,
        appointmentCount: appointmentRecords.length,
        treeholeCount: treeholeRecords.length,
        aiCount: aiRecords.length
      }
    });
  },

  // 切换Tab
  switchTab: function(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ currentTab: index });
  },

  // 退出登录
  logout: function() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout();
        }
      }
    });
  },

  // 跳转到测评记录详情
  goToTestDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/test/test?recordId=' + id
    });
  },

  // 跳转到AI分析
  goToAI: function() {
    wx.navigateTo({
      url: '/pages/ai/ai'
    });
  },

  // 跳转到心理树洞
  goToTreehole: function() {
    wx.navigateTo({
      url: '/pages/treehole/treehole'
    });
  },

  // 跳转到预约
  goToAppointment: function() {
    wx.navigateTo({
      url: '/pages/appointment/appointment'
    });
  }
});
