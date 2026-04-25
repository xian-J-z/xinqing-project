// app.js
App({
  globalData: {
    userInfo: null,
    openid: '',
    env: 'cloud1-0g3scszw1d1248a3'
  },
  
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
    }
    
    // 检查登录状态
    this.checkLoginStatus();
  },
  
  // 检查登录状态
  checkLoginStatus: function() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
      this.globalData.openid = userInfo.openid;
    }
  },
  
  // 登录保存用户信息
  saveUserInfo: function(userInfo, openid, role, isAccountLogin) {
    userInfo.openid = openid;
    userInfo.role = role || 'user';
    userInfo.isAccountLogin = isAccountLogin || false;  // 标记是否为账号密码登录
    this.globalData.userInfo = userInfo;
    this.globalData.openid = openid;
    this.globalData.userRole = role || 'user';
    wx.setStorageSync('userInfo', userInfo);
  },
  
  // 更新用户信息（头像、昵称等）
  setUserInfo: function(userInfo) {
    const currentInfo = this.globalData.userInfo || {};
    const updatedInfo = { ...currentInfo, ...userInfo };
    this.globalData.userInfo = updatedInfo;
    wx.setStorageSync('userInfo', updatedInfo);
  },
  
  // 获取用户信息
  getUserInfo: function() {
    return this.globalData.userInfo;
  },
  
  // 获取openid
  getOpenid: function() {
    return this.globalData.openid;
  },
  
  // 获取用户角色
  getUserRole: function() {
    return this.globalData.userInfo && this.globalData.userInfo.role ? this.globalData.userInfo.role : 'user';
  },
  
  // 检查是否为咨询师
  isCounselor: function() {
    return this.getUserRole() === 'counselor';
  },
  
  // 退出登录
  logout: function() {
    this.globalData.userInfo = null;
    this.globalData.openid = '';
    this.globalData.userRole = '';
    wx.removeStorageSync('userInfo');
    wx.reLaunch({
      url: '/pages/login/login'
    });
  }
});
