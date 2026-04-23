// pages/admin/counselors.js
const app = getApp()

Page({
  data: {
    counselors: [],
    showEditModal: false,
    editingCounselor: null,
    editForm: {
      name: '',
      title: '',
      intro: '',
      experience: '',
      price: '',
      specialties: [],
      specialtyInput: ''
    }
  },

  onLoad() {
    if (app.getUserRole() !== 'admin') {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    this.loadCounselors()
  },

  onShow() {
    this.loadCounselors()
  },

  async loadCounselors() {
    wx.showLoading({ title: '加载中...' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'adminManage',
        data: { action: 'getCounselors' }
      })
      wx.hideLoading()
      if (Array.isArray(res.result)) {
        const counselors = res.result.map(c => ({
          ...c,
          createTimeStr: c.createTime ? this.formatTime(c.createTime) : '-'
        }))
        this.setData({ counselors })
      }
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  async toggleAvailable(e) {
    const { id, available } = e.currentTarget.dataset
    try {
      await wx.cloud.callFunction({
        name: 'adminManage',
        data: { action: 'toggleCounselorAvailable', counselorId: id, available: !available }
      })
      wx.showToast({ title: available ? '已停用' : '已启用', icon: 'success' })
      this.loadCounselors()
    } catch (e) {
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  async deleteCounselor(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '警告',
      content: '确定删除该咨询师？删除后用户端将无法看到该咨询师。',
      success: async (res) => {
        if (res.confirm) {
          await wx.cloud.callFunction({
            name: 'adminManage',
            data: { action: 'deleteCounselor', counselorId: id }
          })
          wx.showToast({ title: '已删除', icon: 'success' })
          this.loadCounselors()
        }
      }
    })
  },

  showEdit(e) {
    const { id } = e.currentTarget.dataset
    const counselor = this.data.counselors.find(c => c._id === id)
    if (!counselor) return
    this.setData({
      showEditModal: true,
      editingCounselor: counselor,
      editForm: {
        name: counselor.name || '',
        title: counselor.title || '',
        intro: counselor.intro || '',
        experience: counselor.experience || '',
        price: String(counselor.price || ''),
        specialties: counselor.specialties || counselor.tags || [],
        specialtyInput: ''
      }
    })
  },

  hideEditModal() {
    this.setData({ showEditModal: false, editingCounselor: null })
  },

  stopProp() {},

  onEditInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`editForm.${field}`]: e.detail.value })
  },

  addSpecialty() {
    const val = this.data.editForm.specialtyInput.trim()
    if (!val) return
    const specialties = [...this.data.editForm.specialties, val]
    this.setData({ 'editForm.specialties': specialties, 'editForm.specialtyInput': '' })
  },

  removeSpecialty(e) {
    const idx = e.currentTarget.dataset.index
    const specialties = this.data.editForm.specialties.filter((_, i) => i !== idx)
    this.setData({ 'editForm.specialties': specialties })
  },

  async saveEdit() {
    const { editingCounselor, editForm } = this.data
    if (!editForm.name.trim()) {
      wx.showToast({ title: '请填写姓名', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...' })
    try {
      const data = {
        name: editForm.name.trim(),
        title: editForm.title.trim() || '心理咨询师',
        intro: editForm.intro.trim(),
        experience: editForm.experience.trim(),
        price: Number(editForm.price) || 200,
        specialties: editForm.specialties
      }
      await wx.cloud.callFunction({
        name: 'adminManage',
        data: { action: 'updateCounselor', counselorId: editingCounselor._id, data }
      })
      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
      this.hideEditModal()
      this.loadCounselors()
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  formatTime(time) {
    if (!time) return '-'
    const d = new Date(time)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
})