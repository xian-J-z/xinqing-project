// pages/mine/mine.js
const app = getApp();

Page({
  data: {
    userInfo: {
      avatar: '',
      nickname: '未登录',
      school: '未设置'
    },
    userRole: 'user', // 默认角色
    stats: {
      testCount: 0,
      appointmentCount: 0,
      treeholeCount: 0,
      aiCount: 0
    },
    replyCount: 0,  // 咨询师回复数
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
    let testRecords = wx.getStorageSync('testRecords') || [];
    let appointments = wx.getStorageSync('appointments') || [];
    let allAppointments = wx.getStorageSync('allAppointments') || [];
    let treeholeRecords = wx.getStorageSync('myPosts') || [];
    let aiRecords = wx.getStorageSync('aiRecords') || [];
    
    // 添加测试数据（如果存储为空）
    if (testRecords.length === 0) {
      testRecords = [
        {
          id: '1777086730388xrngbtjiz',
          testId: 'ses',
          testTitle: '自尊量表',
          totalScore: 40,
          fullScore: 40,
          maxPerQuestion: 4,
          avgScore: '4.00',
          level: '心理健康',
          description: '你的自尊水平很高，心理健康状态良好。',
          suggestion: '继续保持积极的自我认知和良好的心理状态。',
          date: '2026/4/25'
        },
        {
          id: '1777086730389abcdef',
          testId: 'sas',
          testTitle: '焦虑量表',
          totalScore: 20,
          fullScore: 80,
          maxPerQuestion: 4,
          avgScore: '1.00',
          level: '心理健康',
          description: '你的焦虑水平很低，心理健康状态良好。',
          suggestion: '继续保持积极的生活态度。',
          date: '2026/4/24'
        }
      ];
      wx.setStorageSync('testRecords', testRecords);
    }
    
    if (appointments.length === 0) {
      appointments = [
        {
          _id: 'test-appointment-1',
          counselorName: '张老师',
          date: '2026-04-26',
          time: '14:00-15:00',
          reason: '情绪问题',
          status: '已确认'
        },
        {
          _id: 'test-appointment-2',
          counselorName: '李老师',
          date: '2026-04-27',
          time: '10:00-11:00',
          reason: '学业压力',
          status: '待确认'
        }
      ];
      wx.setStorageSync('appointments', appointments);
      wx.setStorageSync('allAppointments', appointments);
    }
    
    if (treeholeRecords.length === 0) {
      treeholeRecords = [
        {
          id: 'test-treehole-1',
          content: '今天心情很好！',
          time: '2026/4/25 11:12:10',
          likes: 5,
          comments: 2
        },
        {
          id: 'test-treehole-2',
          content: '最近学习压力有点大，不知道该怎么办。',
          time: '2026/4/24 15:30:45',
          likes: 12,
          comments: 8
        }
      ];
      wx.setStorageSync('myPosts', treeholeRecords);
    }
    
    if (aiRecords.length === 0) {
      aiRecords = [
        {
          keywords: ['开心', '积极'],
          emotion: '良好',
          score: 1,
          suggestions: ['继续保持积极心态'],
          input: '我今天很开心',
          date: '2026/4/25'
        },
        {
          keywords: ['压力', '焦虑'],
          emotion: '轻度困扰',
          score: 3,
          suggestions: ['尝试深呼吸放松', '合理安排时间'],
          input: '最近压力很大，感觉很焦虑',
          date: '2026/4/23'
        }
      ];
      wx.setStorageSync('aiRecords', aiRecords);
    }
    
    console.log('Loaded records count:', {
      testRecords: testRecords.length,
      appointments: appointments.length,
      treeholeRecords: treeholeRecords.length,
      aiRecords: aiRecords.length
    });
    
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
    const index = parseInt(e.currentTarget.dataset.index);
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
