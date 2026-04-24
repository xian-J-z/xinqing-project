// pages/counselor/manage.js
const app = getApp();

Page({
  data: {
    // 预约数据
    allAppointments: [],
    pendingList: [],
    confirmedList: [],
    completedList: [],
    cancelledList: [],
    
    // 统计数据
    pendingCount: 0,
    confirmedCount: 0,
    completedCount: 0,
    totalCount: 0,
    
    // 状态
    loading: false,
    historyTab: 'completed',
    historyList: []
  },

  onLoad: function() {
    this.checkUserRole();
  },

  onShow: function() {
    this.checkUserRole();
    this.loadAppointments();
  },

  // 检查用户角色
  checkUserRole: function() {
    const userRole = app.getUserRole();
    console.log('用户角色:', userRole);
    if (userRole !== 'counselor') {
      wx.showModal({
        title: '提示',
        content: '只有心理咨询师才能访问此页面',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
    }
  },

  // 加载预约数据
  loadAppointments: function() {
    const self = this;
    self.setData({ loading: true });
    
    const db = wx.cloud.database();
    const counselorOpenid = app.getOpenid();
    
    console.log('========== 调试信息 ==========');
    console.log('当前咨询师openid:', counselorOpenid);
    
    // 先查询所有预约
    db.collection('appointment').get({
      success: function(allRes) {
        console.log('数据库中预约总数:', allRes.data.length);
        if (allRes.data.length > 0) {
          console.log('第一条预约完整数据:', JSON.stringify(allRes.data[0]));
        }
        
        // 查询当前咨询师的预约
        db.collection('appointment').where({
          counselorOpenid: counselorOpenid
        }).get({
          success: function(res) {
            console.log('查询到的预约条数:', res.data.length);
            const appointments = res.data || [];
            
            // 分类
            const pendingList = appointments.filter(a => a.status === '待确认');
            const confirmedList = appointments.filter(a => a.status === '已确认');
            const completedList = appointments.filter(a => a.status === '已完成');
            const cancelledList = appointments.filter(a => 
              a.status === '已取消' || a.status === '已拒绝'
            );
            
            self.setData({
              allAppointments: appointments,
              pendingList: pendingList,
              confirmedList: confirmedList,
              completedList: completedList,
              cancelledList: cancelledList,
              pendingCount: pendingList.length,
              confirmedCount: confirmedList.length,
              completedCount: completedList.length,
              totalCount: appointments.length,
              loading: false,
              historyList: completedList
            });
            console.log('数据加载完成');
          },
          fail: function(err) {
            console.error('查询失败:', err);
            self.setData({ loading: false });
          }
        });
      },
      fail: function(err) {
        console.error('全量查询失败:', err);
        self.setData({ loading: false });
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    });
  },

  // 确认预约
  confirmAppointment: function(e) {
    const id = e.currentTarget.dataset.id;
    this.updateStatus(id, '已确认');
  },

  // 拒绝预约
  rejectAppointment: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '拒绝预约',
      content: '确定要拒绝此预约吗？',
      success: res => {
        if (res.confirm) {
          this.updateStatus(id, '已拒绝');
        }
      }
    });
  },

  // 完成咨询
  completeAppointment: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '完成咨询',
      content: '确定要标记为已完成吗？',
      success: res => {
        if (res.confirm) {
          this.updateStatus(id, '已完成');
        }
      }
    });
  },

  // 更新预约状态
  updateStatus: function(id, status) {
    const self = this;
    
    wx.cloud.callFunction({
      name: 'appointment',
      data: {
        action: 'updateStatus',
        appointmentId: id,
        status: status
      },
      success: res => {
        console.log('更新状态成功', res);
        wx.showToast({
          title: status === '已拒绝' ? '已拒绝' : '操作成功',
          icon: 'success'
        });
        self.loadAppointments();
      },
      fail: err => {
        console.error('更新状态失败', err);
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        });
      }
    });
  },

  // 切换历史记录标签
  switchHistoryTab: function(e) {
    const tab = e.currentTarget.dataset.tab;
    const list = tab === 'completed' ? this.data.completedList : this.data.cancelledList;
    this.setData({
      historyTab: tab,
      historyList: list
    });
  }
});
