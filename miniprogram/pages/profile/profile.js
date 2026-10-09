// pages/profile/profile.js
const app = getApp();

Page({
  data: { isAdmin: false },
  onShow() { this.setData({ isAdmin: app.globalData.isAdmin }); },
  goOrders() { wx.switchTab({ url: '/pages/orders/orders' }); },
  contact() {
    wx.showModal({ title: '联系卖家', content: '直接微信找妈妈下单也行', showCancel: false });
  },
  goAdminProducts() { wx.navigateTo({ url: '/pages/admin-products/admin-products' }); },
  goAdminOrders() { wx.navigateTo({ url: '/pages/admin-orders/admin-orders' }); },
});
