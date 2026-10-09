// cloudfunctions/productSave/index.js - 新增/编辑商品（仅管理员）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const ADMIN_OPENIDS = [
  // '妈妈的openid填这里',
];

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  if (!ADMIN_OPENIDS.includes(OPENID)) return { code: 403, msg: '没有权限' };

  const { id, name, price, stock, images = [], desc = '', onSale = true } = event;
  if (!name || !(price > 0)) return { code: 1, msg: '名称和价格必填' };

  const doc = {
    name: String(name).slice(0, 60),
    price: Math.round(price), // 分
    stock: Math.max(0, parseInt(stock || 0, 10)),
    images: images.slice(0, 9),
    desc: String(desc).slice(0, 2000),
    onSale: !!onSale,
    updateTime: new Date().toISOString(),
  };

  if (id) {
    await db.collection('products').doc(id).update({ data: doc });
    return { code: 0, data: { id }, msg: 'ok' };
  }
  doc.createTime = new Date().toISOString();
  const res = await db.collection('products').add({ data: doc });
  return { code: 0, data: { id: res._id }, msg: 'ok' };
};
