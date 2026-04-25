// pages/test/list.js
const app = getApp()

Page({
  data: {
    records: [],
    loading: false
  },

  onLoad() {
    this.loadRecords()
  },

  onShow() {
    this.loadRecords()
  },

  loadRecords() {
    this.setData({ loading: true })
    let records = wx.getStorageSync('testRecords') || []
    
    // 如果存储为空，使用默认测试数据
    if (records.length === 0) {
      records = [
        {
          id: '1777086730388xrngbtjiz',
          testId: 'ses',
          testTitle: '自尊量表',
          totalScore: 40,
          fullScore: 40,
          avgScore: '4.00',
          level: '心理健康',
          description: '你的自尊水平很高，心理健康状态良好。',
          suggestion: '继续保持积极的自我认知和良好的心理状态。',
          date: '2026/4/25'
        },
        {
          id: '1777086730389abcdef',
          testId: 'sas',
          testTitle: '焦虑量表',
          totalScore: 20,
          fullScore: 80,
          avgScore: '1.00',
          level: '心理健康',
          description: '你的焦虑水平很低，心理健康状态良好。',
          suggestion: '继续保持积极的生活态度。',
          date: '2026/4/24'
        }
      ]
      wx.setStorageSync('testRecords', records)
    }
    
    // 添加评分标签
    records = records.map(r => ({
      ...r,
      scorePercent: Math.round((r.totalScore / r.fullScore) * 100),
      badgeClass: this.getBadgeClass(r.level)
    }))
    
    this.setData({ records, loading: false })
  },

  getBadgeClass(level) {
    if (level === '心理健康' || level === '良好') return 'badge-good'
    if (level === '轻度困扰' || level === '轻度焦虑') return 'badge-warn'
    return 'badge-bad'
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/test/test?recordId=' + id
    })
  },

  // 删除记录
  deleteRecord(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条测评记录吗？',
      success: (res) => {
        if (res.confirm) {
          let records = wx.getStorageSync('testRecords') || []
          records = records.filter(r => r.id !== id)
          wx.setStorageSync('testRecords', records)
          this.setData({ records })
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  }
})
