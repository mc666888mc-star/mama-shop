// 数量加减。change：{value}；已经是最小值再点“−”会触发 under（购物车用它来问“要移除吗”）
Component({
  properties: {
    value: { type: Number, value: 1 },
    min: { type: Number, value: 1 },
    max: { type: Number, value: 99 },
    small: { type: Boolean, value: false }
  },
  methods: {
    minus() {
      if (this.data.value <= this.data.min) { this.triggerEvent('under'); return; }
      this.triggerEvent('change', { value: this.data.value - 1 });
    },
    plus() {
      if (this.data.value >= this.data.max) {
        wx.showToast({ title: '库存只有 ' + this.data.max + ' 件', icon: 'none' });
        return;
      }
      this.triggerEvent('change', { value: this.data.value + 1 });
    }
  }
});
