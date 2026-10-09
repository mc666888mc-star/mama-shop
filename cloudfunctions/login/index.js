// cloudfunctions/login/index.js - 拿 openid，判断是否为管理员（妈妈）
// 妈妈的 openid 填到 ADMIN_OPENIDS，部署后从云开发控制台日志里取自己的 openid
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const ADMIN_OPENIDS = [
  // '妈妈的openid填这里',
];

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  return {
    code: 0,
    data: { openid: OPENID, isAdmin: ADMIN_OPENIDS.includes(OPENID) },
    msg: 'ok',
  };
};
