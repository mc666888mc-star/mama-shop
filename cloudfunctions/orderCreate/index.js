// cloudfunctions/orderCreate/index.js - 创建订单（事务扣库存）
// 状态：0待付款 1待发货 2已发货 3完成
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { items = [], address, note = '' } = event;
  if (!items.length || !address || !address.name || !address.phone || !address.detail) {
    return { code: 1, msg: '订单信息不完整' };
  }

  // 用事务保证库存扣减原子性
  const result = await db.runTransaction(async (t) => {
    let total = 0;
    const orderItems = [];
    for (const { productId, qty } of items) {
      const n = Math.max(1, parseInt(qty || 1, 10));
      const p = await t.collection('products').doc(productId).get();
      if (!p.data || !p.data.onSale) throw new Error('商品已下架');
      if (p.data.stock < n) throw new Error(`「${p.data.name}」库存不足`);
      await t.collection('products').doc(productId).update({
        data: { stock: _.inc(-n), updateTime: new Date().toISOString() },
      });
      total += p.data.price * n;
      orderItems.push({ productId, name: p.data.name, price: p.data.price, qty: n });
    }
    const order = {
      _openid: OPENID,
      items: orderItems,
      total,
      address: {
        name: String(address.name).slice(0, 20),
        phone: String(address.phone).slice(0, 20),
        detail: String(address.detail).slice(0, 200),
      },
      note: String(note).slice(0, 200),
      status: 0,
      expressNo: '',
      createTime: new Date().toISOString(),
    };
    const r = await t.collection('orders').add({ data: order });
    return { id: r._id, total };
  }).catch((e) => ({ error: e.message }));

  if (result.error) return { code: 1, msg: result.error };
  return { code: 0, data: { _id: result.id, total: result.total }, msg: 'ok' };
};
