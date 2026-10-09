// cloudfunctions/orderPrepay/index.js - 微信支付统一下单（占位）
// 上线条件（缺一不可）：
// 1. 小程序主体为个体工商户（个人主体开不了微信支付，这是微信硬规矩）
// 2. 已开通微信支付商户号，拿到商户号 + APIv3 密钥 + 证书
// 实现时在此函数内调用微信支付 APIv3 统一下单（JSAPI），
// 返回 { timeStamp, nonceStr, package, signType, paySign} 给前端 wx.requestPayment。
// 商户密钥/证书走云函数环境变量配置，绝不写进代码、绝不进仓库。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV});

exports.main = async () => {
return { code: 1, msg: '二期功能：请先完成个体户主体 + 微信支付商户号配置'};
};
