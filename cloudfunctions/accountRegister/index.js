// 账号密码注册云函数 - 支持咨询师和管理员注册账号
const cloud = require('wx-server-sdk')
const crypto = require('crypto')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 简单密码哈希函数
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { username, password, role, userInfo } = event

  // 验证必要参数
  if (!username || !password) {
    return {
      success: false,
      message: '用户名和密码不能为空'
    }
  }

  // 只有咨询师和管理员可以账号注册
  if (role !== 'counselor' && role !== 'admin') {
    return {
      success: false,
      message: '只有咨询师和管理员可以注册账号'
    }
  }

  try {
    // 检查用户名是否已存在
    const userCheck = await db.collection('user').where({
      username: username
    }).get()

    if (userCheck.data && userCheck.data.length > 0) {
      return {
        success: false,
        message: '用户名已存在'
      }
    }

    // 密码强度检查
    if (password.length < 6) {
      return {
        success: false,
        message: '密码长度不能少于6位'
      }
    }

    // 创建用户数据
    const hashedPassword = hashPassword(password)
    const userData = {
      openid: openid,
      username: username,
      password: hashedPassword,
      nickName: userInfo?.nickName || username,
      avatarUrl: userInfo?.avatarUrl || '',
      role: role,
      createTime: new Date()
    }

    // 写入 user 表
    const userResult = await db.collection('user').add({
      data: userData
    })

    // 如果是咨询师，同步写入 counselor 表和 admin_counselor 表
    if (role === 'counselor') {
      // 写入 counselor 表（公开信息，username 用于关联）
      await db.collection('counselor').add({
        data: {
          openid: openid,
          name: username,
          username: username,  // 保存账号，用于与 admin_counselor 关联
          avatar: '',
          profile: '',
          title: '心理咨询师',
          specialties: [],
          experience: '',
          price: 200,
          rating: 5.0,
          consults: 0,
          available: true,
          createTime: new Date()
        }
      })

      // 同时写入 admin_counselor 表（保存账号密码信息）
      await db.collection('admin_counselor').add({
        data: {
          username: username,
          name: username,  // 保存名字，与 counselor.name 一一对应
          password: password,  // 明文密码
          hashedPassword: hashedPassword,  // 哈希密码
          createdBy: openid,
          createTime: new Date()
        }
      })
    }

    return {
      success: true,
      message: '注册成功',
      userId: userResult._id,
      role: role,
      password: password  // 返回明文密码供管理员查看
    }

  } catch (err) {
    console.error('注册失败:', err)
    return {
      success: false,
      message: '注册失败: ' + err.message,
      error: err
    }
  }
}
