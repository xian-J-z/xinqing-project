// 云函数：adminManage
// 管理员用户管理
const cloud = require('wx-server-sdk')
const crypto = require('crypto')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// 获取所有用户
async function getUsers(role) {
  const whereClause = role ? { role: role } : {}
  const res = await db.collection('user').where(whereClause).field({
    password: false // 不返回密码
  }).orderBy('createTime', 'desc').get()
  return res.data
}

// 停用/启用用户
async function toggleUserStatus(userId, disabled) {
  await db.collection('user').doc(userId).update({
    data: { disabled: disabled }
  })
  return { success: true }
}

// 删除用户
async function deleteUser(userId) {
  await db.collection('user').doc(userId).remove()
  return { success: true }
}

// 获取统计数据
async function getStats() {
  const [users, counselors, articles] = await Promise.all([
    db.collection('user').count(),
    db.collection('user').where({ role: 'counselor' }).count(),
    db.collection('article').count()
  ])
  return {
    totalUsers: users.total,
    counselors: counselors.total,
    articles: articles.total
  }
}

// 创建管理员账号
async function createAdmin(username, password, nickName) {
  // 检查是否已存在
  const exist = await db.collection('user').where({ username: username }).get()
  if (exist.data.length > 0) {
    return { success: false, message: '账号已存在' }
  }
  
  await db.collection('user').add({
    data: {
      username: username,
      password: password, // 存储明文密码
      nickName: nickName || username,
      role: 'admin',
      disabled: false,
      createTime: new Date()
    }
  })
  return { success: true, message: '创建成功' }
}

exports.main = async (event, context) => {
  const { action } = event
  const wxContext = cloud.getWXContext()

  try {
    switch (action) {
      case 'getUsers':
        return await getUsers(event.role)
        
      case 'toggleStatus':
        return await toggleUserStatus(event.userId, event.disabled)
        
      case 'deleteUser':
        return await deleteUser(event.userId)
        
      case 'getStats':
        return await getStats()
        
      case 'createAdmin':
        return await createAdmin(event.username, event.password, event.nickName)
        
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (e) {
    console.error(e)
    return { success: false, message: e.message }
  }
}
