// pages/treehole/treehole.js
const app = getApp();

Page({
  data: {
    posts: [],
    myPosts: [],
    pendingPosts: [],  // 咨询师待回复帖子
    showMyPosts: false,
    inputTitle: '',
    inputText: '',
    currentTab: 0,
    loading: true,
    searchKeyword: '',
    showEditModal: false,
    editingPost: null,
    editTitle: '',
    editContent: '',
    isAnonymous: true,
    filterType: 'all',
    userRole: 'user'
  },

  onLoad: function() {
    this.setData({ userRole: app.getUserRole() });
    this.loadPosts();
    this.loadMyPosts();
    this.loadPendingPosts();
  },

  onShow: function() {
    this.setData({ userRole: app.getUserRole() });
    this.loadPosts();
    this.loadMyPosts();
    this.loadPendingPosts();
  },

  // 加载待回复帖子（咨询师功能）
  loadPendingPosts: function() {
    if (this.data.userRole !== 'counselor') return;
    
    const allPosts = wx.getStorageSync('allPosts') || [];
    const samplePosts = [
      {
        id: 'sample_1',
        title: '学业压力',
        content: '最近学业压力好大，每天都很焦虑，感觉自己什么都做不好...',
        anonymous: true,
        nickname: '匿名用户',
        avatar: '👤',
        time: '2小时前',
        likes: 23,
        comments: 5,
        liked: false,
        showComments: false,
        commentsList: []
      },
      {
        id: 'sample_2',
        title: '室友关系',
        content: '和室友的关系有点僵，不知道怎么开口沟通，感觉自己被孤立了',
        anonymous: true,
        nickname: '匿名用户',
        avatar: '👤',
        time: '5小时前',
        likes: 45,
        comments: 12,
        liked: false,
        showComments: false,
        commentsList: []
      }
    ];
    
    const posts = [...allPosts, ...samplePosts];
    // 筛选出还没有咨询师回复的帖子
    const pending = posts.filter(post => {
      const hasCounselorReply = post.commentsList && post.commentsList.some(
        c => c.isCounselorReply
      );
      return !hasCounselorReply;
    });
    
    this.setData({ pendingPosts: pending.slice(0, 10) });
  },

  // 加载帖子列表
  loadPosts: function() {
    wx.showLoading({ title: '加载中...' });
    
    // 从本地存储加载 + 模拟数据
    const localPosts = wx.getStorageSync('allPosts') || [];
    const samplePosts = [
      {
        id: 'sample_1',
        title: '学业压力',
        content: '最近学业压力好大，每天都很焦虑，感觉自己什么都做不好...',
        anonymous: true,
        nickname: '匿名用户',
        avatar: '👤',
        time: this.formatTime(new Date(Date.now() - 2*60*60*1000)),
        likes: 23,
        comments: 5,
        liked: false,
        showComments: false,
        commentsList: [
          { nickname: '小明', content: '我也有同感，我们一起加油吧！', time: '1小时前' },
          { nickname: '心理咨询师', content: '建议可以试试深呼吸放松法，每天坚持10分钟。', time: '30分钟前' }
        ]
      },
      {
        id: 'sample_2',
        title: '室友关系',
        content: '和室友的关系有点僵，不知道怎么开口沟通，感觉自己被孤立了',
        anonymous: true,
        nickname: '匿名用户',
        avatar: '👤',
        time: this.formatTime(new Date(Date.now() - 5*60*60*1000)),
        likes: 45,
        comments: 12,
        liked: false,
        showComments: false,
        commentsList: [
          { nickname: '学姐', content: '找个机会主动聊聊，误会说开了就好了', time: '4小时前' }
        ]
      },
      {
        id: 'sample_3',
        title: '焦虑测评',
        content: '今天做完了SCL-90测评，结果显示我有轻度的焦虑倾向，想问问大家有什么缓解焦虑的好方法吗？',
        anonymous: false,
        nickname: '小明',
        avatar: '🧑',
        time: this.formatTime(new Date(Date.now() - 24*60*60*1000)),
        likes: 67,
        comments: 18,
        liked: true,
        showComments: false,
        commentsList: [
          { nickname: '运动达人', content: '跑步真的很有用！每次跑完步心情都会好很多', time: '12小时前' },
          { nickname: '心灵树洞', content: '可以试试冥想，下载一个冥想App，每天睡前练习一下', time: '10小时前' }
        ]
      }
    ];

    // 合并数据，用户帖子在前
    const allPosts = [...localPosts, ...samplePosts];
    
    // 根据筛选条件过滤
    let filteredPosts = allPosts;
    if (this.data.filterType !== 'all') {
      filteredPosts = this.filterPosts(allPosts, this.data.filterType);
    }
    
    // 根据关键词搜索
    if (this.data.searchKeyword) {
      filteredPosts = this.searchPosts(filteredPosts, this.data.searchKeyword);
    }
    
    this.setData({ posts: filteredPosts, loading: false });
    wx.hideLoading();
  },

  // 格式化时间
  formatTime: function(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return minutes + '分钟前';
    if (hours < 24) return hours + '小时前';
    if (days < 7) return days + '天前';
    return date.toLocaleDateString('zh-CN');
  },

  // 过滤帖子
  filterPosts: function(posts, type) {
    switch(type) {
      case 'popular':
        return posts.sort((a, b) => b.likes - a.likes);
      case 'recent':
        return posts.sort((a, b) => new Date(b.time) - new Date(a.time));
      case 'discussed':
        return posts.sort((a, b) => b.comments - a.comments);
      default:
        return posts;
    }
  },

  // 搜索帖子
  searchPosts: function(posts, keyword) {
    const kw = keyword.toLowerCase();
    return posts.filter(post => 
      post.title.toLowerCase().includes(kw) || 
      post.content.toLowerCase().includes(kw)
    );
  },

  // 加载我的帖子
  loadMyPosts: function() {
    const myPosts = wx.getStorageSync('myPosts') || [];
    myPosts.forEach(post => {
      if (post.showComments === undefined) {
        post.showComments = false;
      }
    });
    this.setData({ myPosts: myPosts });
  },

  // 切换标签
  switchTab: function(e) {
    const index = e.currentTarget.dataset.index;
    const isCounselor = this.data.userRole === 'counselor';
    
    if (isCounselor) {
      // 咨询师: 0=全部 1=待回复 2=我的
      this.setData({
        currentTab: index,
        showMyPosts: index === 2
      });
    } else {
      // 普通用户: 0=全部 1=我的
      this.setData({
        currentTab: index,
        showMyPosts: index === 1
      });
    }
  },

  // 筛选类型切换
  switchFilter: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ filterType: type });
    this.loadPosts();
  },

  // 搜索输入
  onSearchInput: function(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  // 执行搜索
  doSearch: function() {
    this.loadPosts();
  },

  // 清除搜索
  clearSearch: function() {
    this.setData({ searchKeyword: '' });
    this.loadPosts();
  },

  // 标题输入
  onTitleInput: function(e) {
    this.setData({ inputTitle: e.detail.value });
  },

  // 内容输入
  onInput: function(e) {
    this.setData({ inputText: e.detail.value });
  },

  // 切换匿名
  toggleAnonymous: function() {
    this.setData({ isAnonymous: !this.data.isAnonymous });
  },

  // 发布帖子
  publishPost: function() {
    const { inputTitle, inputText, isAnonymous } = this.data;
    
    if (!inputTitle.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }
    
    if (!inputText.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }

    const userInfo = app.getUserInfo();
    const newPost = {
      id: 'post_' + Date.now(),
      title: inputTitle.trim(),
      content: inputText.trim(),
      anonymous: isAnonymous,
      nickname: isAnonymous ? '匿名用户' : (userInfo.nickName || '用户'),
      avatar: isAnonymous ? '👤' : '🧑',
      time: this.formatTime(new Date()),
      likes: 0,
      comments: 0,
      liked: false,
      showComments: false,
      commentsList: [],
      createTime: new Date().toISOString()
    };

    // 保存到我的帖子
    const myPosts = [newPost, ...this.data.myPosts];
    wx.setStorageSync('myPosts', myPosts);
    wx.setStorageSync('treeholeRecords', myPosts);

    // 保存到全部帖子
    const allPosts = [newPost, ...this.data.posts];
    wx.setStorageSync('allPosts', allPosts);
    
    this.setData({
      posts: allPosts,
      myPosts: myPosts,
      inputTitle: '',
      inputText: '',
      isAnonymous: true
    });
    
    wx.showToast({ title: '发布成功', icon: 'success' });
  },

  // 删除帖子
  deletePost: function(e) {
    const id = e.currentTarget.dataset.id;
    const that = this;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条帖子吗？删除后无法恢复。',
      success: function(res) {
        if (res.confirm) {
          // 从我的帖子删除
          let myPosts = that.data.myPosts.filter(post => post.id !== id);
          wx.setStorageSync('myPosts', myPosts);
          wx.setStorageSync('treeholeRecords', myPosts);
          
          // 从全部帖子删除
          let allPosts = that.data.posts.filter(post => post.id !== id);
          wx.setStorageSync('allPosts', allPosts);
          
          that.setData({
            myPosts: myPosts,
            posts: allPosts
          });
          
          wx.showToast({ title: '删除成功', icon: 'success' });
        }
      }
    });
  },

  // 打开编辑弹窗
  openEditModal: function(e) {
    const id = e.currentTarget.dataset.id;
    const post = this.data.myPosts.find(p => p.id === id);
    if (post) {
      this.setData({
        showEditModal: true,
        editingPost: post,
        editTitle: post.title,
        editContent: post.content
      });
    }
  },

  // 关闭编辑弹窗
  closeEditModal: function() {
    this.setData({
      showEditModal: false,
      editingPost: null,
      editTitle: '',
      editContent: ''
    });
  },

  // 编辑标题输入
  onEditTitleInput: function(e) {
    this.setData({ editTitle: e.detail.value });
  },

  // 编辑内容输入
  onEditContentInput: function(e) {
    this.setData({ editContent: e.detail.value });
  },

  // 保存修改
  saveEdit: function() {
    const { editingPost, editTitle, editContent } = this.data;
    
    if (!editTitle.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }
    
    if (!editContent.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }

    // 更新我的帖子
    let myPosts = this.data.myPosts.map(post => {
      if (post.id === editingPost.id) {
        return {
          ...post,
          title: editTitle.trim(),
          content: editContent.trim(),
          updateTime: this.formatTime(new Date())
        };
      }
      return post;
    });
    wx.setStorageSync('myPosts', myPosts);
    wx.setStorageSync('treeholeRecords', myPosts);

    // 更新全部帖子
    let allPosts = this.data.posts.map(post => {
      if (post.id === editingPost.id) {
        return {
          ...post,
          title: editTitle.trim(),
          content: editContent.trim(),
          updateTime: this.formatTime(new Date())
        };
      }
      return post;
    });
    wx.setStorageSync('allPosts', allPosts);
    
    this.setData({
      myPosts: myPosts,
      posts: allPosts,
      showEditModal: false,
      editingPost: null,
      editTitle: '',
      editContent: ''
    });
    
    wx.showToast({ title: '修改成功', icon: 'success' });
  },

  // 点赞（全部帖子）
  toggleLike: function(e) {
    const index = e.currentTarget.dataset.index;
    const posts = this.data.posts.map((post, i) => {
      if (i === index) {
        return { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 };
      }
      return post;
    });
    this.setData({ posts: posts });
    
    // 同步更新本地存储
    const postId = posts[index].id;
    let localPosts = wx.getStorageSync('allPosts') || [];
    localPosts = localPosts.map(p => p.id === postId ? posts[index] : p);
    wx.setStorageSync('allPosts', localPosts);
  },

  // 点赞（我的帖子）
  toggleLikeMy: function(e) {
    const index = e.currentTarget.dataset.index;
    const myPosts = this.data.myPosts.map((post, i) => {
      if (i === index) {
        return { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 };
      }
      return post;
    });
    this.setData({ myPosts: myPosts });
  },

  // 展开/收起评论（全部帖子）
  toggleComments: function(e) {
    const index = e.currentTarget.dataset.index;
    const posts = this.data.posts.map((post, i) => {
      if (i === index) {
        return { ...post, showComments: !post.showComments };
      }
      return post;
    });
    this.setData({ posts: posts });
  },

  // 展开/收起评论（我的帖子）
  toggleCommentsMy: function(e) {
    const index = e.currentTarget.dataset.index;
    const myPosts = this.data.myPosts.map((post, i) => {
      if (i === index) {
        return { ...post, showComments: !post.showComments };
      }
      return post;
    });
    this.setData({ myPosts: myPosts });
  },

  // 评论输入（全部帖子）
  commentInput: function(e) {
    this.setData({ commentText: e.detail.value });
  },

  // 发表评论（全部帖子）
  submitComment: function(e) {
    const index = e.currentTarget.dataset.index;
    const commentText = e.detail.value;
    
    if (!commentText || !commentText.trim()) {
      wx.showToast({ title: '请输入评论', icon: 'none' });
      return;
    }

    const newComment = {
      nickname: '匿名用户',
      content: commentText,
      time: this.formatTime(new Date())
    };

    const posts = this.data.posts.map((post, i) => {
      if (i === index) {
        return { 
          ...post, 
          commentsList: [...post.commentsList, newComment],
          comments: post.comments + 1
        };
      }
      return post;
    });
    
    this.setData({ posts: posts, commentText: '' });
    wx.showToast({ title: '评论成功', icon: 'success' });
  },

  // 评论输入（我的帖子）
  commentInputMy: function(e) {
    this.setData({ commentTextMy: e.detail.value });
  },

  // 发表评论（我的帖子）
  submitCommentMy: function(e) {
    const index = e.currentTarget.dataset.index;
    const commentText = e.detail.value;
    
    if (!commentText || !commentText.trim()) {
      wx.showToast({ title: '请输入评论', icon: 'none' });
      return;
    }

    const newComment = {
      nickname: '匿名用户',
      content: commentText,
      time: this.formatTime(new Date())
    };

    const myPosts = this.data.myPosts.map((post, i) => {
      if (i === index) {
        return { 
          ...post, 
          commentsList: [...post.commentsList, newComment],
          comments: post.comments + 1
        };
      }
      return post;
    });
    
    this.setData({ myPosts: myPosts, commentTextMy: '' });
    wx.showToast({ title: '评论成功', icon: 'success' });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.loadPosts();
    this.loadMyPosts();
    this.loadPendingPosts();
    wx.stopPullDownRefresh();
  },

  // 咨询师回复帖子
  counselorReply: function(e) {
    const index = e.currentTarget.dataset.index;
    const post = this.data.pendingPosts[index];
    
    wx.showModal({
      title: '回复帖子',
      editable: true,
      placeholderText: '请输入您的专业回复...',
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          const reply = {
            nickname: app.getUserInfo().nickName || '心理咨询师',
            content: res.content.trim(),
            time: this.formatTime(new Date()),
            isCounselorReply: true,
            avatar: '👨‍⚕️'
          };
          
          // 更新全部帖子
          let allPosts = wx.getStorageSync('allPosts') || [];
          allPosts = allPosts.map(p => {
            if (p.id === post.id) {
              return {
                ...p,
                commentsList: [...(p.commentsList || []), reply],
                comments: (p.comments || 0) + 1
              };
            }
            return p;
          });
          wx.setStorageSync('allPosts', allPosts);
          
          // 更新当前页面数据
          const posts = this.data.posts.map(p => {
            if (p.id === post.id) {
              return {
                ...p,
                commentsList: [...(p.commentsList || []), reply],
                comments: (p.comments || 0) + 1
              };
            }
            return p;
          });
          
          // 从待回复列表移除
          const pendingPosts = this.data.pendingPosts.filter(p => p.id !== post.id);
          
          this.setData({ posts, pendingPosts });
          
          wx.showToast({ title: '回复成功', icon: 'success' });
        }
      }
    });
  },

  // 咨询师回复全部帖子中的某一条
  counselorReplyAll: function(e) {
    const index = e.currentTarget.dataset.index;
    const post = this.data.posts[index];
    
    wx.showModal({
      title: '回复帖子',
      editable: true,
      placeholderText: '请输入您的专业回复...',
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          const reply = {
            nickname: app.getUserInfo().nickName || '心理咨询师',
            content: res.content.trim(),
            time: this.formatTime(new Date()),
            isCounselorReply: true,
            avatar: '👨‍⚕️'
          };
          
          // 更新全部帖子存储
          let allPosts = wx.getStorageSync('allPosts') || [];
          allPosts = allPosts.map(p => {
            if (p.id === post.id) {
              return {
                ...p,
                commentsList: [...(p.commentsList || []), reply],
                comments: (p.comments || 0) + 1
              };
            }
            return p;
          });
          wx.setStorageSync('allPosts', allPosts);
          
          // 更新页面数据
          const posts = this.data.posts.map((p, i) => {
            if (i === index) {
              return {
                ...p,
                commentsList: [...(p.commentsList || []), reply],
                comments: (p.comments || 0) + 1
              };
            }
            return p;
          });
          
          this.setData({ posts });
          wx.showToast({ title: '回复成功', icon: 'success' });
        }
      }
    });
  },

  // 删除帖子（咨询师可以删除任何帖子）
  counselorDeletePost: function(e) {
    const id = e.currentTarget.dataset.id;
    const that = this;
    
    wx.showModal({
      title: '删除帖子',
      content: '确定要删除这条帖子吗？',
      success: function(res) {
        if (res.confirm) {
          // 从全部帖子删除
          let allPosts = wx.getStorageSync('allPosts') || [];
          allPosts = allPosts.filter(p => p.id !== id);
          wx.setStorageSync('allPosts', allPosts);
          
          // 更新页面
          const posts = that.data.posts.filter(p => p.id !== id);
          const pendingPosts = that.data.pendingPosts.filter(p => p.id !== id);
          
          that.setData({ posts, pendingPosts });
          wx.showToast({ title: '删除成功', icon: 'success' });
        }
      }
    });
  }
});
