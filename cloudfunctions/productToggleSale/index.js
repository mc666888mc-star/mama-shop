// cloudfunctions/productToggleSale/index.js - 上架/下架（仅管理员）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const ADMIN_OPENIDS = [
  // '妈妈的openid填这里',
];

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  if (!ADMIN_OPENIDS.includes(OPENID)) return { code: 403, msg: '没有权限' };
  const { id } = event;
  if (!id) return { code: 1, msg: '缺少商品 id' };
  const cur = await db.collection('products').doc(id).get();
  await db.collection('products').doc(id).update({
    data: { onSale: !cur.data.onSale, updateTime: new Date().toISOString() },
  });
  return { code: 0, data: { onSale: !cur.data.onSale }, msg: 'ok' };
};
