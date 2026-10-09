// pages/home/home.js
const app = getApp();

Page({
  data: { products: [], keyword: '' },

  onShow() { this.loadProducts(); },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
    this.loadProducts();
  },

  async loadProducts() {
    try {
      const list = await app.call('productList', { keyword: this.data.keyword });
      this.setData({
        products: (list || []).map(p => ({ ...p, priceText: (p.price / 100).toFixed(2) })),
      });
    } catch (e) { /* app.call 已 toast */ }
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/product/product?id=${e.currentTarget.dataset.id}` });
  },
});
