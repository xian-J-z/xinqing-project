// pages/admin/index.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    stats: {
      totalUsers: 0,
      counselors: 0,
      articles: 0
    },
    showAddModal: false,
    newAccount: '',
    newPwd: '',
    newNick: ''
  },

  onLoad() {
    this.setData({ userInfo: app.getUserInfo() })
    this.loadStats()
  },

  onShow() {
    // 检查是否是管理员
    if (app.getUserRole() !== 'admin') {
      wx.showToast({ title: '无权限访问', icon: 'none' })
      wx.redirectTo({ url: '/pages/login/login' })
    }
    this.loadStats()
  },

  async loadStats() {
    try {
      const res = await wx.cloud.callFunction({ name: 'adminManage', data: { action: 'getStats' } })
      if (res.result.totalUsers !== undefined) {
        this.setData({ stats: res.result })
      }
    } catch (e) {
      console.error(e)
    }
  },

  goToUsers() {
    wx.navigateTo({ url: '/pages/admin/users' })
  },

  goToCounselors() {
    wx.navigateTo({ url: '/pages/admin/counselors' })
  },

  goToArticles() {
    wx.navigateTo({ url: '/pages/admin/articles' })
  },

  goToPublish() {
    wx.navigateTo({ url: '/pages/admin/publish' })
  },

  showAddCounselor() {
    this.setData({ showAddModal: true, newAccount: '', newPwd: '', newNick: '' })
  },

  hideAddModal() {
    this.setData({ showAddModal: false })
  },

  stopProp() {},

  onAccountInput(e) { this.setData({ newAccount: e.detail.value }) },
  onPwdInput(e) { this.setData({ newPwd: e.detail.value }) },
  onNickInput(e) { this.setData({ newNick: e.detail.value }) },

  async handleAddCounselor() {
    const { newAccount, newPwd, newNick } = this.data
    if (!newAccount || !newPwd) {
      wx.showToast({ title: '请填写完整', icon: 'none' })
      return
    }
    if (newPwd.length < 6) {
      wx.showToast({ title: '密码至少6位', icon: 'none' })
      return
    }

    wx.showLoading({ title: '添加中...' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'accountRegister',
        data: {
          username: newAccount,
          password: newPwd,
          role: 'counselor',
          userInfo: { nickName: newNick }
        }
      })
      wx.hideLoading()
      if (res.result.success) {
        wx.showToast({ title: '添加成功', icon: 'success' })
        this.hideAddModal()
        this.loadStats()
      } else {
        wx.showToast({ title: res.result.message, icon: 'none' })
      }
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '添加失败', icon: 'none' })
    }
  },

  logout() {
    wx.showModal({
      title: '提示',
      content: '确定退出管理员账号？',
      success: (res) => {
        if (res.confirm) {
          app.logout()
        }
      }
    })
  }
})
