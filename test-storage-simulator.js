// Simple local storage test simulator
console.log('Testing local storage simulator...');

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

// Test 1: Save test record
const testRecord = {
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  testId: 'ses',
  testTitle: '自尊量表',
  totalScore: 40,
  fullScore: 40,
  maxPerQuestion: 4,
  avgScore: '4.00',
  level: '心理健康',
  description: '你的自尊水平很高，心理健康状态良好。',
  suggestion: '继续保持积极的自我认知和良好的心理状态。',
  date: new Date().toLocaleDateString()
};

console.log('Test record:', testRecord);

// Test 2: Save to storage
let records = wx.getStorageSync('testRecords') || [];
records.unshift(testRecord);
if (records.length > 20) records.pop();
wx.setStorageSync('testRecords', records);

// Test 3: Load from storage
const loadedRecords = wx.getStorageSync('testRecords');
console.log('Loaded test records:', loadedRecords);

// Test 4: Save appointment
const appointment = {
  _id: 'test-appointment-1',
  counselorName: '张老师',
  date: '2024-04-26',
  time: '14:00-15:00',
  reason: '情绪问题',
  status: '已确认'
};

let appointments = wx.getStorageSync('appointments') || [];
appointments.unshift(appointment);
wx.setStorageSync('appointments', appointments);
wx.setStorageSync('allAppointments', appointments);

// Test 5: Load appointments
const loadedAppointments = wx.getStorageSync('appointments');
console.log('Loaded appointments:', loadedAppointments);

// Test 6: Save treehole post
const treeholePost = {
  id: 'test-treehole-1',
  content: '今天心情很好！',
  time: new Date().toLocaleString(),
  likes: 0,
  comments: 0
};

let treeholeRecords = wx.getStorageSync('myPosts') || [];
treeholeRecords.unshift(treeholePost);
wx.setStorageSync('myPosts', treeholeRecords);

// Test 7: Load treehole records
const loadedTreeholeRecords = wx.getStorageSync('myPosts');
console.log('Loaded treehole records:', loadedTreeholeRecords);

// Test 8: Save AI record
const aiRecord = {
  keywords: ['开心', '积极'],
  emotion: '良好',
  score: 1,
  suggestions: ['继续保持积极心态'],
  input: '我今天很开心',
  date: new Date().toLocaleDateString()
};

let aiRecords = wx.getStorageSync('aiRecords') || [];
aiRecords.unshift(aiRecord);
wx.setStorageSync('aiRecords', aiRecords);

// Test 9: Load AI records
const loadedAiRecords = wx.getStorageSync('aiRecords');
console.log('Loaded AI records:', loadedAiRecords);

console.log('All tests completed!');
console.log('Storage contents:', storage);
