// app.js - 应用入口
// 云环境 ID 上线前填入：从微信云开发控制台复制
const CLOUD_ENV_ID = ''; // TODO: 填入云环境 ID，如 'mama-shop-xxx'

App({
  globalData: {
    openid: '',
    isAdmin: false,
    // 支付模式：一期 'transfer'（微信转账备注订单号，占位）；
    // 二期上线（个体户主体+微信支付商户号）切换为 'wxpay'，调用 wx.requestPayment
    payMode: 'transfer',
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error('微信基础库过低，请升级微信');
      return;
    }
    wx.cloud.init({
      env: CLOUD_ENV_ID || undefined,
      traceUser: true,
    });
    this.login();
  },

  // 登录：拿 openid，判断是否为管理员（妈妈）
  async login() {
    try {
      const res = await wx.cloud.callFunction({ name: 'login', data: {} });
      const { openid, isAdmin } = res.result.data || {};
      this.globalData.openid = openid || '';
      this.globalData.isAdmin = !!isAdmin;
    } catch (e) {
      console.error('login 云函数调用失败', e);
    }
  },

  // 统一云函数调用：约定返回 { code, data, msg }，code 非 0 弹 toast
  async call(name, data = {}) {
    const res = await wx.cloud.callFunction({ name, data });
    const r = res.result || {};
    if (r.code !== 0) {
      wx.showToast({ title: r.msg || '出错了', icon: 'none' });
      throw new Error(r.msg || 'cloud function error');
    }
    return r.data;
  },
});
