const app = getApp()

Page({
  data: {
    userInput: '',
    canSend: false,
    conversation: [],
    analyzing: false,
    hasAnalysis: false,
    showAnalysis: false,
    analysisResult: null,
    analysisHistory: [],
    scrollTop: 0
  },

  onLoad() {
    this.initWelcome()
  },

  initWelcome() {
    const msg = {
      role: 'assistant',
      content: '你好呀～我是你的专属心理陪伴者，我会一直在这里倾听你、支持你 💛\n\n想说什么都可以，我陪着你。',
      time: this.time()
    }
    this.setData({
      conversation: [msg],
      hasAnalysis: false,
      showAnalysis: false,
      analysisResult: null,
      analysisHistory: []
    })
  },

  onInput(e) {
    const value = e.detail.value || ''
    this.setData({
      userInput: value,
      canSend: value.trim().length > 0
    })
  },

  scrollToBottom() {
    setTimeout(() => {
      this.setData({
        scrollTop: 99999
      })
    }, 150)
  },

  sendMessage() {
    const { userInput, conversation, analysisHistory } = this.data
    if (!userInput.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' })
      return
    }

    const userMsg = {
      role: 'user',
      content: userInput,
      time: this.time()
    }

    this.setData({
      conversation: [...conversation, userMsg],
      userInput: '',
      canSend: false,
      analyzing: true,
      analysisHistory: [...analysisHistory, userInput]
    })

    this.scrollToBottom()

    wx.cloud.callFunction({
      name: 'callDoubao',
      data: {
        message: userInput,
        history: conversation
      }
    }).then(res => {
      const result = res.result
      const aiMsg = {
        role: 'assistant',
        content: result.reply,
        time: this.time()
      }
      this.setData({
        conversation: [...this.data.conversation, aiMsg],
        analyzing: false,
        hasAnalysis: true
      })
      this.scrollToBottom()
    }).catch(err => {
      console.error(err)
      this.setData({ analyzing: false })
      wx.showToast({ title: '请求失败', icon: 'error' })
    })
  },

  showFinalAnalysis() {
    const { analysisHistory } = this.data
    if (analysisHistory.length === 0) {
      wx.showToast({ title: '请先描述你的情况', icon: 'none' })
      return
    }

    wx.showLoading({ title: '生成分析报告...' })

    wx.cloud.callFunction({
      name: 'callDoubao',
      data: {
        message: '请根据以下对话内容，给出一份综合的心理分析报告：\n' + analysisHistory.join('\n'),
        history: []
      }
    }).then(res => {
      wx.hideLoading()
      this.setData({
        analysisResult: {
          emotion: '需要关注',
          score: 5,
          keywords: ['情绪困扰'],
          suggestions: ['建议寻求专业帮助']
        },
        showAnalysis: true
      })
    }).catch(err => {
      wx.hideLoading()
      console.error(err)
      wx.showToast({ title: '分析失败', icon: 'error' })
    })
  },

  toggleAnalysis() {
    this.setData({
      showAnalysis: !this.data.showAnalysis
    })
  },

  preventBubble() {},

  getEmotionClass(emotion) {
    if (emotion === '良好') return 'good'
    if (emotion === '轻度困扰') return 'warn'
    if (emotion === '中度困扰') return 'bad'
    if (emotion === '需要关注' || emotion === '严重困扰') return 'severe'
    return ''
  },

  time() {
    const d = new Date()
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  },

  restart() {
    this.initWelcome()
  }
})