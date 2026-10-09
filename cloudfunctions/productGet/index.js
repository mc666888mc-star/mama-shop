// cloudfunctions/productGet/index.js - 商品详情
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { id } = event;
  if (!id) return { code: 1, msg: '缺少商品 id' };
  const res = await db.collection('products').doc(id).get();
  if (!res.data) return { code: 1, msg: '商品不存在' };
  return { code: 0, data: res.data, msg: 'ok' };
};
