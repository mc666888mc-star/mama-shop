const api = require('../../utils/api');
const cart = require('../../utils/cart');
const { yuan } = require('../../utils/format');

Page({
  data: {
    items: [], total: 0, totalText: '0', count: 0,
    address: null, remark: '', submitting: false,
    sheet: false, form: { name: '', phone: '', detail: '' },
    payMode: 'transfer'
  },
  onLoad() {
    const app = getApp();
    const co = app.globalData.checkout;
    if (!co || !co.items || !co.items.length) { wx.navigateBack(); return; }
    this.co = co;
    const items = co.items.map((i) => Object.assign({}, i, { priceText: yuan(i.price) }));
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    this.setData({
      items, total, totalText: yuan(total),
      count: items.reduce((s, i) => s + i.qty, 0),
      payMode: app.globalData.payMode
    });
    api.getAddress().then((a) => { if (a) this.setData({ address: a }); }).catch(() => {});
  },

  // ---- 收货地址 ----
  openSheet() {
    const a = this.data.address;
    this.setData({ sheet: true, form: a ? { name: a.name, phone: a.phone, detail: a.detail } : { name: '', phone: '', detail: '' } });
  },
  closeSheet() { this.setData({ sheet: false }); },
  onField(e) { this.setData({ ['form.' + e.currentTarget.dataset.k]: e.detail.value }); },
  // 一键从微信里的收货地址导入（部分账号类型可能不可用，失败就手动填）
  importWx() {
    wx.chooseAddress({
      success: (r) => {
        this.setData({ form: { name: r.userName || '', phone: r.telNumber || '', detail: (r.provinceName || '') + (r.cityName || '') + (r.countyName || '') + (r.detailInfo || '') } });
      },
      fail: (err) => {
        if (err && /cancel/.test(err.errMsg || '')) return;
        wx.showToast({ title: '导入不了，请手动填写', icon: 'none' });
      }
    });
  },
  saveAddress() {
    const f = this.data.form;
    const name = (f.name || '').trim(); const phone = (f.phone || '').trim(); const detail = (f.detail || '').trim();
    if (!name) return wx.showToast({ title: '请填写收货人姓名', icon: 'none' });
    if (!/^1\d{10}$/.test(phone)) return wx.showToast({ title: '请填写 11 位手机号', icon: 'none' });
    if (detail.length < 5) return wx.showToast({ title: '请把收货地址写详细一点', icon: 'none' });
    const a = { name, phone, detail };
    this.setData({ address: a, sheet: false });
    api.saveAddress(a).catch(() => {}); // 保存为常用地址，失败不影响本次下单
  },

  onRemark(e) { this.setData({ remark: e.detail.value }); },

  // ---- 提交订单 ----
  submit() {
    if (this.data.submitting) return;
    if (!this.data.address) {
      wx.showToast({ title: '先填一下收货地址', icon: 'none' });
      this.openSheet();
      return;
    }
    this.setData({ submitting: true });
    wx.showLoading({ title: '正在下单', mask: true });
    api.createOrder({
      items: this.data.items.map((i) => ({ productId: i.productId, qty: i.qty })), // 只传商品和数量，价格以服务端为准
      address: this.data.address,
      remark: this.data.remark.trim()
    }).then((order) => {
      wx.hideLoading();
      if (this.co.fromCart) cart.remove(this.data.items.map((i) => i.productId));
      getApp().globalData.checkout = null;
      wx.redirectTo({ url: '/pages/pay/index?id=' + order._id });
    }).catch((err) => {
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.showModal({ title: '没能下单', content: (err && err.message) || '请稍后再试', showCancel: false, confirmText: '知道了' });
    });
  }
});
