// pages/admin/publish.js
const app = getApp()

Page({
  data: {
    title: '',
    cover: '',
    content: '',
    categories: ['心理健康', '情绪管理', '人际关系', '学习方法', '情感倾诉'],
    categoryIndex: 0,
    articleId: null
  },

  onLoad(options) {
    if (app.getUserRole() !== 'admin') {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    if (options.articleId) {
      this.setData({ articleId: options.articleId })
      wx.setNavigationBarTitle({ title: '编辑文章' })
      this.loadArticle(options.articleId)
    }
  },

  async loadArticle(id) {
    const res = await wx.cloud.callFunction({ name: 'adminArticle', data: { action: 'detail', articleId: id } })
    if (res.result) {
      const article = res.result
      this.setData({
        title: article.title || '',
        cover: article.cover || '',
        content: article.content || '',
        categoryIndex: this.data.categories.indexOf(article.category) || 0
      })
    }
  },

  onTitleInput(e) { this.setData({ title: e.detail.value }) },
  onContentInput(e) { this.setData({ content: e.detail.value }) },

  onCategoryChange(e) {
    this.setData({ categoryIndex: e.detail.value })
  },

  chooseCover() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        const filePath = res.tempFiles[0].tempFilePath
        wx.cloud.uploadFile({
          cloudPath: `covers/${Date.now()}.png`,
          filePath: filePath,
          success: (uploadRes) => {
            this.setData({ cover: uploadRes.fileID })
          }
        })
      }
    })
  },

  async handlePublish() {
    const { title, cover, content, categoryIndex, categories, articleId } = this.data
    
    if (!title || !content) {
      wx.showToast({ title: '请填写标题和内容', icon: 'none' })
      return
    }

    wx.showLoading({ title: '发布中...' })
    
    const articleData = {
      title,
      cover,
      content,
      category: categories[categoryIndex],
      authorName: app.getUserInfo().nickName || '管理员'
    }

    try {
      let res
      if (articleId) {
        res = await wx.cloud.callFunction({ name: 'adminArticle', data: { action: 'update', articleId, data: articleData } })
      } else {
        res = await wx.cloud.callFunction({ name: 'adminArticle', data: { action: 'publish', article: articleData } })
      }
      wx.hideLoading()
      wx.showToast({ title: '成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1000)
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '发布失败', icon: 'none' })
    }
  }
})
