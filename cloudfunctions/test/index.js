const cloud = require("wx-server-sdk");
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});
const db = cloud.database();

// 获取openid
const getOpenId = async () => {
  const wxContext = cloud.getWXContext();
  return { openid: wxContext.OPENID };
};

// 获取量表信息
const getTestInfo = async (event) => {
  try {
    const { testId } = event;
    const result = await db.collection("tests").where({ _id: testId }).get();
    return { success: true, data: result.data[0] };
  } catch (e) {
    return { success: false, errMsg: e };
  }
};

// 获取量表题目
const getTestQuestions = async (event) => {
  try {
    const { testId } = event;
    console.log('获取题目, testId:', testId);
    
    // 尝试直接获取所有题目
    const allQuestions = await db.collection("questionBank").get();
    console.log('questionBank总数:', allQuestions.data.length);
    
    // 按testId过滤
    const filtered = allQuestions.data.filter(q => q.testId === testId);
    console.log('匹配题目数:', filtered.length);
    
    // 按sort排序
    filtered.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    
    return { success: true, data: filtered };
  } catch (e) {
    console.error('获取题目失败:', e);
    return { success: false, errMsg: e.message || e };
  }
};

// 保存测试记录
const saveTestResult = async (event) => {
  try {
    const { testId, testTitle, totalScore, answers } = event;
    await db.collection("testRecords").add({
      data: {
        openid: cloud.getWXContext().OPENID,
        testId,
        testTitle,
        totalScore,
        answers,
        createTime: new Date(),
        status: 1
      }
    });
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e };
  }
};

// 入口
exports.main = async (event) => {
  switch (event.type) {
    case "getOpenId": return getOpenId();
    case "getTestInfo": return getTestInfo(event);
    case "getTestQuestions": return getTestQuestions(event);
    case "saveTestResult": return saveTestResult(event);
  }
};