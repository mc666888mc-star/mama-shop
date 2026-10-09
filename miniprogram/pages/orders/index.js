const api = require('../../utils/api');
const { decorateOrder } = require('../../utils/format');
const { syncTab } = require('../../utils/tab');

Page({
  data: { scrolled: false, tabs: ['全部', '待付款', '待发货', '已发货', '已完成'], cur: 0, loading: true, error: false, list: [] },
  onShow() { syncTab(this, 2); this.load(); },
  onPullDownRefresh() { this.load().then(() => wx.stopPullDownRefresh()); },
  onPageScroll(e) {
    const s = e.scrollTop > 56;
    if (s !== this.data.scrolled) this.setData({ scrolled: s });
  },
  load() {
    return api.listOrders().then((l) => {
      this.all = l.map(decorateOrder);
      this.setData({ loading: false, error: false });
      this.filter();
    }).catch(() => this.setData({ loading: false, error: true }));
  },
  filter() {
    const cur = this.data.cur;
    const all = this.all || [];
    this.setData({ list: cur === 0 ? all : all.filter((o) => o.status === cur - 1) });
  },
  onTab(e) { this.setData({ cur: e.currentTarget.dataset.i }); this.filter(); },
  pay(e) { wx.navigateTo({ url: '/pages/pay/index?id=' + e.currentTarget.dataset.id }); },
  copy(e) { wx.setClipboardData({ data: e.currentTarget.dataset.t }); },
  goHome() { wx.switchTab({ url: '/pages/home/index' }); }
});
