// pages/counselor/publish.js
const app = getApp()

Page({
  data: {
    title: '',
    cover: '',
    content: '',
    categories:[ ' 心理健康 ', ' 情绪管理 ', ' 人际关系 ', ' 学习方法 ', ' 情感倾诉 ',' 压力调节 ', ' 自我成长 ', ' 时间管理 ', ' 亲子沟通 ', ' 职场心理 ',' 恋爱心理 ', ' 焦虑缓解 ', ' 自卑自信 ', ' 性格分析 ', ' 睡眠改善 ',' 专注力提升 ', ' 考试心态 ', ' 社交恐惧 ', ' 家庭关系 ', ' 心理疗愈 '],
    categoryIndex: 0,
    articleId: null
  },

  onLoad(options) {
    if (app.getUserRole() !== 'counselor') {
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
        categoryIndex: this.data.categories.indexOf(article.category) >= 0 ? this.data.categories.indexOf(article.category) : 0
      })
    }
  },

  onTitleInput(e) { this.setData({ title: e.detail.value }) },
  onContentInput(e) { this.setData({ content: e.detail.value }) },
  onCategoryChange(e) { this.setData({ categoryIndex: e.detail.value }) },

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

    if (!title.trim()) {
      wx.showToast({ title: '请填写标题', icon: 'none' })
      return
    }
    if (!content.trim()) {
      wx.showToast({ title: '请填写内容', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...' })

    const articleData = {
      title: title.trim(),
      cover,
      content: content,
      category: categories[categoryIndex],
      authorName: (app.getUserInfo() || {}).nickName || '心理咨询师',
      authorOpenid: app.getOpenid() || ''
    }

    try {
      let res
      if (articleId) {
        res = await wx.cloud.callFunction({
          name: 'adminArticle',
          data: { action: 'update', articleId, data: articleData, role: 'counselor' }
        })
      } else {
        res = await wx.cloud.callFunction({
          name: 'adminArticle',
          data: { action: 'publish', article: articleData, role: 'counselor' }
        })
      }

      const result = res.result || {}
      if (result.success === false) {
        wx.hideLoading()
        wx.showToast({ title: result.message || '保存失败', icon: 'none' })
        return
      }

      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  }
})