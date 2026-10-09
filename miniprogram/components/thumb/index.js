// 商品图：有图显示图，没图/加载失败显示柔和渐变底 + 大 emoji（保证没拍照时也好看）
Component({
  properties: {
    src: { type: String, value: '' },
    emoji: { type: String, value: '🛍️' },
    tone: { type: Number, value: -1 },
    seed: { type: String, value: '' },
    size: { type: String, value: '120rpx' }
  },
  data: { idx: 0, failed: false },
  observers: {
    'tone, seed': function () { this.calc(); },
    'src': function () { this.setData({ failed: false }); }
  },
  lifetimes: { attached() { this.calc(); } },
  methods: {
    calc() {
      let i = this.data.tone;
      if (!(i >= 0)) {
        let h = 0;
        const s = String(this.data.seed || '');
        for (let k = 0; k < s.length; k++) h = (h * 31 + s.charCodeAt(k)) >>> 0;
        i = h;
      }
      this.setData({ idx: i % 6 });
    },
    onErr() { this.setData({ failed: true }); }
  }
});
