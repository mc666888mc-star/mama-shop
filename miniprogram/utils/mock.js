// 演示模式的本地“假后端”：接口形状与云端完全一致，数据存在手机本地。
// config.envId 填了之后自动不再使用。
const config = require('./config');
const KEY = 'mock_db_v1';
const MIN = 60 * 1000;
const pad = (n) => (n < 10 ? '0' + n : '' + n);

function nextOrderNo(db) {
  const d = new Date();
  db.seq = (db.seq || 0) + 1;
  return pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + ('00' + db.seq).slice(-3);
}

function seed() {
  const t = Date.now();
  const P = (id, name, price, stock, emoji, tone, desc, ago) => ({
    _id: id, name, price, stock, images: [], emoji, tone, desc, onSale: true, createTime: t - ago * MIN
  });
  const products = [
    P('p1', '双面加厚洗碗布（10片装）', 1290, 120, '🧽', 0, '一面吸水，一面去污。不掉毛、不沾油，洗碗、擦台面都好用。', 1),
    P('p2', '柠檬洗洁精 1.2kg', 990, 86, '🧴', 4, '泡沫细腻，去油力强，冲洗不留残余。配方温和，洗完手不干。', 2),
    P('p3', '厨房吸油纸巾（6卷）', 1500, 64, '🧻', 1, '吸水吸油双效，湿水不易破，煎炸后的油渍一擦就净。', 3),
    P('p4', '纯棉纱布抹布（3条装）', 880, 200, '🧺', 2, '老式纱布织法，柔软耐用，擦桌子、擦玻璃都不留痕。', 4),
    P('p5', '不沾油百洁布（20片）', 690, 3, '🧼', 3, '轻轻一擦就去污，不伤锅具，用完一冲就干净。', 5),
    P('p6', '家用小扫把簸箕套装', 1680, 0, '🧹', 5, '桌面、沙发缝、角落都能扫，簸箕边缘带齿，方便清理扫把。', 6)
  ];
  const L = (p, qty) => ({ productId: p._id, name: p.name, price: p.price, qty, image: '', emoji: p.emoji, tone: p.tone });
  const db = { products, orders: [], address: null, seq: 0 };
  const addr = (name, phone, detail) => ({ name, phone, detail });
  const O = (items, status, ago, a, remark, express) => {
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    return { _id: 'o' + (t - ago * MIN), orderNo: nextOrderNo(db), items, total, address: a, remark: remark || '', status, expressNo: express || '', createTime: t - ago * MIN };
  };
  db.orders = [
    O([L(products[3], 3)], 0, 12, addr('张叔叔', '13900139000', '阳光花园 2 栋 301'), ''),
    O([L(products[1], 2), L(products[0], 1)], 1, 95, addr('王阿姨', '13800138000', '幸福小区 3 栋 502'), '下午都在家，直接送上来就行'),
    O([L(products[2], 1)], 2, 60 * 26, addr('李姐', '13700137000', '东风路 18 号'), '', '同城送货'),
    O([L(products[0], 2), L(products[4], 1)], 3, 60 * 60, addr('陈老师', '13600136000', '学府苑 1 栋 1201'), '', '顺丰 SF1234567890')
  ];
  return db;
}

function load() {
  let db;
  try { db = wx.getStorageSync(KEY); } catch (e) {}
  if (!db || !db.products) { db = seed(); save(db); }
  return db;
}
function save(db) { try { wx.setStorageSync(KEY, db); } catch (e) {} }
const ok = (v) => new Promise((r) => setTimeout(() => r(v === undefined ? v : JSON.parse(JSON.stringify(v))), 120));
const fail = (msg) => Promise.reject(new Error(msg));
const sortNew = (a, b) => b.createTime - a.createTime;

module.exports = {
  login: () => ok({ openid: 'demo-openid', isAdmin: !!config.demoAdmin, nickName: '微信用户' }),

  listProducts: () => ok(load().products.filter((p) => p.onSale).sort(sortNew)),
  getProduct: (id) => {
    const p = load().products.find((x) => x._id === id);
    return p ? ok(p) : fail('商品不存在');
  },

  getAddress: () => ok(load().address || null),
  saveAddress: (a) => {
    const db = load();
    db.address = { name: a.name, phone: a.phone, detail: a.detail, isDefault: true };
    save(db);
    return ok(db.address);
  },

  // 前端只传 productId 和数量，价格、库存全部以“库”里的为准（云端实现同理）
  createOrder: (o) => {
    const db = load();
    const lines = []; let total = 0;
    for (const it of o.items) {
      const p = db.products.find((x) => x._id === it.productId);
      if (!p || !p.onSale) return fail('「' + (p ? p.name : '商品') + '」已下架');
      if (p.stock < it.qty) return fail('「' + p.name + '」库存不足，只剩 ' + p.stock + ' 件');
      lines.push({ productId: p._id, name: p.name, price: p.price, qty: it.qty, image: (p.images && p.images[0]) || '', emoji: p.emoji, tone: p.tone });
      total += p.price * it.qty;
    }
    lines.forEach((l) => { db.products.find((x) => x._id === l.productId).stock -= l.qty; });
    const order = { _id: 'o' + Date.now(), orderNo: nextOrderNo(db), items: lines, total, address: o.address, remark: o.remark || '', status: 0, expressNo: '', createTime: Date.now() };
    db.orders.unshift(order);
    save(db);
    return ok({ _id: order._id, orderNo: order.orderNo, total });
  },
  listOrders: () => ok(load().orders.slice().sort(sortNew)),
  getOrder: (id) => {
    const o = load().orders.find((x) => x._id === id);
    return o ? ok(o) : fail('订单不存在');
  },
  prepay: () => fail('演示模式没有微信支付，请用转账方式体验'),

  adminListOrders: () => ok(load().orders.slice().sort(sortNew)),
  adminOrderAction: (id, action, expressNo) => {
    const db = load();
    const o = db.orders.find((x) => x._id === id);
    if (!o) return fail('订单不存在');
    if (action === 'confirmPaid' && o.status === 0) o.status = 1;
    else if (action === 'ship' && o.status === 1) { o.status = 2; o.expressNo = expressNo || ''; }
    else if (action === 'complete' && o.status === 2) o.status = 3;
    else return fail('订单状态已经变了，请下拉刷新');
    save(db);
    return ok(o);
  },
  adminListProducts: () => ok(load().products.slice().sort(sortNew)),
  adminSaveProduct: (p) => {
    const db = load();
    const fields = { name: p.name, price: p.price, stock: p.stock, images: p.images || [], desc: p.desc || '', onSale: p.onSale !== false };
    if (p._id) {
      const i = db.products.findIndex((x) => x._id === p._id);
      if (i < 0) return fail('商品不存在');
      db.products[i] = Object.assign({}, db.products[i], fields);
    } else {
      db.products.unshift(Object.assign({ _id: 'p' + Date.now(), createTime: Date.now() }, fields));
    }
    save(db);
    return ok({ ok: true });
  },
  adminSetOnSale: (id, onSale) => {
    const db = load();
    const p = db.products.find((x) => x._id === id);
    if (!p) return fail('商品不存在');
    p.onSale = !!onSale;
    save(db);
    return ok({ ok: true });
  },
  uploadImage: (filePath) => new Promise((resolve) => {
    wx.compressImage({ src: filePath, quality: 60, success: (r) => resolve(r.tempFilePath), fail: () => resolve(filePath) });
  })
};
