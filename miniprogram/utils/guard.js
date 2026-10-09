// 妈妈后台页面进入前校验（服务端也会再校验一次，这里只是友好提示）
module.exports = function adminGuard() {
  return getApp().userReady.then((u) => {
    if (u && u.isAdmin) return true;
    wx.showModal({
      title: '没有权限', content: '这个页面只有妈妈可以使用', showCancel: false,
      success: () => {
        if (getCurrentPages().length > 1) wx.navigateBack();
        else wx.switchTab({ url: '/pages/home/index' });
      }
    });
    return false;
  });
};
