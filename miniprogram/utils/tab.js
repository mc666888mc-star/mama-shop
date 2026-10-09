const cart = require('./cart');
// 自定义 tabBar 选中态 + 购物车角标同步，各 tab 页 onShow 调用
function syncTab(page, index) {
  if (typeof page.getTabBar !== 'function') return;
  const tb = page.getTabBar();
  if (tb) tb.setData({ selected: index, cartCount: cart.count() });
}
module.exports = { syncTab };
