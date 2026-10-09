const api = require('../../utils/api');
const cart = require('../../utils/cart');
const { yuan } = require('../../utils/format');
const { syncTab } = require('../../utils/tab');

Page({
  data: { scrolled: false, items: [], allChecked: false, count: 0, total: 0, totalText: '0' },
  onShow() {
    syncTab(this, 1);
    this.build(cart.list());                       // 先用本地数据立刻出画面
    api.listProducts().then((list) => this.build(cart.sync(list))).catch(() => {}); // 再按最新价格/库存校正
  },
  onPullDownRefresh() {
    api.listProducts().then((list) => this.build(cart.sync(list))).catch(() => {}).then(() => wx.stopPullDownRefresh());
  },
  onPageScroll(e) {
    const s = e.scrollTop > 56;
    if (s !== this.data.scrolled) this.setData({ scrolled: s });
  },
  // 把存储里的购物车转成展示数据，并保留之前的勾选状态
  build(list) {
    const prev = this.checked || {};
    const items = list.map((i) => {
      const checked = i.invalid ? false : (prev[i.productId] === undefined ? true : prev[i.productId]);
      return Object.assign({}, i, { checked, priceText: yuan(i.price) });
    });
    this.checked = {};
    items.forEach((i) => { this.checked[i.productId] = i.checked; });
    this.setData({ items });
    this.sum();
  },
  sum() {
    const sel = this.data.items.filter((i) => i.checked && !i.invalid);
    const valid = this.data.items.filter((i) => !i.invalid);
    const total = sel.reduce((s, i) => s + i.price * i.qty, 0);
    this.setData({
      count: sel.reduce((s, i) => s + i.qty, 0),
      total, totalText: yuan(total),
      allChecked: valid.length > 0 && sel.length === valid.length
    });
  },
  toggle(e) {
    const id = e.currentTarget.dataset.id;
    const items = this.data.items.map((i) => (i.productId === id && !i.invalid ? Object.assign({}, i, { checked: !i.checked }) : i));
    this.checked[id] = !this.checked[id];
    this.setData({ items });
    this.sum();
  },
  toggleAll() {
    const to = !this.data.allChecked;
    const items = this.data.items.map((i) => Object.assign({}, i, { checked: i.invalid ? false : to }));
    items.forEach((i) => { this.checked[i.productId] = i.checked; });
    this.setData({ items });
    this.sum();
  },
  onQty(e) {
    cart.setQty(e.currentTarget.dataset.id, e.detail.value);
    this.build(cart.list());
    syncTab(this, 1);
  },
  onUnder(e) {
    const id = e.currentTarget.dataset.id;
    const it = this.data.items.find((i) => i.productId === id);
    wx.showModal({
      title: '移出购物车？', content: '「' + (it ? it.name : '') + '」', confirmText: '移除', confirmColor: '#FF3B30', cancelText: '留着',
      success: (r) => { if (r.confirm) this.remove({ currentTarget: { dataset: { id } } }); }
    });
  },
  remove(e) {
    cart.remove(e.currentTarget.dataset.id);
    this.build(cart.list());
    syncTab(this, 1);
  },
  open(e) { wx.navigateTo({ url: '/pages/detail/index?id=' + e.currentTarget.dataset.id }); },
  goHome() { wx.switchTab({ url: '/pages/home/index' }); },
  checkout() {
    const sel = this.data.items.filter((i) => i.checked && !i.invalid);
    if (!sel.length) return;
    getApp().globalData.checkout = {
      fromCart: true,
      items: sel.map((i) => ({ productId: i.productId, name: i.name, price: i.price, qty: i.qty, image: i.image, emoji: i.emoji, tone: i.tone }))
    };
    wx.navigateTo({ url: '/pages/checkout/index' });
  }
});
