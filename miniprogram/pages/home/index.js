const api = require('../../utils/api');
const config = require('../../utils/config');
const cart = require('../../utils/cart');
const { yuan } = require('../../utils/format');
const { syncTab } = require('../../utils/tab');

function deco(p) {
  return Object.assign({}, p, { priceText: yuan(p.price), cover: (p.images && p.images[0]) || '', soldOut: !(p.stock > 0) });
}

Page({
  data: {
    shopName: config.shopName, slogan: config.slogan,
    loading: true, error: false, scrolled: false,
    keyword: '', hero: null, rest: []
  },
  onLoad() { this.load(); },
  onShow() { syncTab(this, 0); },
  onPullDownRefresh() { this.load().then(() => wx.stopPullDownRefresh()); },
  onPageScroll(e) {
    const s = e.scrollTop > 56;
    if (s !== this.data.scrolled) this.setData({ scrolled: s });
  },
  load() {
    return api.listProducts().then((list) => {
      this.all = list.map(deco);
      this.setData({ loading: false, error: false });
      this.apply();
    }).catch(() => { this.setData({ loading: false, error: true }); });
  },
  retry() { this.setData({ loading: true, error: false }); this.load(); },
  // 商品很少，搜索直接在本地筛，输入即出结果
  apply() {
    const kw = this.data.keyword.trim().toLowerCase();
    let list = this.all || [];
    if (kw) {
      list = list.filter((p) => (p.name + (p.desc || '')).toLowerCase().indexOf(kw) >= 0);
      this.setData({ hero: null, rest: list });
    } else {
      this.setData({ hero: list[0] || null, rest: list.slice(1) });
    }
  },
  onInput(e) { this.setData({ keyword: e.detail.value }); this.apply(); },
  clearKw() { this.setData({ keyword: '' }); this.apply(); },
  open(e) { wx.navigateTo({ url: '/pages/detail/index?id=' + e.currentTarget.dataset.id }); },
  quickAdd(e) {
    const p = (this.all || []).find((x) => x._id === e.currentTarget.dataset.id);
    if (!p || p.soldOut) return;
    cart.add(p, 1);
    syncTab(this, 0);
    wx.vibrateShort({ type: 'light' });
    wx.showToast({ title: '已加入购物车', icon: 'success' });
  }
});
