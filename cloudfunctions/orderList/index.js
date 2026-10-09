// cloudfunctions/orderList/index.js - 查订单（买家看自己的，妈妈看全部）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const ADMIN_OPENIDS = [
  // '妈妈的openid填这里',
];

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { status, admin = false } = event;
  const isAdmin = ADMIN_OPENIDS.includes(OPENID);

  const query = {};
  if (admin) {
    if (!isAdmin) return { code: 403, msg: '没有权限' };
  } else {
    query._openid = OPENID;
  }
  if (status !== undefined && status !== null && status !== '') {
    query.status = parseInt(status, 10);
  }
  const res = await db.collection('orders')
    .where(query)
    .orderBy('createTime', 'desc')
    .limit(50)
    .get();
  return { code: 0, data: res.data, msg: 'ok' };
};
