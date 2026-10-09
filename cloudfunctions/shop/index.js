// cloudfunctions/shop/index.js - 妈妈小店唯一业务云函数，按 event.action 分发
// 前端约定见 docs-claude/对接说明.md
// 返回格式：成功 { ok:true, data }，失败 { ok:false, msg:'给用户看的中文提示' }
// 金额一律用"分"
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

// 妈妈（管理员）的 openid 填这里。首次跑通后去 users 表里查妈妈的 openid。
const ADMIN_OPENIDS = [
  // '妈妈的openid填这里',
];

const ok = (data) => ({ ok: true, data });
const fail = (msg) => ({ ok: false, msg });

async function getUser(openid) {
  const r = await db.collection('users').where({ openid }).limit(1).get();
  return r.data[0] || null;
}

async function requireAdmin(openid) {
  const u = await getUser(openid);
  if (!u || !u.isAdmin) throw new Error('没有权限');
  return u;
}

const actions = {
  // 登录：按 openid 查/建 users
  async login() {
    const { OPENID } = cloud.getWXContext();
    let u = await getUser(OPENID);
    const isAdmin = ADMIN_OPENIDS.includes(OPENID) || !!(u && u.isAdmin);
    if (!u) {
      await db.collection('users').add({
        data: { openid: OPENID, isAdmin, nickName: '', createTime: new Date().toISOString() },
      });
    } else if (u.isAdmin !== isAdmin) {
      await db.collection('users').doc(u._id).update({ data: { isAdmin } });
    }
    return ok({ openid: OPENID, isAdmin, nickName: (u && u.nickName) || '' });
  },

  // 买家：只看在售
  async listProducts() {
    const r = await db.collection('products')
      .where({ onSale: true }).orderBy('createTime', 'desc').limit(50).get();
    return ok(r.data);
  },

  // 详情：含下架商品（详情页、后台编辑页共用）
  async getProduct({ id }) {
    if (!id) return fail('缺少商品 id');
    const r = await db.collection('products').doc(id).get();
    if (!r.data) return fail('商品不存在');
    return ok(r.data);
  },

  async getAddress() {
    const { OPENID } = cloud.getWXContext();
    const r = await db.collection('addresses')
      .where({ _openid: OPENID }).orderBy('isDefault', 'desc').limit(1).get();
    return ok(r.data[0] || null);
  },

  async saveAddress({ addr }) {
    const { OPENID } = cloud.getWXContext();
    if (!addr || !addr.name || !addr.phone || !addr.detail) return fail('地址信息不完整');
    const data = {
      name: String(addr.name).slice(0, 20),
      phone: String(addr.phone).slice(0, 20),
      detail: String(addr.detail).slice(0, 200),
      isDefault: true,
      updateTime: new Date().toISOString(),
    };
    const old = await db.collection('addresses').where({ _openid: OPENID }).get();
    await Promise.all(old.data.map((d) =>
      db.collection('addresses').doc(d._id).update({ data: { isDefault: false } })));
    const dup = old.data.find((d) =>
      d.name === data.name && d.phone === data.phone && d.detail === data.detail);
    if (dup) {
      await db.collection('addresses').doc(dup._id).update({ data });
    } else {
      await db.collection('addresses').add({ data: { ...data, _openid: OPENID } });
    }
    return ok(data);
  },

  // 下单：只信 productId+qty，价格/库存云端重算，事务防超卖
  async createOrder({ items = [], address, remark = '' }) {
    const { OPENID } = cloud.getWXContext();
    if (!items.length) return fail('购物车是空的');
    if (!address || !address.name || !address.phone || !address.detail) {
      return fail('请填写收货地址');
    }
    const now = new Date();
    const mmdd = String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');

    try {
      const result = await db.runTransaction(async (t) => {
        let total = 0;
        const orderItems = [];
        for (const { productId, qty } of items) {
          const n = Math.max(1, parseInt(qty || 1, 10));
          const p = await t.collection('products').doc(productId).get();
          if (!p.data || !p.data.onSale) throw new Error('有商品已下架，请重新下单');
          if (p.data.stock < n) throw new Error(`「${p.data.name}」库存不足，只剩 ${p.data.stock} 件`);
          await t.collection('products').doc(productId).update({
            data: { stock: _.inc(-n), updateTime: now.toISOString() },
          });
          total += p.data.price * n;
          orderItems.push({
            productId,
            name: p.data.name,
            price: p.data.price,
            qty: n,
            image: (p.data.images && p.data.images[0]) || '',
          });
        }
        // 短订单号 MMDD-序号（转账备注用）
        const cRef = t.collection('counters').doc('orderNo-' + mmdd);
        const c = await cRef.get().catch(() => ({ data: null }));
        const seq = (c.data ? c.data.seq : 0) + 1;
        if (c.data) {
          await cRef.update({ data: { seq: _.inc(1) } });
        } else {
          await cRef.set({ data: { seq: 1 } });
        }
        const orderNo = `${mmdd}-${String(seq).padStart(3, '0')}`;
        const order = {
          _openid: OPENID,
          orderNo,
          items: orderItems,
          total,
          address: {
            name: String(address.name).slice(0, 20),
            phone: String(address.phone).slice(0, 20),
            detail: String(address.detail).slice(0, 200),
          },
          remark: String(remark).slice(0, 200),
          status: 0,
          expressNo: '',
          createTime: now.toISOString(),
        };
        const r = await t.collection('orders').add({ data: order });
        return { _id: r._id, orderNo, total };
      });
      return ok(result);
    } catch (e) {
      return fail(e.message || '下单失败');
    }
  },

  async listOrders() {
    const { OPENID } = cloud.getWXContext();
    const r = await db.collection('orders')
      .where({ _openid: OPENID }).orderBy('createTime', 'desc').limit(50).get();
    return ok(r.data);
  },

  async getOrder({ id }) {
    const { OPENID } = cloud.getWXContext();
    if (!id) return fail('缺少订单 id');
    const r = await db.collection('orders').doc(id).get();
    if (!r.data) return fail('订单不存在');
    const u = await getUser(OPENID);
    if (r.data._openid !== OPENID && !(u && u.isAdmin)) return fail('没有权限');
    return ok(r.data);
  },

  async adminListOrders() {
    const { OPENID } = cloud.getWXContext();
    await requireAdmin(OPENID).catch((e) => { throw e; });
    const r = await db.collection('orders')
      .orderBy('createTime', 'desc').limit(100).get();
    return ok(r.data);
  },

  // action: confirmPaid(0→1) / ship(1→2) / complete(2→3)
  async adminOrderAction({ id, action, expressNo = '' }) {
    const { OPENID } = cloud.getWXContext();
    await requireAdmin(OPENID);
    if (!id) return fail('缺少订单 id');
    const cur = await db.collection('orders').doc(id).get();
    if (!cur.data) return fail('订单不存在');
    const next = { confirmPaid: 1, ship: 2, complete: 3 }[action];
    if (next === undefined) return fail('未知操作');
    if (cur.data.status !== next - 1) return fail('订单状态已变化，请刷新');
    const data = { status: next, updateTime: new Date().toISOString() };
    if (action === 'ship' && expressNo) data.expressNo = String(expressNo).slice(0, 40);
    await db.collection('orders').doc(id).update({ data });
    return ok({ id, status: next });
  },

  async adminListProducts() {
    const { OPENID } = cloud.getWXContext();
    await requireAdmin(OPENID);
    const r = await db.collection('products')
      .orderBy('createTime', 'desc').limit(100).get();
    return ok(r.data);
  },

  async adminSaveProduct({ product }) {
    const { OPENID } = cloud.getWXContext();
    await requireAdmin(OPENID);
    if (!product || !product.name || !(product.price > 0)) return fail('名称和价格必填');
    const doc = {
      name: String(product.name).slice(0, 60),
      price: Math.round(product.price), // 分
      stock: Math.max(0, parseInt(product.stock || 0, 10)),
      images: (product.images || []).slice(0, 9),
      desc: String(product.desc || '').slice(0, 2000),
      onSale: product.onSale !== false,
      updateTime: new Date().toISOString(),
    };
    if (product._id) {
      await db.collection('products').doc(product._id).update({ data: doc });
      return ok({ id: product._id });
    }
    doc.createTime = new Date().toISOString();
    const r = await db.collection('products').add({ data: doc });
    return ok({ id: r._id });
  },

  async adminSetOnSale({ id, onSale }) {
    const { OPENID } = cloud.getWXContext();
    await requireAdmin(OPENID);
    if (!id) return fail('缺少商品 id');
    await db.collection('products').doc(id).update({
      data: { onSale: !!onSale, updateTime: new Date().toISOString() },
    });
    return ok({ id, onSale: !!onSale });
  },
};

exports.main = async (event) => {
  const fn = actions[event.action];
  if (!fn) return fail(`未知 action: ${event.action}`);
  try {
    return await fn(event);
  } catch (e) {
    return fail(e.message || '服务器开小差了');
  }
};
