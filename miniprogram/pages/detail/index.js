const api = require('../../utils/api');
const cart = require('../../utils/cart');
const { yuan } = require('../../utils/format');

function deco(p) {
  const imgs = (p.images || []).filter(Boolean);
  return Object.assign({}, p, {
    priceText: yuan(p.price), imgs, cover: imgs[0] || '',
    soldOut: !(p.stock > 0), offShelf: p.onSale === false,
    lowStock: p.stock > 0 && p.stock <= 10
  });
}

Page({
  data: { loading: true, p: null, qty: 1, cartCount: 0, current: 0 },
  onLoad(q) {
    api.getProduct(q.id)
      .then((p) => this.setData({ loading: false, p: deco(p) }))
      .catch(() => this.setData({ loading: false, p: null }));
  },
  onShow() { this.setData({ cartCount: cart.count() }); },
  onSwipe(e) { this.setData({ current: e.detail.current }); },
  preview(e) {
    const imgs = this.data.p.imgs;
    wx.previewImage({ urls: imgs, current: imgs[e.currentTarget.dataset.i] });
  },
  onQty(e) { this.setData({ qty: e.detail.value }); },
  canBuy() { const p = this.data.p; return p && !p.soldOut && !p.offShelf; },
  addCart() {
    if (!this.canBuy()) return;
    cart.add(this.data.p, this.data.qty);
    this.setData({ cartCount: cart.count() });
    wx.vibrateShort({ type: 'light' });
    wx.showToast({ title: '已加入购物车', icon: 'success' });
  },
  buyNow() {
    if (!this.canBuy()) return;
    const p = this.data.p;
    getApp().globalData.checkout = {
      fromCart: false,
      items: [{ productId: p._id, name: p.name, price: p.price, qty: this.data.qty, image: p.cover, emoji: p.emoji || '', tone: p.tone }]
    };
    wx.navigateTo({ url: '/pages/checkout/index' });
  },
  goCart() { wx.switchTab({ url: '/pages/cart/index' }); },
  goHome() { wx.switchTab({ url: '/pages/home/index' }); }
});
