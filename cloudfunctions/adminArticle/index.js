// 云函数：adminArticle
// 管理员文章管理
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// ==============================================
// 👇 核心工具函数：批量把 cloud:// 转成 https 链接
// ==============================================
async function convertCoversToUrl(articles) {
  if (!articles || articles.length === 0) return articles

  const fileList = articles
    .map(item => item.cover)
    .filter(url => url && url.startsWith('cloud://'))

  if (fileList.length === 0) return articles

  const { fileList: urls } = await cloud.getTempFileURL({
    fileList: fileList
  })

  const urlMap = {}
  urls.forEach(item => {
    urlMap[item.fileID] = item.tempFileURL
  })

  return articles.map(item => {
    if (item.cover && urlMap[item.cover]) {
      item.cover = urlMap[item.cover]
    }
    return item
  })
}

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
  data.sort((a, b) => {
    if (a.isTop && !b.isTop) return -1
    if (!a.isTop && b.isTop) return 1
    const timeA = a.topTime || a.updateTime || a.createTime
    const timeB = b.topTime || b.updateTime || b.createTime
    return new Date(timeB) - new Date(timeA)
  })

  // 👇 转换图片
  return await convertCoversToUrl(data)
}

// 获取置顶文章
async function getTopArticles() {
  const res = await db.collection('article')
    .where({ isTop: true })
    .orderBy('topTime', 'desc')
    .orderBy('createTime', 'desc')
    .get()

  // 👇 转换图片
  return await convertCoversToUrl(res.data)
}

// 获取最新文章
async function getLatestArticles(event) {
  const limit = event.limit || 5
  const res = await db.collection('article')
  .where({ isTop: _.neq(true) })
  .orderBy('updateTime', 'desc')
  .limit(limit)
  .get()

  // 👇 转换图片
  return await convertCoversToUrl(res.data)
}

// 获取全部文章（列表页）
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
  data.sort((a, b) => {
    if (a.isTop && !b.isTop) return -1
    if (!a.isTop && b.isTop) return 1
    const timeA = a.topTime || a.updateTime || a.createTime
    const timeB = b.topTime || b.updateTime || b.createTime
    return new Date(timeB) - new Date(timeA)
  })

  // 👇 转换图片
  const convertedData = await convertCoversToUrl(data)

  return {
    data: convertedData,
    total: total,
    hasMore: false
  }
}

// 获取文章详情
async function getArticleDetail(articleId) {
  const res = await db.collection('article').doc(articleId).get()
  const data = res.data

  // 👇 转换图片
  if (data && data.cover) {
    const result = await convertCoversToUrl([data])
    return result[0]
  }

  return data
}

// ====================== 以下代码不变 ======================
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

async function updateArticle(articleId, data, role) {
  const updateData = {
    ...data,
    updateTime: new Date()
  }
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

async function deleteArticle(articleId) {
  await db.collection('article').doc(articleId).remove()
  return { success: true }
}

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