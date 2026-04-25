// pages/test/test.js
const app = getApp();

Page({
  data: {
    // 测试类型列表
    testList: [
      {
        id: '0f1f0c2969e82d030012b4f65f657c8c',
        title: '90项症状清单SCL-90',
        desc: '评估你的心理健康状态',
        icon: '🧠',
        color: '#667eea',
        questions: 90,
        time: '15-20分钟'
      },
      {
        id: 'e5d2fd0069e82ccf0014fb1a00905e0a',
        title: '焦虑自评量表SAS',
        desc: '了解你的焦虑水平',
        icon: '😰',
        color: '#f5576c',
        questions: 20,
        time: '5-10分钟'
      },
      {
        id: 'd8cc2fca69e82cee00128e590b1ae93f',
        title: '抑郁自评量表SDS',
        desc: '评估你的情绪状态',
        icon: '😔',
        color: '#4facfe',
        questions: 20,
        time: '5-10分钟'
      },
      {
        id: 'e20fd67f69e82d130013e91c25f42d6c',
        title: '自尊量表SES',
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
    questions: [],
    
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
    
    wx.showLoading({ title: '加载测试题目...' });
    
    wx.cloud.callFunction({
      name: 'test',
      data: {
        type: 'getTestQuestions',
        testId: testId
      }
    }).then(res => {
      wx.hideLoading();
      if (res && res.result && res.result.success) {
        this.setData({
          currentTest: test,
          testStarted: true,
          testFinished: false,
          currentQuestion: 0,
          answers: [],
          questions: res.result.data
        });
        wx.pageScrollTo({ scrollTop: 0 });
      } else {
        wx.showToast({ title: '获取题目失败', icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('获取测试题目失败:', err);
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    });
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
    const { currentQuestion, answers, questions } = this.data;
    
    if (answers[currentQuestion] === undefined) {
      wx.showToast({
        title: '请选择答案',
        icon: 'none'
      });
      return;
    }
    
    if (currentQuestion < questions.length - 1) {
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
    const { answers, currentTest, questions } = this.data;
    const totalScore = answers.reduce((sum, score) => sum + score, 0);
    const avgScore = totalScore / answers.length;
    
    // 计算满分和每道题的最高分
    let maxPerQuestion = 0;
    const fullScore = questions.reduce((sum, question) => {
      const maxOption = Math.max(...question.options.map(opt => opt.score));
      if (maxOption > maxPerQuestion) {
        maxPerQuestion = maxOption;
      }
      return sum + maxOption;
    }, 0);
    
    let level = '';
    let description = '';
    let suggestion = '';
    
    // SCL-90量表
    if (currentTest.id === '0f1f0c2969e82d030012b4f65f657c8c') {
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
    // 自尊量表 (SES) - 高分表示健康
    } else if (currentTest.id === 'e20fd67f69e82d130013e91c25f42d6c') {
      if (avgScore >= 3.5) {
        level = '自尊水平高';
        description = '您的自我价值感强，自尊水平良好。';
        suggestion = '继续保持积极的自我认知和良好的生活态度。';
      } else if (avgScore >= 2.5) {
        level = '自尊水平中等';
        description = '您的自尊水平处于正常范围。';
        suggestion = '可以通过自我肯定和成就感来进一步提升自尊。';
      } else {
        level = '自尊水平较低';
        description = '您可能存在自我价值感不足的情况。';
        suggestion = '建议关注自我接纳，培养积极的自我认知，必要时寻求专业帮助。';
      }
    } else {
      // 其他量表 (SAS, SDS) - 低分表示健康
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
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      testId: currentTest.id,
      testTitle: currentTest.title,
      totalScore,
      fullScore,
      maxPerQuestion,
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
    console.log('Saving test record:', result);
    const records = wx.getStorageSync('testRecords') || [];
    records.unshift(result);
    if (records.length > 20) records.pop(); // 最多保存20条
    wx.setStorageSync('testRecords', records);
    console.log('Saved records:', records);
  },

  // 返回首页
  goBack: function() {
    this.setData({
      testStarted: false,
      testFinished: false,
      currentTest: null,
      questions: []
    });
  },

  // 分享结果
  shareResult: function() {
    wx.showShareMenu({
      withShareTicket: true
    });
  }
});
