// 妈妈小店 · 集中配置（交接时只需要改这一个文件）
module.exports = {
  shopName: '妈妈小店',
  slogan: '街坊邻居都在买的日用好物',

  // 云开发环境 ID。留空 = 演示模式（数据存在手机本地，下单、后台流程都能完整体验）
  envId: '',

  // 支付模式：'transfer' 微信转账（一期） | 'wxpay' 微信支付（二期，需个体工商户 + 商户号）
  payMode: 'transfer',

  // 妈妈的联系方式：买家“联系卖家”和付款页会用到，留空则不显示对应入口
  contact: { phone: '', wechat: '' },

  // 演示模式下，是否显示“妈妈后台”入口（正式环境以 users.isAdmin 为准，这项无效）
  demoAdmin: true
};
