// pages/ai/list.js
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
    let records = wx.getStorageSync('aiRecords') || []
    
    // 如果存储为空，使用默认数据
    if (records.length === 0) {
      records = [
        {
          keywords: ['开心', '积极'],
          emotion: '良好',
          score: 1,
          suggestions: ['继续保持积极心态'],
          input: '我今天很开心',
          date: '2026/4/25'
        },
        {
          keywords: ['压力', '焦虑'],
          emotion: '轻度困扰',
          score: 3,
          suggestions: ['尝试深呼吸放松', '合理安排时间'],
          input: '最近压力很大，感觉很焦虑',
          date: '2026/4/23'
        }
      ]
      wx.setStorageSync('aiRecords', records)
    }
    
    // 添加表情和颜色
    records = records.map(r => ({
      ...r,
      emotionIcon: this.getEmotionIcon(r.score),
      emotionColor: this.getEmotionColor(r.score),
      badgeClass: this.getBadgeClass(r.score)
    }))
    
    this.setData({ records, loading: false })
  },

  getEmotionIcon(score) {
    if (score <= 1) return '😊'
    if (score <= 2) return '🙂'
    if (score <= 3) return '😐'
    if (score <= 4) return '😟'
    return '😢'
  },

  getEmotionColor(score) {
    if (score <= 1) return '#43e97b'
    if (score <= 2) return '#667eea'
    if (score <= 3) return '#ffb84d'
    return '#ff6b6b'
  },

  getBadgeClass(score) {
    if (score <= 1) return 'badge-good'
    if (score <= 2) return 'badge-normal'
    if (score <= 3) return 'badge-warn'
    return 'badge-bad'
  },

  goToAI() {
    wx.navigateTo({
      url: '/pages/ai/ai'
    })
  },

  // 删除记录
  deleteRecord(e) {
    const index = e.currentTarget.dataset.index
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条分析记录吗？',
      success: (res) => {
        if (res.confirm) {
          let records = wx.getStorageSync('aiRecords') || []
          records.splice(index, 1)
          wx.setStorageSync('aiRecords', records)
          this.setData({ records })
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  }
})
