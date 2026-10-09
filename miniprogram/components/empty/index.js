Component({
  properties: {
    icon: { type: String, value: 'bag-lg' },
    title: { type: String, value: '' },
    desc: { type: String, value: '' },
    btn: { type: String, value: '' }
  },
  methods: { onTap() { this.triggerEvent('action'); } }
});
