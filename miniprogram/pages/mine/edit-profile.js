// pages/mine/edit-profile.js
const app = getApp();

Page({
  data: {
    avatarUrl: '',
    nickName: '',
    bio: '', // 个性签名
    saving: false
  },

  onLoad: function() {
    this.checkLogin();
  },

  onShow: function() {
    this.loadUserInfo();
  },

  // 检查登录状态
  checkLogin: function() {
    const userInfo = app.getUserInfo();
    if (!userInfo) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再编辑资料',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
    }
  },

  // 加载用户信息
  loadUserInfo: function() {
    const userInfo = app.getUserInfo() || {};
    
    this.setData({
      avatarUrl: userInfo.avatarUrl || '',
      nickName: userInfo.nickName || '',
      bio: userInfo.bio || ''
    });
  },

  // 选择头像
  chooseAvatar: function() {
    wx.showActionSheet({
      itemList: ['从相册选择', '拍照'],
      success: (res) => {
        const sourceType = res.tapIndex === 0 ? ['album'] : ['camera'];
        this.uploadAvatar(sourceType);
      }
    });
  },

  // 上传头像
  uploadAvatar: function(sourceType) {
    const self = this;
    
    wx.chooseImage({
      count: 1,
      sourceType: sourceType,
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        
        // 先显示本地预览
        self.setData({ avatarUrl: tempFilePath });
        
        // 上传到云存储
        wx.showLoading({ title: '上传中...' });
        
        const cloudPath = `avatars/${app.getOpenid()}_${Date.now()}.png`;
        
        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: tempFilePath,
          success: (uploadRes) => {
            console.log('头像上传成功', uploadRes.fileID);
            
            // 获取临时链接
            wx.cloud.getTempFileURL({
              fileID: uploadRes.fileID,
              success: (urlRes) => {
                wx.hideLoading();
                self.setData({ avatarUrl: urlRes.tempFileURL });
                wx.showToast({ title: '头像上传成功', icon: 'success' });
              },
              fail: () => {
                wx.hideLoading();
                // 使用 fileID 作为临时替代
                self.setData({ avatarUrl: uploadRes.fileID });
              }
            });
          },
          fail: (err) => {
            wx.hideLoading();
            console.error('头像上传失败', err);
            wx.showToast({ title: '上传失败', icon: 'none' });
          }
        });
      }
    });
  },

  // 昵称输入
  onNickNameInput: function(e) {
    const value = e.detail.value;
    // 只允许中文、英文、数字
    const filtered = value.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
    this.setData({ nickName: filtered });
  },

  // 个性签名输入
  onBioInput: function(e) {
    const value = e.detail.value;
    this.setData({ bio: value });
  },

  // 保存修改
  handleSave: function() {
    const { avatarUrl, nickName, bio, saving } = this.data;
    
    if (saving) return;
    
    // 验证昵称
    if (!nickName || nickName.trim().length < 2) {
      wx.showToast({ title: '昵称至少2个字符', icon: 'none' });
      return;
    }
    
    if (nickName.trim().length > 20) {
      wx.showToast({ title: '昵称最多20个字符', icon: 'none' });
      return;
    }
    
    this.setData({ saving: true });
    
    // 更新本地存储
    const userInfo = app.getUserInfo() || {};
    userInfo.nickName = nickName.trim();
    userInfo.avatarUrl = avatarUrl;
    userInfo.bio = bio.trim();
    app.setUserInfo(userInfo);
    
    // 同步更新云端用户信息
    this.updateCloudUserInfo(nickName.trim(), avatarUrl, bio.trim());
  },

  // 更新云端用户信息
  updateCloudUserInfo: function(nickName, avatarUrl, bio) {
    const self = this;
    
    wx.cloud.callFunction({
      name: 'adminManage',
      data: {
        action: 'updateUserInfo',
        nickName: nickName,
        avatarUrl: avatarUrl || '',
        bio: bio || ''
      },
      success: (res) => {
        console.log('更新云端信息成功', res);
        wx.showToast({ title: '保存成功', icon: 'success' });
        
        // 更新全局用户信息
        const globalUserInfo = app.getUserInfo() || {};
        globalUserInfo.nickName = nickName;
        globalUserInfo.avatarUrl = avatarUrl;
        globalUserInfo.bio = bio;
        app.setUserInfo(globalUserInfo);
        
        // 通知其他页面刷新
        wx.eventCenter && wx.eventCenter.trigger('userInfoUpdated');
        
        setTimeout(() => {
          self.setData({ saving: false });
          wx.navigateBack();
        }, 1500);
      },
      fail: (err) => {
        console.error('更新云端信息失败', err);
        self.setData({ saving: false });
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    });
  }
});
