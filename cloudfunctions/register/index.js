// 用户注册云函数 - 根据角色将用户信息写入数据库
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { userInfo, role } = event

  try {
    // 检查用户是否已存在
    const userCheck = await db.collection('user').where({
      openid: openid
    }).get()

    if (userCheck.data && userCheck.data.length > 0) {
      // 用户已存在，更新信息
      const existingUser = userCheck.data[0]
      
      // 如果角色变化，更新角色
      if (existingUser.role !== role) {
        await db.collection('user').doc(existingUser._id).update({
          data: {
            role: role,
            nickName: userInfo.nickName || existingUser.nickName,
            avatarUrl: userInfo.avatarUrl || existingUser.avatarUrl
          }
        })
        
        // 如果变成咨询师，添加咨询师记录
        if (role === 'counselor') {
          const counselorCheck = await db.collection('counselor').where({
            openid: openid
          }).get()
          
          if (!counselorCheck.data || counselorCheck.data.length === 0) {
            await db.collection('counselor').add({
              data: {
                openid: openid,
                name: userInfo.nickName || '咨询师',
                avatar: userInfo.avatarUrl || '', // 对应 counselor 表的 avatar 字段
                intro: '', // 对应 counselor 表的 intro 字段
                tags: [], // 对应 counselor 表的 tags 字段
                title: '心理咨询师', // 对应 counselor 表的 title 字段
                available: true // 对应 counselor 表的 available 字段，默认正常状态
              }
            })
          }
        }
      }

      return {
        success: true,
        message: '用户已存在，已更新',
        userId: existingUser._id,
        role: role
      }
    }

    // 新用户注册：写入 user 表（字段和你数据库完全匹配）
    const userData = {
      openid: openid,
      nickName: userInfo.nickName || '新用户',
      avatarUrl: userInfo.avatarUrl || '',
      role: role || 'user',
      createTime: new Date()
    }

    const userResult = await db.collection('user').add({
      data: userData
    })

    // 新用户是咨询师，写入 counselor 表（字段和你数据库完全匹配）
    if (role === 'counselor') {
      await db.collection('counselor').add({
        data: {
          openid: openid,
          name: userInfo.nickName || '咨询师',
          avatar: userInfo.avatarUrl || '',
          intro: '',
          tags: [],
          title: '心理咨询师',
          available: true
        }
      })
    }

    return {
      success: true,
      message: '注册成功',
      userId: userResult._id,
      role: role
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