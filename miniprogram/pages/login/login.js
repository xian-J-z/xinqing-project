const app = getApp();

Page({
  data: {
    hasUserInfo: false,
    selectedRole: 'user',  // 默认普通用户
    // 账号密码登录
    username: '',
    password: '',
    showAccountModal: false,
    showRegisterModal: false,
    regUsername: '',
    regPassword: '',
    regConfirm: ''
  },

  onLoad: function() {
    // 检查是否已登录
    const userInfo = app.getUserInfo();
    if (userInfo && userInfo.nickName) {
      this.setData({ hasUserInfo: true });
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  },

  // 选择角色
  selectRole: function(e) {
    const role = e.currentTarget.dataset.role;
    this.setData({ 
      selectedRole: role,
      username: '',
      password: ''
    });
  },

  // 微信授权登录（学生/咨询师）
  getUserProfile() {
    const selectedRole = this.data.selectedRole;
    
    // 管理员不能微信登录
    if (selectedRole === 'admin') {
      wx.showToast({
        title: '管理员请使用账号密码登录',
        icon: 'none'
      });
      return;
    }
    
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        this.handleLoginSuccess(res.userInfo, selectedRole);
      },
      fail: (err) => {
        wx.showToast({
          title: '请允许授权以继续使用',
          icon: 'none'
        });
      }
    });
  },

  // 获取手机号（可选）
  getPhoneNumber(e) {
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      console.log('获取手机号成功');
    }
  },

  // 处理登录成功
  handleLoginSuccess(userInfo, role) {
    wx.showLoading({ title: '登录中...' });
    
    // 调用云函数获取openid
    wx.cloud.callFunction({
      name: 'login',
      data: {}
    }).then(res => {
      const openid = res.result.openid;
      userInfo.role = role;  // 添加角色信息
      app.saveUserInfo(userInfo, openid, role);
      
      // 调用注册云函数，将用户信息写入数据库
      wx.cloud.callFunction({
        name: 'register',
        data: {
          userInfo: userInfo,
          role: role
        }
      }).then(regRes => {
        console.log('注册结果:', regRes);
      }).catch(regErr => {
        console.error('注册失败:', regErr);
      });
      
      wx.hideLoading();
      wx.showToast({
        title: role === 'counselor' ? '咨询师登录成功' : '登录成功',
        icon: 'success'
      });
      
      setTimeout(() => {
        if (role === 'admin') {
          wx.redirectTo({ url: '/pages/admin/index' });
        } else {
          wx.switchTab({ url: '/pages/index/index' });
        }
      }, 1000);
    }).catch(err => {
      wx.hideLoading();
      // 即使云函数失败，也允许登录
      userInfo.role = role;
      app.saveUserInfo(userInfo, 'demo_openid', role);
      wx.switchTab({
        url: '/pages/index/index'
      });
    });
  },

  // ====== 账号密码登录相关 ======

  // 显示账号登录弹窗
  showAccountLogin() {
    this.setData({
      showAccountModal: true,
      username: '',
      password: ''
    });
  },

  // 隐藏账号登录弹窗
  hideAccountLogin() {
    this.setData({
      showAccountModal: false,
      username: '',
      password: ''
    });
  },

  // 阻止事件冒泡
  stopPropagation() {},

  // 账号输入
  onUsernameInput(e) {
    this.setData({ username: e.detail.value });
  },

  // 密码输入
  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  // 账号密码登录
  handleAccountLogin() {
    const { username, password, selectedRole } = this.data;
    
    if (!username || !password) {
      wx.showToast({
        title: '请输入账号和密码',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '登录中...' });
    
    wx.cloud.callFunction({
      name: 'adminLogin',
      data: {
        username: username,
        password: password,
        role: selectedRole
      }
    }).then(res => {
      wx.hideLoading();
      
      if (res.result.success) {
        // 登录成功，保存用户信息
        const userInfo = {
          nickName: res.result.userInfo.nickName || res.result.userInfo.username,
          avatarUrl: res.result.userInfo.avatarUrl || '',
          username: res.result.userInfo.username
        };
        app.saveUserInfo(userInfo, res.result.userId, res.result.role, true);
        
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
        
        this.hideAccountLogin();
        
        setTimeout(() => {
          if (res.result.role === 'admin') {
            wx.redirectTo({ url: '/pages/admin/index' });
          } else {
            wx.switchTab({ url: '/pages/index/index' });
          }
        }, 1000);
      } else {
        wx.showToast({
          title: res.result.message || '用户名或密码错误',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('登录失败:', err);
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      });
    });
  },

  // 跳转到注册页面
  goToRegister() {
    this.hideAccountLogin();
    this.setData({
      showRegisterModal: true,
      regUsername: '',
      regPassword: '',
      regConfirm: ''
    });
  },

  // 隐藏注册弹窗
  hideRegister() {
    this.setData({
      showRegisterModal: false,
      regUsername: '',
      regPassword: '',
      regConfirm: ''
    });
  },

  // 注册账号输入
  onRegUsernameInput(e) {
    this.setData({ regUsername: e.detail.value });
  },

  onRegPasswordInput(e) {
    this.setData({ regPassword: e.detail.value });
  },

  onRegConfirmInput(e) {
    this.setData({ regConfirm: e.detail.value });
  },

  // 处理注册
  handleRegister() {
    const { regUsername, regPassword, regConfirm, selectedRole } = this.data;
    
    if (!regUsername || !regPassword || !regConfirm) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    if (regPassword !== regConfirm) {
      wx.showToast({
        title: '两次密码输入不一致',
        icon: 'none'
      });
      return;
    }

    if (regPassword.length < 6) {
      wx.showToast({
        title: '密码长度至少6位',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '注册中...' });
    
    wx.cloud.callFunction({
      name: 'accountRegister',
      data: {
        username: regUsername,
        password: regPassword,
        role: selectedRole
      }
    }).then(res => {
      wx.hideLoading();
      
      if (res.result.success) {
        wx.showToast({
          title: '注册成功',
          icon: 'success'
        });
        
        this.hideRegister();
        
        // 自动填充账号
        setTimeout(() => {
          this.showAccountLogin();
          this.setData({
            username: regUsername
          });
        }, 1000);
      } else {
        wx.showToast({
          title: res.result.message,
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('注册失败:', err);
      wx.showToast({
        title: '注册失败，请重试',
        icon: 'none'
      });
    });
  }
});