// pages/checkout/checkout.js
// 支付模式说明：
// - 一期（开发期/个人主体，无微信支付商户号）：payMode='transfer'，
//   下单后提示买家微信转账给妈妈并备注订单号，妈妈在后台点"确认收款"。
// - 二期（上线：个体工商户主体 + 微信支付商户号）：payMode='wxpay'，
//   走 pay() 里的 wx.requestPayment，参数由云函数 orderPrepay 统一下单返回。
//   前端流程不变，只需把 globalData.payMode 切到 'wxpay' 并实现云函数。
const app = getApp();

Page({
  data: { product: null, qty: 1, name: '', phone: '', detail: '', note: '', totalText: '0.00' },

  async onLoad(options) {
    const p = await app.call('productGet', { id: options.id });
    const qty = parseInt(options.qty || '1', 10);
    this.setData({
      product: p, qty,
      totalText: ((p.price * qty) / 100).toFixed(2),
    });
  },

  onName(e) { this.setData({ name: e.detail.value }); },
  onPhone(e) { this.setData({ phone: e.detail.value }); },
  onDetail(e) { this.setData({ detail: e.detail.value }); },
  onNote(e) { this.setData({ note: e.detail.value }); },

  async submitOrder() {
    const { product, qty, name, phone, detail, note } = this.data;
    if (!name || !phone || !detail) {
      wx.showToast({ title: '请填好收货信息', icon: 'none' });
      return;
    }
    const order = await app.call('orderCreate', {
      items: [{ productId: product._id, qty }],
      address: { name, phone, detail }, note,
    });
    if (app.globalData.payMode === 'wxpay') {
      await this.pay(order._id);
    } else {
      // 一期：转账占位。订单号展示给买家，备注用。
      wx.showModal({
        title: '下单成功',
        content: `订单号 ${order._id}\n请微信转账给妈妈并备注订单号，妈妈确认后发货`,
        showCancel: false,
        success: () => wx.switchTab({ url: '/pages/orders/orders' }),
      });
    }
  },

  // 二期微信支付：云函数 orderPrepay 返回统一下单参数，前端调起支付
  async pay(orderId) {
    const payParams = await app.call('orderPrepay', { orderId }); // TODO: 二期实现该云函数
    await new Promise((resolve, reject) => {
      wx.requestPayment({ ...payParams, success: resolve, fail: reject });
    });
    wx.switchTab({ url: '/pages/orders/orders' });
  },
});
