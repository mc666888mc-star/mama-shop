const config = require('./utils/config');
const api = require('./utils/api');

App({
  globalData: {
    payMode: config.payMode, // 'transfer' 微信转账 | 'wxpay' 微信支付（二期切换这里即可）
    user: null,
    checkout: null // 下单页的商品清单，由详情页/购物车写入
  },
  onLaunch() {
    if (config.envId && wx.cloud) {
      wx.cloud.init({ env: config.envId, traceUser: true });
    }
    this.userReady = api.login()
      .then((u) => { this.globalData.user = u; return u; })
      .catch(() => { const u = { isAdmin: false }; this.globalData.user = u; return u; });
  }
});
