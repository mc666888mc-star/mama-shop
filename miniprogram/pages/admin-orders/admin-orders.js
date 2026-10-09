// pages/admin-orders/admin-orders.js（妈妈用：新订单置顶，点一下按钮订单就往下走）
const app = getApp();

Page({
  data: { orders: [], todayCount: 0, todaySales: '0.00' },
  onShow() { this.load(); },

  async load() {
    const list = await app.call('orderList', { admin: true });
    const orders = (list || []).map(o => ({
      ...o,
      totalText: (o.total / 100).toFixed(2),
      summary: o.items.map(i => `${i.name}×${i.qty}`).join('、'),
    }));
    const today = new Date().toISOString().slice(0, 10);
    const todays = orders.filter(o => (o.createTime || '').slice(0, 10) === today);
    this.setData({
      orders,
      todayCount: todays.length,
      todaySales: (todays.reduce((s, o) => s + o.total, 0) / 100).toFixed(2),
    });
  },

  async setStatus(id, status, extra = {}) {
    await app.call('orderUpdateStatus', { id, status, ...extra });
    this.load();
  },

  confirmPaid(e) { this.setStatus(e.currentTarget.dataset.id, 1); },

  ship(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '发货',
      content: '快递单号填一下（同城自提可不填）',
      editable: true,
      success: (res) => {
        if (res.confirm) this.setStatus(id, 2, { expressNo: res.content || '' });
      },
    });
  },

  complete(e) { this.setStatus(e.currentTarget.dataset.id, 3); },
});
