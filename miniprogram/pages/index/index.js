// pages/index/index.js
const app = getApp();

Page({
  data: {
    userInfo: null,
    userRole: 'user',
    topArticles: [],
    articles: [],
    currentBanner: 0,
    loading: true,
    currentDate: ''
  },

  onLoad: function() {
    const now = new Date();
    const dateStr = `${now.getMonth() + 1}月${now.getDate()}日`;
    this.setData({
      userInfo: app.getUserInfo(),
      userRole: app.getUserRole(),
      currentDate: dateStr
    });
    this.loadArticles();
  },

  onShow: function() {
    this.setData({
      userInfo: app.getUserInfo(),
      userRole: app.getUserRole()
    });
    this.loadArticles();
  },

  // 从云数据库加载文章
  async loadArticles() {
    try {
      // 并行获取置顶文章和最新文章
      const [topRes, latestRes] = await Promise.all([
        wx.cloud.callFunction({
          name: 'adminArticle',
          data: { action: 'getTopArticles' }
        }),
        wx.cloud.callFunction({
          name: 'adminArticle',
          data: { action: 'getLatestArticles', limit: 5 }
        })
      ]);

      const topArticles = (Array.isArray(topRes.result) ? topRes.result : []).map(a => ({
        ...a,
        displayTime: this.formatTime(a.updateTime || a.createTime)
      }));

      const articles = (Array.isArray(latestRes.result) ? latestRes.result : []).map(a => ({
        ...a,
        displayTime: this.formatTime(a.updateTime || a.createTime)
      }));

      this.setData({
        topArticles,
        articles,
        loading: false
      });
    } catch (e) {
      console.error('加载文章失败', e);
      this.setData({ loading: false });
    }
  },

  // 轮播图切换
  onBannerChange: function(e) {
    this.setData({ currentBanner: e.detail.current });
  },

  // 跳转到文章详情
  goToArticle: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/article/detail?id=' + id });
  },

  // 跳转到文章列表
  goToArticleList: function() {
    wx.navigateTo({ url: '/pages/article/list' });
  },

  // 跳转到测评页面
  goToTest: function() {
    wx.navigateTo({ url: '/pages/test/test' });
  },

  // 跳转到树洞页面
  goToTreehole: function() {
    wx.navigateTo({ url: '/pages/treehole/treehole' });
  },

  // 跳转到预约页面
  goToAppointment: function() {
    const userRole = app.getUserRole();
    if (userRole === 'counselor') {
      // 咨询师跳转到预约管理页面
      wx.navigateTo({ url: '/pages/counselor/manage' });
    } else {
      // 普通用户跳转到预约页面
      wx.navigateTo({ url: '/pages/appointment/appointment' });
    }
  },

  // 跳转到AI分析页面
  goToAI: function() {
    wx.navigateTo({ url: '/pages/ai/ai' });
  },

  // 咨询师发表文章
  goToPublish: function() {
    wx.navigateTo({ url: '/pages/counselor/publish' });
  },

  formatTime(time) {
    if (!time) return '';
    const d = new Date(time);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.loadArticles();
    wx.stopPullDownRefresh();
  }
});