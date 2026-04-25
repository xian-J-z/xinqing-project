const cloud = require('wx-server-sdk')
const request = require('request')  // 云函数内置，无需安装

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const API_KEY = "ark-21e98a09-af05-4237-946d-2611cf270d14-6972e"
const API_URL = "https://ark.cn-beijing.volces.com/api/v3/chat/completions"

exports.main = async (event) => {
  const { message, history = [] } = event
  
  console.log('收到消息:', message)
  console.log('历史长度:', history.length)

  try {
    const messages = [
      {
        role: "system",
        content: `你是专业、温柔、有同理心的大学生心理咨询师。
请用温暖、简短、自然的口语回应。
专注倾听、共情、分析情绪、给出安慰与建议。
用户提到头疼、失眠、精神紧绷时，要给予理解和实际应对建议。
不要说你是AI，每次回复2-3句话。`
      }
    ]

    // 处理历史对话（只取最近5条，避免token超限）
    const recentHistory = history.slice(-5)
    for (const item of recentHistory) {
      messages.push({
        role: item.role === "user" ? "user" : "assistant",
        content: item.content
      })
    }

    messages.push({ role: "user", content: message })

    console.log('发送消息数:', messages.length)

    // 使用 request 调用
    const response = await new Promise((resolve, reject) => {
      request.post({
        url: API_URL,
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "doubao-1-5-pro-32k-250115",
          messages: messages,
          temperature: 0.7,
          max_tokens: 500
        })
      }, (err, res, body) => {
        if (err) {
          console.error('请求错误:', err)
          return reject(err)
        }
        try {
          const data = JSON.parse(body)
          console.log('API响应状态:', res.statusCode)
          resolve(data)
        } catch (e) {
          reject(e)
        }
      })
    })

    if (response.error) {
      console.error('API返回错误:', response.error)
      throw new Error(response.error.message)
    }

    const reply = response.choices[0].message.content
    console.log('AI回复:', reply)

    return {
      success: true,
      reply: reply
    }

  } catch (e) {
    console.error("调用失败：", e)
    return {
      success: false,
      reply: "嗯，我在这里听你说呢～能再多跟我聊聊你的感受吗？💛"
    }
  }
}