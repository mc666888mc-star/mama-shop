const api = require('../../../utils/api');
const guard = require('../../../utils/guard');
const { yuan } = require('../../../utils/format');

Page({
  data: { loading: true, list: [] },
  onShow() { guard().then((ok) => { if (ok) this.load(); }); },
  onPullDownRefresh() { this.load().then(() => wx.stopPullDownRefresh()); },
  load() {
    return api.adminListProducts().then((l) => {
      this.setData({
        loading: false,
        list: l.map((p) => Object.assign({}, p, { priceText: yuan(p.price), cover: (p.images && p.images[0]) || '' }))
      });
    }).catch((err) => {
      this.setData({ loading: false });
      wx.showToast({ title: (err && err.message) || '加载失败，请下拉刷新', icon: 'none' });
    });
  },
  add() { wx.navigateTo({ url: '/pages/admin/edit/index' }); },
  edit(e) { wx.navigateTo({ url: '/pages/admin/edit/index?id=' + e.currentTarget.dataset.id }); },
  toggle(e) {
    const id = e.currentTarget.dataset.id;
    const p = this.data.list.find((x) => x._id === id);
    if (!p) return;
    const to = !p.onSale;
    // 先改界面，失败了再恢复，妈妈点下去立刻有反应
    this.setData({ list: this.data.list.map((x) => (x._id === id ? Object.assign({}, x, { onSale: to }) : x)) });
    api.adminSetOnSale(id, to)
      .then(() => wx.showToast({ title: to ? '已上架' : '已下架', icon: 'success' }))
      .catch((err) => {
        wx.showToast({ title: (err && err.message) || '没成功，请再点一次', icon: 'none' });
        this.load();
      });
  }
});
