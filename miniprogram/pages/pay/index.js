const api = require('../../utils/api');
const config = require('../../utils/config');
const { yuan } = require('../../utils/format');

Page({
  data: { loading: true, order: null, totalText: '0', payMode: 'transfer', contact: config.contact, hasContact: false, paying: false },
  onLoad(q) {
    this.id = q.id;
    const c = config.contact || {};
    this.setData({ payMode: getApp().globalData.payMode, hasContact: !!(c.phone || c.wechat) });
    api.getOrder(q.id)
      .then((o) => this.setData({ loading: false, order: o, totalText: yuan(o.total) }))
      .catch(() => this.setData({ loading: false, order: null }));
  },
  copyNo() { wx.setClipboardData({ data: this.data.order.orderNo }); },
  contactSeller() {
    const c = config.contact || {};
    const list = []; const act = [];
    if (c.phone) { list.push('拨打电话 ' + c.phone); act.push(() => wx.makePhoneCall({ phoneNumber: c.phone })); }
    if (c.wechat) { list.push('复制微信号 ' + c.wechat); act.push(() => wx.setClipboardData({ data: c.wechat })); }
    wx.showActionSheet({ itemList: list, success: (r) => act[r.tapIndex]() });
  },
  // 一期：转账完成后点这里，回到订单页，等妈妈确认收款
  done() { wx.switchTab({ url: '/pages/orders/index' }); },
  // 二期：微信支付
  pay() {
    if (this.data.paying) return;
    this.setData({ paying: true });
    api.prepay(this.id).then((p) => new Promise((resolve, reject) => {
      wx.requestPayment({
        timeStamp: p.timeStamp, nonceStr: p.nonceStr, package: p.package, signType: p.signType, paySign: p.paySign,
        success: resolve, fail: reject
      });
    })).then(() => {
      wx.showToast({ title: '支付成功', icon: 'success' });
      setTimeout(() => wx.switchTab({ url: '/pages/orders/index' }), 800);
    }).catch((err) => {
      this.setData({ paying: false });
      const cancelled = err && /cancel/.test(err.errMsg || '');
      wx.showToast({ title: cancelled ? '已取消，可在订单里继续付款' : ((err && err.message) || '支付没有成功'), icon: 'none' });
    });
  }
});
