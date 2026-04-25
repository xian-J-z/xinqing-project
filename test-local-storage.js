// Test script to check local storage functionality
console.log('Testing local storage...');

// Test 1: Set test record
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

// Test 2: Get existing records
let records = wx.getStorageSync('testRecords') || [];
console.log('Existing records:', records);

// Test 3: Add new record
records.unshift(testRecord);
if (records.length > 20) records.pop();
wx.setStorageSync('testRecords', records);
console.log('Updated records:', records);

// Test 4: Verify storage
const storedRecords = wx.getStorageSync('testRecords');
console.log('Stored records:', storedRecords);

// Test 5: Check appointment records
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
console.log('Appointments:', appointments);

// Test 6: Check treehole records
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
console.log('Treehole records:', treeholeRecords);

// Test 7: Check AI records
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
console.log('AI records:', aiRecords);

console.log('Local storage test completed!');
