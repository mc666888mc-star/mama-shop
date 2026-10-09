// cloudfunctions/orderUpdateStatus/index.js - 改订单状态（仅管理员）
// 0待付款 -> 1待发货（确认收款） -> 2已发货（填快递单号） -> 3完成
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const ADMIN_OPENIDS = [
  // '妈妈的openid填这里',
];

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  if (!ADMIN_OPENIDS.includes(OPENID)) return { code: 403, msg: '没有权限' };
  const { id, status, expressNo = '' } = event;
  if (!id || ![1, 2, 3].includes(parseInt(status, 10))) {
    return { code: 1, msg: '参数错误' };
  }
  const data = { status: parseInt(status, 10), updateTime: new Date().toISOString() };
  if (expressNo) data.expressNo = String(expressNo).slice(0, 40);
  await db.collection('orders').doc(id).update({ data });
  return { code: 0, data: { id, status: data.status }, msg: 'ok' };
};
