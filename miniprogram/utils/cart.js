// 购物车：存在手机本地（wx storage），下单成功后清掉已结算的商品
const KEY = 'cart_v1';

function read() { try { return wx.getStorageSync(KEY) || []; } catch (e) { return []; } }
function write(list) { try { wx.setStorageSync(KEY, list); } catch (e) {} return list; }
const cover = (p) => (p.images && p.images[0]) || '';

function list() { return read(); }
function count() { return read().filter((i) => !i.invalid).reduce((s, i) => s + i.qty, 0); }

function add(p, qty) {
  qty = qty || 1;
  const l = read();
  const max = p.stock > 0 ? p.stock : 99;
  const hit = l.find((i) => i.productId === p._id);
  if (hit) {
    hit.qty = Math.min(hit.qty + qty, max);
    hit.stock = p.stock; hit.price = p.price; hit.invalid = false;
  } else {
    l.unshift({ productId: p._id, name: p.name, price: p.price, image: cover(p), emoji: p.emoji || '', tone: p.tone, qty: Math.max(1, Math.min(qty, max)), stock: p.stock });
  }
  return write(l);
}

function setQty(id, qty) {
  const l = read();
  const it = l.find((i) => i.productId === id);
  if (it) it.qty = Math.max(1, Math.min(qty, it.stock > 0 ? it.stock : 99));
  return write(l);
}

function remove(ids) {
  ids = [].concat(ids);
  return write(read().filter((i) => ids.indexOf(i.productId) < 0));
}

// 用最新的商品列表校正购物车：价格/库存变了、下架了，这里统一处理
function sync(products) {
  const map = {};
  products.forEach((p) => { map[p._id] = p; });
  const l = read().map((i) => {
    const p = map[i.productId];
    if (!p || p.onSale === false || !(p.stock > 0)) return Object.assign({}, i, { invalid: true });
    return Object.assign({}, i, { invalid: false, name: p.name, price: p.price, stock: p.stock, image: cover(p), emoji: p.emoji || '', tone: p.tone, qty: Math.min(i.qty, p.stock) });
  });
  return write(l);
}

module.exports = { list, count, add, setQty, remove, sync };
