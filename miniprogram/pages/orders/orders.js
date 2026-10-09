// pages/orders/orders.js
const app = getApp();

Page({
  data: { tab: 0, orders: [] },

  onShow() { this.loadOrders(); },

  switchTab(e) {
    this.setData({ tab: parseInt(e.currentTarget.dataset.i, 10) });
    this.loadOrders();
  },

  async loadOrders() {
    const list = await app.call('orderList', { status: this.data.tab });
    this.setData({
      orders: (list || []).map(o => ({
        ...o,
        totalText: (o.total / 100).toFixed(2),
        summary: o.items.map(i => `${i.name}×${i.qty}`).join('、'),
      })),
    });
  },
});
