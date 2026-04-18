// pages/admin/users.js
const app = getApp()

Page({
  data: {
    users: [],
    filterRole: '',
    roleMap: { user: '学生', counselor: '咨询师', admin: '管理员' }
  },

  onLoad() {
    if (app.getUserRole() !== 'admin') {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    this.loadUsers()
  },

  async loadUsers() {
    wx.showLoading({ title: '加载中...' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'adminManage',
        data: { action: 'getUsers', role: this.data.filterRole || undefined }
      })
      wx.hideLoading()
      if (Array.isArray(res.result)) {
        const users = res.result.map(u => ({
          ...u,
          roleText: this.data.roleMap[u.role] || u.role,
          createTimeStr: u.createTime ? this.formatTime(u.createTime) : '-'
        }))
        this.setData({ users })
      }
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  setFilter(e) {
    this.setData({ filterRole: e.currentTarget.dataset.role })
    this.loadUsers()
  },

  async toggleUser(e) {
    const { id, disabled } = e.currentTarget.dataset
    wx.showModal({
      title: '确认',
      content: disabled ? '确定启用该用户？' : '确定停用该用户？',
      success: async (res) => {
        if (res.confirm) {
          await wx.cloud.callFunction({
            name: 'adminManage',
            data: { action: 'toggleStatus', userId: id, disabled: disabled }
          })
          wx.showToast({ title: '操作成功', icon: 'success' })
          this.loadUsers()
        }
      }
    })
  },

  async deleteUser(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '警告',
      content: '确定删除该用户？此操作不可恢复！',
      success: async (res) => {
        if (res.confirm) {
          await wx.cloud.callFunction({
            name: 'adminManage',
            data: { action: 'deleteUser', userId: id }
          })
          wx.showToast({ title: '已删除', icon: 'success' })
          this.loadUsers()
        }
      }
    })
  },

  formatTime(time) {
    if (!time) return '-'
    const d = new Date(time)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
})
