const api = require('../../utils/api');
const config = require('../../utils/config');
const { syncTab } = require('../../utils/tab');

Page({
  data: { scrolled: false, shopName: config.shopName, isAdmin: false, todo: 0 },
  onShow() {
    syncTab(this, 3);
    getApp().userReady.then((u) => {
      this.setData({ isAdmin: !!(u && u.isAdmin) });
      if (u && u.isAdmin) {
        // 妈妈入口上显示“还有几单要处理”
        api.adminListOrders().then((l) => this.setData({ todo: l.filter((o) => o.status < 3).length })).catch(() => {});
      }
    });
  },
  onPageScroll(e) {
    const s = e.scrollTop > 56;
    if (s !== this.data.scrolled) this.setData({ scrolled: s });
  },
  goOrders() { wx.switchTab({ url: '/pages/orders/index' }); },
  goAdminOrders() { wx.navigateTo({ url: '/pages/admin/orders/index' }); },
  goAdminProducts() { wx.navigateTo({ url: '/pages/admin/products/index' }); },
  contact() {
    const c = config.contact || {};
    const list = []; const act = [];
    if (c.phone) { list.push('拨打电话 ' + c.phone); act.push(() => wx.makePhoneCall({ phoneNumber: c.phone })); }
    if (c.wechat) { list.push('复制微信号 ' + c.wechat); act.push(() => wx.setClipboardData({ data: c.wechat })); }
    if (!list.length) {
      wx.showModal({ title: '联系卖家', content: '卖家暂时还没有留下联系方式。', showCancel: false, confirmText: '知道了' });
      return;
    }
    wx.showActionSheet({ itemList: list, success: (r) => act[r.tapIndex]() });
  }
});
