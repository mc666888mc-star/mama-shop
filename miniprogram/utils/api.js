// 前端统一的数据入口。页面只调用这里的方法，不直接碰云开发。
//   config.envId 为空 → 演示模式（utils/mock.js）
//   config.envId 有值 → 调云函数 shop（接口约定见 docs/对接说明.md）
const config = require('./config');
const mock = require('./mock');

function callFn(name, data) {
  return wx.cloud.callFunction({ name, data }).then((r) => {
    const res = r.result || {};
    if (res.ok === false) throw new Error(res.msg || '操作失败，请稍后再试');
    return res.data;
  });
}
const A = (action, data) => callFn('shop', Object.assign({ action }, data || {}));

const cloud = {
  login: () => A('login'),
  listProducts: () => A('listProducts'),
  getProduct: (id) => A('getProduct', { id }),
  getAddress: () => A('getAddress'),
  saveAddress: (addr) => A('saveAddress', { addr }),
  createOrder: (o) => A('createOrder', o), // { items:[{productId,qty}], address, remark }
  listOrders: () => A('listOrders'),
  getOrder: (id) => A('getOrder', { id }),
  prepay: (orderId) => callFn('orderPrepay', { orderId }), // 二期：返回 wx.requestPayment 所需参数
  adminListOrders: () => A('adminListOrders'),
  adminOrderAction: (id, action, expressNo) => A('adminOrderAction', { id, action, expressNo }),
  adminListProducts: () => A('adminListProducts'),
  adminSaveProduct: (product) => A('adminSaveProduct', { product }),
  adminSetOnSale: (id, onSale) => A('adminSetOnSale', { id, onSale }),
  uploadImage: (filePath) => new Promise((resolve, reject) => {
    const up = (src) => wx.cloud.uploadFile({
      cloudPath: 'products/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.jpg',
      filePath: src
    }).then((r) => resolve(r.fileID)).catch(reject);
    // 妈妈手机拍的照片动辄 3~5MB，先压一下再传
    wx.compressImage({ src: filePath, quality: 60, success: (r) => up(r.tempFilePath), fail: () => up(filePath) });
  })
};

// 逐个方法转发，页面里 api.xxx() 的写法不用关心当前是演示模式还是云端
const api = {};
Object.keys(cloud).forEach((k) => {
  api[k] = function () {
    const impl = config.envId ? cloud : mock;
    return impl[k].apply(impl, arguments);
  };
});
module.exports = api;
