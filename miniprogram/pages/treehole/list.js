// pages/treehole/list.js
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
    let records = wx.getStorageSync('myPosts') || []
    
    // 如果存储为空，使用默认数据
    if (records.length === 0) {
      records = [
        {
          id: 'test-treehole-1',
          content: '今天心情很好！',
          time: '2026/4/25 11:12:10',
          likes: 5,
          comments: 2
        },
        {
          id: 'test-treehole-2',
          content: '最近学习压力有点大，不知道该怎么办。',
          time: '2026/4/24 15:30:45',
          likes: 12,
          comments: 8
        }
      ]
      wx.setStorageSync('myPosts', records)
    }
    
    this.setData({ records, loading: false })
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/treehole/treehole?id=' + id
    })
  },

  // 删除帖子
  deleteRecord(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条树洞吗？',
      success: (res) => {
        if (res.confirm) {
          let records = wx.getStorageSync('myPosts') || []
          records = records.filter(r => r.id !== id)
          wx.setStorageSync('myPosts', records)
          this.setData({ records })
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  }
})
