// 云函数：appointment
// 处理预约相关操作
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 创建预约
async function createAppointment(data) {
  try {
    const res = await db.collection('appointment').add({
      data: {
        ...data,
        createTime: new Date(),
        updateTime: new Date()
      }
    })
    return { success: true, _id: res._id }
  } catch (e) {
    return { success: false, message: e.message }
  }
}

// 获取所有预约（管理员用）
async function getAllAppointments() {
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
    return []
  }
}

// 获取咨询师的预约
async function getCounselorAppointments(counselorId) {
  try {
    const res = await db.collection('appointment')
      .where({ counselorId: counselorId })
      .orderBy('createTime', 'desc')
      .get()
    return res.data
  } catch (e) {
    return []
  }
}

// 更新预约状态
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

// 取消预约
async function cancelAppointment(appointmentId) {
  return await updateAppointmentStatus(appointmentId, '已取消')
}

// 确认预约
async function confirmAppointment(appointmentId) {
  return await updateAppointmentStatus(appointmentId, '已确认')
}

// 拒绝预约
async function rejectAppointment(appointmentId) {
  return await updateAppointmentStatus(appointmentId, '已拒绝')
}

// 完成咨询
async function completeAppointment(appointmentId) {
  return await updateAppointmentStatus(appointmentId, '已完成')
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

exports.main = async (event, context) => {
  const { action } = event

  try {
    switch (action) {
      case 'create':
        return await createAppointment(event.data)
        
      case 'getAll':
        return await getAllAppointments()
        
      case 'getByCounselor':
        return await getCounselorAppointments(event.counselorId)
        
      case 'updateStatus':
        return await updateAppointmentStatus(event.appointmentId, event.status)
        
      case 'cancel':
        return await cancelAppointment(event.appointmentId)
        
      case 'confirm':
        return await confirmAppointment(event.appointmentId)
        
      case 'reject':
        return await rejectAppointment(event.appointmentId)
        
      case 'complete':
        return await completeAppointment(event.appointmentId)
        
      case 'delete':
        return await deleteAppointment(event.appointmentId)
        
      case 'getStats':
        return await getAppointmentStats()
        
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (e) {
    console.error(e)
    return { success: false, message: e.message }
  }
}
