// pages/article/list.js
const app = getApp()

Page({
  data: {
    articles: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
    total: 0
  },

  onLoad() {
    this.loadArticles()
  },

  async loadArticles() {
    if (this.data.loading) return
    this.setData({ loading: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'adminArticle',
        data: {
          action: 'getAllArticles',
          page: 1,
          pageSize: 50
        }
      })
      if (res.result) {
        const articles = (res.result.data || []).map(a => ({
          ...a,
          displayTime: this.formatTime(a.updateTime || a.createTime)
        }))
        this.setData({
          articles: articles,
          total: res.result.total || articles.length,
          hasMore: res.result.hasMore || false,
          loading: false
        })
      }
    } catch (e) {
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/article/detail?id=' + id })
  },

  formatTime(time) {
    if (!time) return ''
    const d = new Date(time)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
})