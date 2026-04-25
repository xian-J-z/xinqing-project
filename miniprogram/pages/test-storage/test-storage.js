// pages/test-storage/test-storage.js
Page({
  data: {
    storageData: {}
  },

  onLoad: function() {
    this.loadStorageData();
  },

  loadStorageData: function() {
    const testRecords = wx.getStorageSync('testRecords') || [];
    const appointments = wx.getStorageSync('appointments') || [];
    const allAppointments = wx.getStorageSync('allAppointments') || [];
    const treeholeRecords = wx.getStorageSync('myPosts') || [];
    const aiRecords = wx.getStorageSync('aiRecords') || [];
    
    this.setData({
      storageData: {
        testRecords,
        appointments,
        allAppointments,
        treeholeRecords,
        aiRecords
      }
    });
    
    console.log('Storage data:', this.data.storageData);
  },

  // 添加测试数据
  addTestData: function() {
    // 添加测试记录
    const testRecord = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      testId: 'ses',
      testTitle: '自尊量表',
      totalScore: 40,
      fullScore: 40,
      maxPerQuestion: 4,
      avgScore: '4.00',
      level: '心理健康',
      description: '你的自尊水平很高，心理健康状态良好。',
      suggestion: '继续保持积极的自我认知和良好的心理状态。',
      date: new Date().toLocaleDateString()
    };
    
    let testRecords = wx.getStorageSync('testRecords') || [];
    testRecords.unshift(testRecord);
    wx.setStorageSync('testRecords', testRecords);
    
    // 添加预约记录
    const appointment = {
      _id: 'test-appointment-' + Date.now(),
      counselorName: '张老师',
      date: '2026-04-26',
      time: '14:00-15:00',
      reason: '情绪问题',
      status: '已确认'
    };
    
    let appointments = wx.getStorageSync('appointments') || [];
    appointments.unshift(appointment);
    wx.setStorageSync('appointments', appointments);
    wx.setStorageSync('allAppointments', appointments);
    
    // 添加树洞记录
    const treeholePost = {
      id: 'test-treehole-' + Date.now(),
      content: '今天心情很好！',
      time: new Date().toLocaleString(),
      likes: 0,
      comments: 0
    };
    
    let treeholeRecords = wx.getStorageSync('myPosts') || [];
    treeholeRecords.unshift(treeholePost);
    wx.setStorageSync('myPosts', treeholeRecords);
    
    // 添加AI分析记录
    const aiRecord = {
      keywords: ['开心', '积极'],
      emotion: '良好',
      score: 1,
      suggestions: ['继续保持积极心态'],
      input: '我今天很开心',
      date: new Date().toLocaleDateString()
    };
    
    let aiRecords = wx.getStorageSync('aiRecords') || [];
    aiRecords.unshift(aiRecord);
    wx.setStorageSync('aiRecords', aiRecords);
    
    wx.showToast({ title: '测试数据添加成功', icon: 'success' });
    this.loadStorageData();
  },

  // 清空所有数据
  clearAllData: function() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有本地存储数据吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('testRecords');
          wx.removeStorageSync('appointments');
          wx.removeStorageSync('allAppointments');
          wx.removeStorageSync('myPosts');
          wx.removeStorageSync('aiRecords');
          wx.showToast({ title: '数据已清空', icon: 'success' });
          this.loadStorageData();
        }
      }
    });
  }
});
