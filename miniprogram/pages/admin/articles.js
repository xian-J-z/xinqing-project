// pages/admin/articles.js
const app = getApp()

Page({
  data: {
    articles: []
  },

  onLoad() {
    if (app.getUserRole() !== 'admin') {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    this.loadArticles()
  },

  onShow() {
    this.loadArticles()
  },

  async loadArticles() {
    wx.showLoading({ title: '加载中...' })
    try {
      const res = await wx.cloud.callFunction({ name: 'adminArticle', data: { action: 'getArticles' } })
      wx.hideLoading()
      if (Array.isArray(res.result)) {
        const articles = res.result.map(a => ({
          ...a,
          createTimeStr: a.createTime ? this.formatTime(a.createTime) : '-'
        }))
        this.setData({ articles })
      }
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  goToPublish() {
    wx.navigateTo({ url: '/pages/admin/publish' })
  },

  editArticle(e) {
    wx.navigateTo({ url: `/pages/admin/publish?articleId=${e.currentTarget.dataset.id}` })
  },

  async deleteArticle(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '警告',
      content: '确定删除该文章？',
      success: async (res) => {
        if (res.confirm) {
          await wx.cloud.callFunction({
            name: 'adminArticle',
            data: { action: 'delete', articleId: id }
          })
          wx.showToast({ title: '已删除', icon: 'success' })
          this.loadArticles()
        }
      }
    })
  },

  async toggleTop(e) {
    const { id, istop } = e.currentTarget.dataset
    const isCurrentlyTop = istop === '1'
    const newTopState = !isCurrentlyTop

    wx.showLoading({ title: '操作中...' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'adminArticle',
        data: { action: 'toggleTop', articleId: id, isTop: newTopState }
      })
      wx.hideLoading()
      if (res.result && res.result.success) {
        wx.showToast({ title: newTopState ? '已置顶' : '已取消置顶', icon: 'success' })
        this.loadArticles()
      } else {
        wx.showToast({ title: '操作失败', icon: 'none' })
      }
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  formatTime(time) {
    if (!time) return '-'
    const d = new Date(time)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
})