// Prepopulate local storage with sample data
console.log('Prepopulating local storage with sample data...');

// Simulate wx.getStorageSync and wx.setStorageSync
const storage = {};
const wx = {
  getStorageSync: function(key) {
    return storage[key] || [];
  },
  setStorageSync: function(key, value) {
    storage[key] = value;
    console.log(`Stored ${key}:`, value);
  }
};

// Sample test records
const testRecords = [
  {
    id: '1777086730388xrngbtjiz',
    testId: 'ses',
    testTitle: '自尊量表',
    totalScore: 40,
    fullScore: 40,
    maxPerQuestion: 4,
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
    maxPerQuestion: 4,
    avgScore: '1.00',
    level: '心理健康',
    description: '你的焦虑水平很低，心理健康状态良好。',
    suggestion: '继续保持积极的生活态度。',
    date: '2026/4/24'
  }
];

// Sample appointments
const appointments = [
  {
    _id: 'test-appointment-1',
    counselorName: '张老师',
    date: '2024-04-26',
    time: '14:00-15:00',
    reason: '情绪问题',
    status: '已确认'
  },
  {
    _id: 'test-appointment-2',
    counselorName: '李老师',
    date: '2024-04-27',
    time: '10:00-11:00',
    reason: '学业压力',
    status: '待确认'
  }
];

// Sample treehole posts
const treeholeRecords = [
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
];

// Sample AI records
const aiRecords = [
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
];

// Save to storage
wx.setStorageSync('testRecords', testRecords);
wx.setStorageSync('appointments', appointments);
wx.setStorageSync('allAppointments', appointments);
wx.setStorageSync('myPosts', treeholeRecords);
wx.setStorageSync('aiRecords', aiRecords);

console.log('Local storage prepopulated successfully!');
console.log('Storage contents:', storage);
