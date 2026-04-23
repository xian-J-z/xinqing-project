// 云函数：adminArticle
// 管理员文章管理
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 获取所有文章（管理员用，按置顶优先 + 更新时间排序）
async function getArticles() {
  const countRes = await db.collection('article').count()
  const total = countRes.total
  const batchSize = 100
  const tasks = []
  for (let i = 0; i < total; i += batchSize) {
    const promise = db.collection('article')
      .orderBy('updateTime', 'desc')
      .skip(i)
      .limit(batchSize)
      .get()
    tasks.push(promise)
  }
  const results = await Promise.all(tasks)
  let data = []
  results.forEach(res => { data = data.concat(res.data) })
  // 排序：置顶优先，同级别按更新时间倒序
  data.sort((a, b) => {
    if (a.isTop && !b.isTop) return -1
    if (!a.isTop && b.isTop) return 1
    const timeA = a.topTime || a.updateTime || a.createTime
    const timeB = b.topTime || b.updateTime || b.createTime
    return new Date(timeB) - new Date(timeA)
  })
  return data
}

// 获取置顶文章（用于首页轮播）
async function getTopArticles() {
  const res = await db.collection('article')
    .where({ isTop: true })
    .orderBy('topTime', 'desc')
    .orderBy('createTime', 'desc')
    .get()
  return res.data
}

// 获取最新文章（用于首页列表，非置顶，按更新时间排序）
async function getLatestArticles(event) {
  const limit = event.limit || 5
  const res = await db.collection('article')
    .where({ isTop: _.neq(true) })
    .orderBy('updateTime', 'desc')
    .limit(limit)
    .get()
  return res.data
}

// 获取全部文章（用户文章列表页，按置顶优先 + 更新时间排序）
async function getAllArticles(event) {
  const countRes = await db.collection('article').count()
  const total = countRes.total
  const batchSize = 100
  const tasks = []
  for (let i = 0; i < total; i += batchSize) {
    const promise = db.collection('article')
      .orderBy('updateTime', 'desc')
      .skip(i)
      .limit(batchSize)
      .get()
    tasks.push(promise)
  }
  const results = await Promise.all(tasks)
  let data = []
  results.forEach(res => { data = data.concat(res.data) })
  // 排序：置顶优先，同级别按更新时间倒序
  data.sort((a, b) => {
    if (a.isTop && !b.isTop) return -1
    if (!a.isTop && b.isTop) return 1
    const timeA = a.topTime || a.updateTime || a.createTime
    const timeB = b.topTime || b.updateTime || b.createTime
    return new Date(timeB) - new Date(timeA)
  })
  return {
    data: data,
    total: total,
    hasMore: false
  }
}

// 发布文章
async function publishArticle(article, role) {
  const isTop = role === 'admin' ? (article.isTop || false) : false
  const data = {
    title: article.title,
    cover: article.cover || '',
    content: article.content,
    category: article.category || '心理健康',
    authorName: article.authorName || '管理员',
    authorOpenid: article.authorOpenid || '',
    isTop: isTop,
    viewCount: 0,
    likeCount: 0,
    createTime: new Date(),
    updateTime: new Date()
  }
  if (isTop) {
    data.topTime = new Date()
  }
  const res = await db.collection('article').add({ data })
  return { success: true, articleId: res._id }
}

// 更新文章
async function updateArticle(articleId, data, role) {
  const updateData = {
    ...data,
    updateTime: new Date()
  }
  // 只有管理员可以修改置顶状态
  if (role !== 'admin') {
    delete updateData.isTop
    delete updateData.topTime
  } else if (updateData.isTop) {
    updateData.topTime = new Date()
  } else {
    updateData.topTime = null
  }
  await db.collection('article').doc(articleId).update({ data: updateData })
  return { success: true }
}

// 切换置顶状态
async function toggleTop(articleId, isTop) {
  const updateData = {
    isTop: isTop,
    updateTime: new Date()
  }
  if (isTop) {
    updateData.topTime = new Date()
  } else {
    updateData.topTime = null
  }
  await db.collection('article').doc(articleId).update({ data: updateData })
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

// 增加阅读量
async function incrementViewCount(articleId) {
  await db.collection('article').doc(articleId).update({
    data: { viewCount: _.inc(1) }
  })
  return { success: true }
}

exports.main = async (event, context) => {
  const { action } = event

  try {
    switch (action) {
      case 'getArticles':
        return await getArticles()
        
      case 'getTopArticles':
        return await getTopArticles()
        
      case 'getLatestArticles':
        return await getLatestArticles(event)
        
      case 'getAllArticles':
        return await getAllArticles(event)
        
      case 'publish':
        return await publishArticle(event.article, event.role || 'admin')
        
      case 'update':
        return await updateArticle(event.articleId, event.data, event.role || 'admin')
        
      case 'toggleTop':
        return await toggleTop(event.articleId, event.isTop)
        
      case 'delete':
        return await deleteArticle(event.articleId)
        
      case 'detail':
        return await getArticleDetail(event.articleId)
        
      case 'incrementView':
        return await incrementViewCount(event.articleId)
        
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (e) {
    console.error(e)
    return { success: false, message: e.message }
  }
}
