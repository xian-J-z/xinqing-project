// 账号密码登录云函数 - 带日志调试 + 内置管理员
const cloud = require('wx-server-sdk')
const crypto = require('crypto')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 密码哈希
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

exports.main = async (event, context) => {
  console.log('【登录日志】收到登录请求：', event)

  const { username, password, role } = event

  // 日志
  console.log('【登录日志】账号：', username)
  console.log('【登录日志】密码：', password)
  console.log('【登录日志】角色：', role)

  if (!username || !password || !role) {
    console.log('【登录日志】参数缺失')
    return {
      success: false,
      message: '信息不完整'
    }
  }

  // ==============================================
  // 🔥 管理员登录：写死账号（不走数据库，绝对稳定）
  // ==============================================
  if (role === 'admin') {
    console.log('【登录日志】进入管理员登录逻辑')

    // 固定管理员账号密码
    const ADMIN_USER = 'admin'
    const ADMIN_PWD = '123456'

    console.log('【登录日志】系统内置账号：', ADMIN_USER)
    console.log('【登录日志】系统内置密码：', ADMIN_PWD)

    if (username === ADMIN_USER && password === ADMIN_PWD) {
      console.log('【登录日志】管理员账号密码匹配 → 登录成功')
      return {
        success: true,
        userId: 'admin001',
        role: 'admin',
        userInfo: {
          nickName: '系统管理员',
          avatarUrl: '',
          username: 'admin'
        }
      }
    } else {
      console.log('【登录日志】管理员账号或密码不匹配')
      return {
        success: false,
        message: '管理员账号或密码错误'
      }
    }
  }

  // ==============================================
  // 咨询师登录（从 admin_counselor 表验证）
  // ==============================================
  if (role === 'counselor') {
    console.log('【登录日志】进入咨询师登录逻辑')
    try {
      const hashedPassword = hashPassword(password)
      console.log('【登录日志】咨询师加密后密码：', hashedPassword)

      // 从 admin_counselor 表验证账号密码
      const counselorRes = await db.collection('admin_counselor').where({
        username: username,
        password: password  // 使用明文密码验证（或者用 hashedPassword 验证哈希）
      }).get()

      console.log('【登录日志】咨询师查询结果：', counselorRes.data)

      if (counselorRes.data.length > 0) {
        console.log('【登录日志】咨询师登录成功')

        // 根据 username 从 counselor 表获取公开信息
        const publicRes = await db.collection('counselor').where({
          name: username
        }).get()

        const publicInfo = publicRes.data.length > 0 ? publicRes.data[0] : {}

        return {
          success: true,
          userId: counselorRes.data[0]._id,
          role: 'counselor',
          userInfo: {
            nickName: publicInfo.name || username,
            avatarUrl: publicInfo.avatar || '',
            username: username,
            counselorId: publicInfo._id || ''
          }
        }
      } else {
        console.log('【登录日志】未找到咨询师账号')
        return {
          success: false,
          message: '咨询师用户名或密码错误'
        }
      }
    } catch (err) {
      console.error('【登录日志】咨询师登录异常：', err)
      return {
        success: false,
        message: '服务异常'
      }
    }
  }

  console.log('【登录日志】未知角色：', role)
  return {
    success: false,
    message: '角色错误'
  }
}