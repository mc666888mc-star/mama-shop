// 自定义导航栏：玻璃导航（bar）/ 悬浮返回按钮（float，用于详情页大图之上）
Component({
  properties: {
    title: { type: String, value: '' },
    subtitle: { type: String, value: '' },
    mode: { type: String, value: 'bar' },       // bar | float
    back: { type: Boolean, value: false },
    large: { type: Boolean, value: false },     // 大标题（苹果式：页面顶部大字，滚动后收成小标题）
    glass: { type: Boolean, value: true },      // 是否显示玻璃底（大标题页在顶部时关掉，滚动后打开）
    titleShow: { type: Boolean, value: true },  // 小标题是否显示
    solid: { type: Boolean, value: false }      // 妈妈后台：纯白实底，不用玻璃
  },
  data: { statusH: 20, barH: 44, totalH: 64, floatTop: 28 },
  lifetimes: {
    attached() {
      let statusH = 20;
      try {
        const w = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
        statusH = w.statusBarHeight || 20;
      } catch (e) {}
      let barH = 44;
      try {
        const m = wx.getMenuButtonBoundingClientRect();
        if (m && m.height) barH = (m.top - statusH) * 2 + m.height;
      } catch (e) {}
      this.setData({ statusH, barH, totalH: statusH + barH, floatTop: statusH + (barH - 36) / 2 });
    }
  },
  methods: {
    onBack() {
      if (getCurrentPages().length > 1) wx.navigateBack();
      else wx.switchTab({ url: '/pages/home/index' });
    }
  }
});
