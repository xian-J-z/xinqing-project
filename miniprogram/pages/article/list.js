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
        let articles = res.result.data || []
        
        // 批量转换封面图片 cloud:// 路径为 https:// 临时链接
        const coverUrls = articles.map(a => a.cover).filter(url => url && url.startsWith('cloud://'))
        if (coverUrls.length > 0) {
          const tempFileURLs = await Promise.all(
            coverUrls.map(url => wx.cloud.getTempFileURL({ fileID: url }))
          )
          const urlMap = {}
          coverUrls.forEach((url, index) => {
            urlMap[url] = tempFileURLs[index].tempFileURL || url
          })
          articles = articles.map(a => ({
            ...a,
            cover: urlMap[a.cover] || a.cover
          }))
        }
        
        articles = articles.map(a => ({
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
      console.error('加载文章失败', e)
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