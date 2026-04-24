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
  const [users, counselors, articles, appointments] = await Promise.all([
    db.collection('user').count(),
    db.collection('counselor').count(),
    db.collection('article').count(),
    db.collection('appointment').count()
  ])
  return {
    totalUsers: users.total,
    counselors: counselors.total,
    articles: articles.total,
    totalAppointments: appointments.total
  }
}

// 获取咨询师列表（从 counselor 集合）
async function getCounselors() {
  const countRes = await db.collection('counselor').count()
  const total = countRes.total
  const batchSize = 100
  const tasks = []
  for (let i = 0; i < total; i += batchSize) {
    const promise = db.collection('counselor')
      .orderBy('createTime', 'desc')
      .skip(i)
      .limit(batchSize)
      .get()
    tasks.push(promise)
  }
  const results = await Promise.all(tasks)
  let data = []
  results.forEach(res => { data = data.concat(res.data) })
  return data
}

// 更新咨询师信息
async function updateCounselor(counselorId, data) {
  await db.collection('counselor').doc(counselorId).update({
    data: {
      ...data,
      updateTime: new Date()
    }
  })
  return { success: true }
}

// 切换咨询师可用状态
async function toggleCounselorAvailable(counselorId, available) {
  await db.collection('counselor').doc(counselorId).update({
    data: { available: available }
  })
  return { success: true }
}

// 删除咨询师
async function deleteCounselor(counselorId) {
  await db.collection('counselor').doc(counselorId).remove()
  return { success: true }
}

// 获取所有预约列表
async function getAppointments() {
  try {
    const countRes = await db.collection('appointment').count()
    const total = countRes.total
    if (total === 0) return []
    
    const batchSize = 100
    const tasks = []
    for (let i = 0; i < total; i += batchSize) {
      tasks.push(
        db.collection('appointment')
          .orderBy('createTime', 'desc')
          .skip(i)
          .limit(batchSize)
          .get()
      )
    }
    const results = await Promise.all(tasks)
    let data = []
    results.forEach(res => { data = data.concat(res.data) })
    return data
  } catch (e) {
    console.error('获取预约列表失败', e)
    return []
  }
}

// 获取预约统计数据
async function getAppointmentStats() {
  try {
    const [total, pending, confirmed, completed, cancelled] = await Promise.all([
      db.collection('appointment').count(),
      db.collection('appointment').where({ status: '待确认' }).count(),
      db.collection('appointment').where({ status: '已确认' }).count(),
      db.collection('appointment').where({ status: '已完成' }).count(),
      db.collection('appointment').where({
        status: db.command.in(['已取消', '已拒绝'])
      }).count()
    ])
    return {
      total: total.total,
      pending: pending.total,
      confirmed: confirmed.total,
      completed: completed.total,
      cancelled: cancelled.total
    }
  } catch (e) {
    return {
      total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0
    }
  }
}

// 更新预约状态（管理员操作）
async function updateAppointmentStatus(appointmentId, status) {
  try {
    await db.collection('appointment').doc(appointmentId).update({
      data: {
        status: status,
        updateTime: new Date()
      }
    })
    return { success: true }
  } catch (e) {
    return { success: false, message: e.message }
  }
}

// 删除预约
async function deleteAppointment(appointmentId) {
  try {
    await db.collection('appointment').doc(appointmentId).remove()
    return { success: true }
  } catch (e) {
    return { success: false, message: e.message }
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
        
      case 'getCounselors':
        return await getCounselors()
        
      case 'updateCounselor':
        return await updateCounselor(event.counselorId, event.data)
        
      case 'toggleCounselorAvailable':
        return await toggleCounselorAvailable(event.counselorId, event.available)
        
      case 'deleteCounselor':
        return await deleteCounselor(event.counselorId)
        
      case 'getAppointments':
        return await getAppointments()
        
      case 'getAppointmentStats':
        return await getAppointmentStats()
        
      case 'updateAppointmentStatus':
        return await updateAppointmentStatus(event.appointmentId, event.status)
        
      case 'deleteAppointment':
        return await deleteAppointment(event.appointmentId)
        
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (e) {
    console.error(e)
    return { success: false, message: e.message }
  }
}
