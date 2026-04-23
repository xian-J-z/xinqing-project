// pages/article/detail.js
const app = getApp()

Page({
  data: {
    article: null,
    loading: true
  },

  onLoad(options) {
    if (options.id) {
      this.loadArticle(options.id)
    }
  },

  async loadArticle(id) {
    wx.showLoading({ title: '加载中...' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'adminArticle',
        data: { action: 'detail', articleId: id }
      })
      if (res.result) {
        const article = res.result
        article.createTimeStr = this.formatTime(article.createTime)
        article.updateTimeStr = article.updateTime ? this.formatTime(article.updateTime) : ''
        this.setData({ article, loading: false })
        // 阅读量 +1
        this.incrementView(id)
      }
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  async incrementView(id) {
    try {
      await wx.cloud.callFunction({
        name: 'adminArticle',
        data: { action: 'incrementView', articleId: id }
      })
      // 本地也 +1 避免延迟
      this.setData({
        'article.viewCount': (this.data.article.viewCount || 0) + 1
      })
    } catch (e) {
      console.error('阅读量更新失败', e)
    }
  },

  formatTime(time) {
    if (!time) return ''
    const d = new Date(time)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
})