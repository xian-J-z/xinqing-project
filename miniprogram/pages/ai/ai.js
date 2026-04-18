// pages/ai/ai.js
const app = getApp();

Page({
  data: {
    userRole: 'user',
    userInput: '',
    conversation: [],
    analyzing: false,
    showResult: false,
    analysisResult: null,
    inputFocus: false
  },

  onLoad: function() {
    this.setData({ userRole: app.getUserRole() });
    this.initConversation();
  },

  // 初始化对话
  initConversation: function() {
    const welcomeMessage = {
      role: 'assistant',
      content: '你好！我是AI心理分析助手🌟\n\n我可以帮助你：\n• 分析你的心理状态\n• 提供情绪调节建议\n• 解答心理健康问题\n\n请描述一下你最近的感受或困扰，我会尽力帮助你。',
      time: this.formatTime(new Date())
    };
    this.setData({ conversation: [welcomeMessage] });
  },

  // 输入内容
  onInput: function(e) {
    this.setData({ userInput: e.detail.value });
  },

  // 发送消息
  sendMessage: function() {
    const { userInput, conversation } = this.data;
    
    if (!userInput.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }

    const userMessage = {
      role: 'user',
      content: userInput,
      time: this.formatTime(new Date())
    };

    conversation.push(userMessage);
    this.setData({
      conversation: conversation,
      userInput: '',
      analyzing: true
    });

    // 模拟AI分析
    this.performAnalysis(userInput);
  },

  // 执行AI分析
  performAnalysis: async function(input) {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 简单的关键词分析
    const analysis = this.analyzeInput(input);
    
    const aiMessage = {
      role: 'assistant',
      content: analysis.response,
      time: this.formatTime(new Date())
    };

    const { conversation } = this.data;
    conversation.push(aiMessage);
    
    this.setData({
      conversation: conversation,
      analyzing: false,
      showResult: true,
      analysisResult: analysis.result
    });
    
    // 保存分析记录
    this.saveAnalysisRecord(analysis.result);
  },

  // 分析输入内容
  analyzeInput: function(input) {
    const text = input.toLowerCase();
    let emotion = '';
    let score = 0;
    let suggestions = [];
    let keywords = [];

    // 检测关键词
    if (text.includes('焦虑') || text.includes('紧张') || text.includes('担心')) {
      keywords.push('焦虑');
      score += 2;
      suggestions.push('深呼吸放松：慢慢吸气4秒，屏住呼吸4秒，缓慢呼气4秒');
      suggestions.push('尝试冥想或正念练习');
    }
    
    if (text.includes('抑郁') || text.includes('难过') || text.includes('伤心')) {
      keywords.push('抑郁');
      score += 3;
      suggestions.push('保持规律作息，充足的睡眠很重要');
      suggestions.push('适度运动可以改善情绪');
    }
    
    if (text.includes('失眠') || text.includes('睡不着') || text.includes('睡眠')) {
      keywords.push('睡眠问题');
      score += 2;
      suggestions.push('睡前避免使用手机');
      suggestions.push('尝试喝温牛奶或蜂蜜水');
    }
    
    if (text.includes('压力') || text.includes('压力大') || text.includes('累')) {
      keywords.push('压力');
      score += 2;
      suggestions.push('合理安排时间，学会劳逸结合');
      suggestions.push('与朋友倾诉，分享压力');
    }
    
    if (text.includes('人际关系') || text.includes('朋友') || text.includes('室友')) {
      keywords.push('人际关系');
      score += 1;
      suggestions.push('主动沟通是解决问题的关键');
      suggestions.push('学会换位思考');
    }
    
    if (text.includes('学习') || text.includes('考试') || text.includes('成绩')) {
      keywords.push('学业压力');
      score += 2;
      suggestions.push('制定合理的学习计划');
      suggestions.push('考前做好充分准备');
    }
    
    if (keywords.length === 0) {
      keywords.push('一般状态');
      score = 1;
      suggestions.push('继续保持积极乐观的心态');
      suggestions.push('多与身边的人交流');
    }

    // 根据得分判断情绪状态
    if (score <= 2) {
      emotion = '良好';
    } else if (score <= 4) {
      emotion = '轻度困扰';
    } else {
      emotion = '需要关注';
    }

    const response = `感谢你的分享💭\n\n根据你的描述，我注意到你可能正在经历一些${keywords.join('、')}相关的困扰。\n\n**初步分析：**\n你的心理状态显示为"${emotion}"。\n\n**建议措施：**\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n**温馨提示：**\n以上建议仅供参考。如果你感到困扰持续加重，建议寻求专业心理咨询师的帮助。\n\n还有什么想聊的吗？我随时在这里倾听你。`;

    return {
      response,
      result: {
        keywords,
        emotion,
        score,
        suggestions,
        input,
        date: new Date().toLocaleDateString()
      }
    };
  },

  // 保存分析记录
  saveAnalysisRecord: function(result) {
    const records = wx.getStorageSync('aiRecords') || [];
    records.unshift(result);
    if (records.length > 20) records.pop();
    wx.setStorageSync('aiRecords', records);
  },

  // 格式化时间
  formatTime: function(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  // 重新开始
  restart: function() {
    this.initConversation();
    this.setData({
      showResult: false,
      analysisResult: null
    });
  },

  // 跳转到专业咨询
  goToAppointment: function() {
    wx.navigateTo({
      url: '/pages/appointment/appointment'
    });
  },

  // 跳转到心理测评
  goToTest: function() {
    wx.navigateTo({
      url: '/pages/test/test'
    });
  }
});
