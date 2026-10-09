const api = require('../../../utils/api');
const guard = require('../../../utils/guard');
const { yuan, toFen } = require('../../../utils/format');

const MAX_IMG = 5;

Page({
  data: {
    loading: false, isEdit: false, saving: false, tipsOpen: false, max: MAX_IMG,
    images: [], name: '', priceStr: '', stockStr: '', desc: '', onSale: true
  },
  onLoad(q) {
    this.id = q.id || '';
    guard().then((ok) => {
      if (!ok) return;
      if (!this.id) { this.setData({ tipsOpen: true }); return; } // 新增商品时，默认展开拍照小贴士
      this.setData({ loading: true, isEdit: true });
      api.getProduct(this.id).then((p) => this.setData({
        loading: false, images: (p.images || []).filter(Boolean), name: p.name, priceStr: yuan(p.price),
        stockStr: String(p.stock), desc: p.desc || '', onSale: p.onSale !== false
      })).catch(() => { this.setData({ loading: false }); wx.showToast({ title: '商品没找到', icon: 'none' }); });
    });
  },
  onName(e) { this.setData({ name: e.detail.value }); },
  onPrice(e) { this.setData({ priceStr: e.detail.value }); },
  onStock(e) { this.setData({ stockStr: e.detail.value }); },
  onDesc(e) { this.setData({ desc: e.detail.value }); },
  toggleSale() { this.setData({ onSale: !this.data.onSale }); },
  toggleTips() { this.setData({ tipsOpen: !this.data.tipsOpen }); },

  // ---- 图片 ----
  addImg() {
    const left = MAX_IMG - this.data.images.length;
    if (left <= 0) return;
    wx.chooseMedia({
      count: left, mediaType: ['image'], sizeType: ['compressed'], sourceType: ['album', 'camera'],
      success: (r) => {
        wx.showLoading({ title: '正在上传', mask: true });
        Promise.all(r.tempFiles.map((f) => api.uploadImage(f.tempFilePath))).then((ids) => {
          wx.hideLoading();
          this.setData({ images: this.data.images.concat(ids) });
        }).catch(() => {
          wx.hideLoading();
          wx.showToast({ title: '图片没传上去，请再试一次', icon: 'none' });
        });
      }
    });
  },
  tapImg(e) {
    const i = e.currentTarget.dataset.i;
    const items = i === 0 ? ['删除这张'] : ['设为封面', '删除这张'];
    wx.showActionSheet({
      itemList: items,
      success: (r) => {
        const imgs = this.data.images.slice();
        const act = items[r.tapIndex];
        if (act === '设为封面') { const x = imgs.splice(i, 1)[0]; imgs.unshift(x); }
        else imgs.splice(i, 1);
        this.setData({ images: imgs });
      }
    });
  },

  // ---- 保存 ----
  save() {
    if (this.data.saving) return;
    const name = this.data.name.trim();
    const price = toFen(this.data.priceStr);
    const stockStr = String(this.data.stockStr).trim();
    if (!name) return wx.showToast({ title: '请填商品名称', icon: 'none' });
    if (!(price > 0)) return wx.showToast({ title: '价格要填数字，例如 12.9', icon: 'none' });
    if (!/^\d+$/.test(stockStr)) return wx.showToast({ title: '库存要填整数，例如 50', icon: 'none' });
    this.setData({ saving: true });
    api.adminSaveProduct({
      _id: this.id || undefined, name, price, stock: parseInt(stockStr, 10),
      images: this.data.images, desc: this.data.desc.trim(), onSale: this.data.onSale
    }).then(() => {
      wx.showToast({ title: '已保存', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 600);
    }).catch((err) => {
      this.setData({ saving: false });
      wx.showModal({ title: '没保存成功', content: (err && err.message) || '请稍后再试', showCancel: false, confirmText: '知道了' });
    });
  }
});
