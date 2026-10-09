// 底部弹层（玻璃质感）。用法：<sheet show="{{x}}" title="..." bind:close="onClose">内容</sheet>
Component({
  properties: {
    show: { type: Boolean, value: false },
    title: { type: String, value: '' }
  },
  methods: {
    close() { this.triggerEvent('close'); },
    noop() {}
  }
});
