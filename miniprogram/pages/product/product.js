// pages/product/product.js
const app = getApp();

Page({
  data: { product: null },

  onLoad(options) { this.loadDetail(options.id); },

  async loadDetail(id) {
    const p = await app.call('productGet', { id });
    this.setData({ product: { ...p, priceText: (p.price / 100).toFixed(2) } });
  },

  buyNow() {
    const { product } = this.data;
    wx.navigateTo({ url: `/pages/checkout/checkout?id=${product._id}&qty=1` });
  },
});
