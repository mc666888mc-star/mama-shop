const pad = (n) => (n < 10 ? '0' + n : '' + n);

// 分 -> 元文字：1290 -> "12.9"，1000 -> "10"，1285 -> "12.85"
function yuan(fen) {
  const n = Math.round(Number(fen) || 0);
  const y = Math.floor(n / 100);
  const c = n % 100;
  if (c === 0) return '' + y;
  if (c % 10 === 0) return y + '.' + (c / 10);
  return y + '.' + pad(c);
}

// 元输入 -> 分（整数，不经过浮点运算）；格式不对返回 NaN
function toFen(str) {
  const s = String(str == null ? '' : str).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN;
  const p = s.split('.');
  return parseInt(p[0], 10) * 100 + parseInt(((p[1] || '') + '00').slice(0, 2), 10);
}

function toDate(t) {
  if (!t) return new Date();
  if (t instanceof Date) return t;
  if (typeof t === 'object' && t.$date) return new Date(t.$date);
  return new Date(t);
}
function timeText(t) {
  const d = toDate(t);
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}
function isToday(t) {
  const d = toDate(t); const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

const STATUS = ['待付款', '待发货', '已发货', '已完成'];

// 订单展示字段（买家端、妈妈后台共用）
function decorateOrder(o) {
  const items = (o.items || []).map((it) => Object.assign({}, it, { priceText: yuan(it.price) }));
  const ex = o.expressNo || '';
  return Object.assign({}, o, {
    items,
    count: items.reduce((s, i) => s + i.qty, 0),
    totalText: yuan(o.total),
    timeText: timeText(o.createTime),
    statusText: STATUS[o.status] || '',
    expressLabel: (ex === '同城送货' || ex === '上门自提') ? '配送方式' : '快递单号'
  });
}

module.exports = { pad, yuan, toFen, timeText, isToday, STATUS, decorateOrder };
