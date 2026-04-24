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
    currentTab: 1,  // 默认显示预约记录
    testRecords: [],
    appointmentRecords: [],      // 全部预约记录
    validAppointments: [],       // 有效预约
    cancelledAppointments: [],    // 已取消预约
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
    const appointments = wx.getStorageSync('appointments') || [];
    const allAppointments = wx.getStorageSync('allAppointments') || [];
    const treeholeRecords = wx.getStorageSync('myPosts') || [];
    const aiRecords = wx.getStorageSync('aiRecords') || [];
    
    // 用 allAppointments 的最新状态同步更新 appointments 中的记录
    const statusMap = {};
    allAppointments.forEach(item => {
      statusMap[item._id] = item;
    });
    const syncedAppointments = appointments.map(item => {
      return statusMap[item._id] || item;
    });
    
    // 如果有状态不同步的，回写 appointments 缓存
    let needSync = false;
    for (let i = 0; i < appointments.length; i++) {
      if (syncedAppointments[i] && syncedAppointments[i].status !== appointments[i].status) {
        needSync = true;
        break;
      }
    }
    if (needSync) {
      wx.setStorageSync('appointments', syncedAppointments);
    }
    
    // 区分有效预约和已取消预约
    const validAppointments = syncedAppointments.filter(item => 
      item.status !== '已取消' && item.status !== '已拒绝'
    );
    const cancelledAppointments = syncedAppointments.filter(item => 
      item.status === '已取消' || item.status === '已拒绝'
    );
    
    this.setData({
      testRecords: testRecords,
      appointmentRecords: syncedAppointments,
      validAppointments: validAppointments,
      cancelledAppointments: cancelledAppointments,
      treeholeRecords: treeholeRecords,
      aiRecords: aiRecords,
      stats: {
        testCount: testRecords.length,
        appointmentCount: validAppointments.length,
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
    const userRole = app.getUserRole();
    if (userRole === 'counselor') {
      // 咨询师跳转到预约管理页面
      wx.navigateTo({
        url: '/pages/counselor/manage'
      });
    } else {
      // 普通用户跳转到预约页面
      wx.navigateTo({
        url: '/pages/appointment/appointment'
      });
    }
  },

  // 咨询师发表文章
  goToPublish: function() {
    wx.navigateTo({
      url: '/pages/counselor/publish'
    });
  },

  // 查看文章列表
  goToArticleList: function() {
    wx.navigateTo({
      url: '/pages/article/list'
    });
  }
});
