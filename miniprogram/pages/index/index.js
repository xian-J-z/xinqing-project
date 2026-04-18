// pages/index/index.js
const app = getApp();

Page({
  data: {
    userInfo: null,
    userRole: 'user',
    articles: [],
    banners: [
      { id: 1, emoji: '📚', title: '如何应对考试焦虑' },
      { id: 2, emoji: '🤝', title: '人际关系处理技巧' }
    ],
    currentBanner: 0,
    loading: true
  },

  onLoad: function() {
    this.setData({ 
      userInfo: app.getUserInfo(),
      userRole: app.getUserRole()
    });
    this.loadArticles();
  },

  onShow: function() {
    this.setData({ 
      userInfo: app.getUserInfo(),
      userRole: app.getUserRole()
    });
  },

  // 加载文章列表
  loadArticles: function() {
    wx.showLoading({ title: '加载中...' });
    
    // 模拟数据，实际应从数据库获取
    const articles = [
      {
        id: '1',
        title: '大学生常见心理问题及应对策略',
        summary: '大学生活中常见的心理问题有哪些？如何正确应对这些挑战，保持心理健康...',
        emoji: '💪',
        author: '心理健康中心',
        date: '2026-04-15',
        views: 1234,
        tags: ['心理健康', '大学生活']
      },
      {
        id: '2',
        title: '如何克服社交恐惧',
        summary: '社交恐惧是许多大学生面临的问题。本文将介绍几种有效的自我调节方法...',
        emoji: '😊',
        author: '李明心理咨询师',
        date: '2026-04-12',
        views: 892,
        tags: ['社交', '焦虑']
      },
      {
        id: '3',
        title: '考试焦虑的心理调适',
        summary: '临近考试，你是否感到紧张不安？试试这些科学的方法来缓解考试焦虑...',
        emoji: '📖',
        author: '王芳教授',
        date: '2026-04-10',
        views: 1567,
        tags: ['考试', '焦虑']
      },
      {
        id: '4',
        title: '睡眠质量与心理健康的关系',
        summary: '良好的睡眠是心理健康的基石。了解如何改善睡眠质量，提升整体状态...',
        emoji: '😴',
        author: '心理健康中心',
        date: '2026-04-08',
        views: 756,
        tags: ['睡眠', '健康']
      }
    ];
    
    this.setData({ 
      articles: articles,
      loading: false
    });
    wx.hideLoading();
  },

  // 轮播图切换
  onBannerChange: function(e) {
    this.setData({
      currentBanner: e.detail.current
    });
  },

  // 跳转到文章详情
  goToArticle: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/article/detail?id=' + id
    });
  },

  // 跳转到测评页面
  goToTest: function() {
    wx.navigateTo({
      url: '/pages/test/test'
    });
  },

  // 跳转到树洞页面
  goToTreehole: function() {
    wx.navigateTo({
      url: '/pages/treehole/treehole'
    });
  },

  // 跳转到预约页面
  goToAppointment: function() {
    wx.navigateTo({
      url: '/pages/appointment/appointment'
    });
  },

  // 跳转到AI分析页面
  goToAI: function() {
    wx.navigateTo({
      url: '/pages/ai/ai'
    });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.loadArticles();
    wx.stopPullDownRefresh();
  }
});
