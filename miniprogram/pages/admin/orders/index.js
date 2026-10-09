const api = require('../../../utils/api');
const guard = require('../../../utils/guard');
const { decorateOrder, isToday, yuan } = require('../../../utils/format');

// 每个状态下，妈妈只需要点一个按钮
const ACTION = { 0: { act: 'confirmPaid', text: '确认收款' }, 1: { act: 'ship', text: '发货' }, 2: { act: 'complete', text: '完成' } };

Page({
  data: { loading: true, orders: [], todayCount: 0, todaySales: '0', sheet: false, express: '' },
  onShow() { guard().then((ok) => { if (ok) this.load(); }); },
  onPullDownRefresh() { this.load().then(() => wx.stopPullDownRefresh()); },
  load() {
    return api.adminListOrders().then((raw) => {
      // 没处理完的排前面（新的在最上），已完成的沉到后面
      const list = raw.map((o) => {
        const d = decorateOrder(o);
        const a = ACTION[o.status];
        return Object.assign(d, { action: a ? a.act : '', actionText: a ? a.text : '' });
      });
      const open = list.filter((o) => o.status < 3).sort((a, b) => b.createTime - a.createTime);
      const done = list.filter((o) => o.status === 3).sort((a, b) => b.createTime - a.createTime);
      const today = raw.filter((o) => isToday(o.createTime));
      const sales = today.filter((o) => o.status >= 1).reduce((s, o) => s + o.total, 0);
      this.setData({ loading: false, orders: open.concat(done), todayCount: today.length, todaySales: yuan(sales) });
    }).catch((err) => {
      this.setData({ loading: false });
      wx.showToast({ title: (err && err.message) || '加载失败，请下拉刷新', icon: 'none' });
    });
  },
  call(e) { wx.makePhoneCall({ phoneNumber: e.currentTarget.dataset.phone }); },

  onAction(e) {
    const { id, act } = e.currentTarget.dataset;
    const o = this.data.orders.find((x) => x._id === id);
    if (!o) return;
    if (act === 'confirmPaid') {
      wx.showModal({
        title: '确认收款', content: '确认已经收到 ¥' + o.totalText + ' 的转账了吗？\n订单号 ' + o.orderNo, confirmText: '已收到', cancelText: '再看看',
        success: (r) => { if (r.confirm) this.run(id, act, '', '已确认收款'); }
      });
    } else if (act === 'ship') {
      this.shipId = id;
      this.setData({ sheet: true, express: '' });
    } else if (act === 'complete') {
      wx.showModal({
        title: '完成订单', content: '这一单已经送到买家手里了吗？', confirmText: '已送到', cancelText: '还没有',
        success: (r) => { if (r.confirm) this.run(id, act, '', '订单已完成'); }
      });
    }
  },
  // 发货弹层
  closeSheet() { this.setData({ sheet: false }); },
  onExpress(e) { this.setData({ express: e.detail.value }); },
  pick(e) { this.setData({ express: e.currentTarget.dataset.v }); },
  confirmShip() {
    const v = this.data.express.trim();
    if (!v) { wx.showToast({ title: '请填快递单号，或点下面的选项', icon: 'none' }); return; }
    this.setData({ sheet: false });
    this.run(this.shipId, 'ship', v, '已发货');
  },
  run(id, act, expressNo, okText) {
    wx.showLoading({ title: '处理中', mask: true });
    api.adminOrderAction(id, act, expressNo).then(() => {
      wx.hideLoading();
      wx.showToast({ title: okText, icon: 'success' });
      return this.load();
    }).catch((err) => {
      wx.hideLoading();
      wx.showModal({ title: '没成功', content: (err && err.message) || '请稍后再试', showCancel: false, confirmText: '知道了' });
      this.load();
    });
  }
});
