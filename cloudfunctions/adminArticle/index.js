// 云函数：adminArticle
// 管理员文章管理
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 获取所有文章
async function getArticles() {
  const res = await db.collection('article')
    .orderBy('createTime', 'desc')
    .get()
  return res.data
}

// 发布文章
async function publishArticle(article) {
  const res = await db.collection('article').add({
    data: {
      ...article,
      createTime: new Date(),
      viewCount: 0,
      likeCount: 0
    }
  })
  return { success: true, articleId: res._id }
}

// 更新文章
async function updateArticle(articleId, data) {
  await db.collection('article').doc(articleId).update({
    data: {
      ...data,
      updateTime: new Date()
    }
  })
  return { success: true }
}

// 删除文章
async function deleteArticle(articleId) {
  await db.collection('article').doc(articleId).remove()
  return { success: true }
}

// 获取文章详情
async function getArticleDetail(articleId) {
  const res = await db.collection('article').doc(articleId).get()
  return res.data
}

exports.main = async (event, context) => {
  const { action } = event

  try {
    switch (action) {
      case 'getArticles':
        return await getArticles()
        
      case 'publish':
        return await publishArticle(event.article)
        
      case 'update':
        return await updateArticle(event.articleId, event.data)
        
      case 'delete':
        return await deleteArticle(event.articleId)
        
      case 'detail':
        return await getArticleDetail(event.articleId)
        
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (e) {
    console.error(e)
    return { success: false, message: e.message }
  }
}
