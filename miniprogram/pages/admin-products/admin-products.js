// pages/admin-products/admin-products.js（妈妈用：字大、按钮大、一次只做一件事）
const app = getApp();

Page({
  data: { products: [] },
  onShow() { this.load(); },

  async load() {
    const list = await app.call('productList', { admin: true });
    this.setData({ products: (list || []).map(p => ({ ...p, priceText: (p.price / 100).toFixed(2) })) });
  },

  async toggleSale(e) {
    await app.call('productToggleSale', { id: e.currentTarget.dataset.id });
    this.load();
  },

  // 新增/编辑：用最简单的表单页（后续由 Claude/GPT 美化），先保证能用
  addProduct() {
    wx.showModal({
      title: '上架商品',
      content: '先在"商品名称、价格"两项填好，图片后续版本支持手机拍照上传',
      showCancel: false,
    });
  },
  editProduct() {
    wx.showModal({ title: '改价格', content: '后续版本支持', showCancel: false });
  },
});
