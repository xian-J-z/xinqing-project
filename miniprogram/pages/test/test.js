// pages/test/test.js
const app = getApp();

Page({
  data: {
    // 测试类型列表
    testList: [
      {
        id: 'scl90',
        title: 'SCL-90症状自评量表',
        desc: '评估你的心理健康状态',
        icon: '🧠',
        color: '#667eea',
        questions: 90,
        time: '15-20分钟'
      },
      {
        id: '焦虑量表',
        title: '焦虑自评量表(SAS)',
        desc: '了解你的焦虑水平',
        icon: '😰',
        color: '#f5576c',
        questions: 20,
        time: '5-10分钟'
      },
      {
        id: '抑郁量表',
        title: '抑郁自评量表(SDS)',
        desc: '评估你的情绪状态',
        icon: '😔',
        color: '#4facfe',
        questions: 20,
        time: '5-10分钟'
      },
      {
        id: '自尊量表',
        title: '自尊量表(SES)',
        desc: '测量你的自我价值感',
        icon: '💪',
        color: '#43e97b',
        questions: 10,
        time: '3-5分钟'
      }
    ],
    
    // 当前测试状态
    currentTest: null,
    currentQuestion: 0,
    answers: [],
    testStarted: false,
    testFinished: false,
    result: null,
    
    // 测评记录
    testRecords: []
  },

  onLoad: function() {
    this.loadTestRecords();
  },

  // 加载测评记录
  loadTestRecords: function() {
    const records = wx.getStorageSync('testRecords') || [];
    this.setData({ testRecords: records });
  },

  // 开始测试
  startTest: function(e) {
    const testId = e.currentTarget.dataset.id;
    const test = this.data.testList.find(t => t.id === testId);
    
    this.setData({
      currentTest: test,
      testStarted: true,
      testFinished: false,
      currentQuestion: 0,
      answers: []
    });
    
    wx.pageScrollTo({ scrollTop: 0 });
  },

  // 选择答案
  selectAnswer: function(e) {
    const score = parseInt(e.currentTarget.dataset.score);
    const answers = this.data.answers;
    answers[this.data.currentQuestion] = score;
    
    this.setData({ answers: answers });
  },

  // 下一题
  nextQuestion: function() {
    const { currentQuestion, answers, currentTest } = this.data;
    
    if (answers[currentQuestion] === undefined) {
      wx.showToast({
        title: '请选择答案',
        icon: 'none'
      });
      return;
    }
    
    if (currentQuestion < currentTest.questions - 1) {
      this.setData({ currentQuestion: currentQuestion + 1 });
    } else {
      this.calculateResult();
    }
  },

  // 上一题
  prevQuestion: function() {
    if (this.data.currentQuestion > 0) {
      this.setData({ currentQuestion: this.data.currentQuestion - 1 });
    }
  },

  // 计算结果
  calculateResult: function() {
    const { answers, currentTest } = this.data;
    const totalScore = answers.reduce((sum, score) => sum + score, 0);
    const avgScore = totalScore / answers.length;
    
    let level = '';
    let description = '';
    let suggestion = '';
    
    if (currentTest.id === 'scl90') {
      if (avgScore < 2) {
        level = '心理健康';
        description = '您的心理状态良好，没有明显的心理困扰。';
        suggestion = '继续保持良好的生活习惯和积极的心态。';
      } else if (avgScore < 3) {
        level = '轻度心理问题';
        description = '您可能存在一些轻度的心理困扰，建议关注。';
        suggestion = '建议多与朋友交流，适当运动，如有需要可寻求专业帮助。';
      } else {
        level = '中度心理问题';
        description = '您可能存在一定的心理困扰，建议寻求专业帮助。';
        suggestion = '建议预约心理咨询师进行面对面咨询。';
      }
    } else {
      // 其他量表
      if (avgScore < 2) {
        level = '正常范围';
        description = '您的状态良好。';
        suggestion = '继续保持。';
      } else if (avgScore < 3) {
        level = '轻度异常';
        description = '需要注意调节情绪。';
        suggestion = '建议多参加户外活动，保持良好作息。';
      } else {
        level = '需要关注';
        description = '建议寻求专业帮助。';
        suggestion = '请预约专业心理咨询师。';
      }
    }
    
    const result = {
      testId: currentTest.id,
      testTitle: currentTest.title,
      totalScore,
      avgScore: avgScore.toFixed(2),
      level,
      description,
      suggestion,
      date: new Date().toLocaleDateString()
    };
    
    this.setData({
      testFinished: true,
      result: result
    });
    
    // 保存测评记录
    this.saveTestRecord(result);
  },

  // 保存测评记录
  saveTestRecord: function(result) {
    const records = wx.getStorageSync('testRecords') || [];
    records.unshift(result);
    if (records.length > 20) records.pop(); // 最多保存20条
    wx.setStorageSync('testRecords', records);
  },

  // 返回首页
  goBack: function() {
    this.setData({
      testStarted: false,
      testFinished: false,
      currentTest: null
    });
  },

  // 分享结果
  shareResult: function() {
    wx.showShareMenu({
      withShareTicket: true
    });
  }
});
