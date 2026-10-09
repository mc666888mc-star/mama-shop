// 悬浮玻璃胶囊 tabBar（苹果新系统那种浮在内容上的样式）
Component({
  data: {
    selected: 0,
    cartCount: 0,
    list: [
      { path: '/pages/home/index', text: '首页', icon: 'home' },
      { path: '/pages/cart/index', text: '购物车', icon: 'cart' },
      { path: '/pages/orders/index', text: '订单', icon: 'receipt' },
      { path: '/pages/mine/index', text: '我的', icon: 'user' }
    ]
  },
  methods: {
    go(e) {
      const i = e.currentTarget.dataset.i;
      if (i === this.data.selected) return;
      wx.switchTab({ url: this.data.list[i].path });
    }
  }
});
