// cloudfunctions/productList/index.js - 商品列表（买家只看在售，妈妈看全部）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { keyword = '', admin = false } = event;
  const query = admin ? {} : { onSale: true };
  if (keyword) {
    query.name = db.RegExp({ regexp: keyword, options: 'i' });
  }
  const res = await db.collection('products')
    .where(query)
    .orderBy('createTime', 'desc')
    .limit(50)
    .get();
  return { code: 0, data: res.data, msg: 'ok' };
};
