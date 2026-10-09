// scripts/preview.js - 云 VM 生成小程序预览二维码（代替开发者工具"预览"按钮）
// 用法：node scripts/preview.js
// 需要：真实 AppID + 小程序代码上传密钥（放 ../secrets/project.private.key，绝不进仓库）
// 输出：preview-qr.png —— 发给 owner，手机微信扫码即打开开发版真机预览
const path = require('path');
const fs = require('fs');
const ci = require('miniprogram-ci');

const APPID = process.env.MINIAPP_APPID || '';
const KEY_PATH = path.join(__dirname, '..', 'secrets', 'project.private.key');
const PROJECT_PATH = path.join(__dirname, '..');
const OUT = path.join(__dirname, '..', 'preview-qr.png');

async function main() {
  if (!APPID) {
    console.error('请先设置环境变量 MINIAPP_APPID（真实 AppID）');
    process.exit(1);
  }
  if (!fs.existsSync(KEY_PATH)) {
    console.error(`找不到上传密钥：${KEY_PATH}`);
    console.error('请让 owner 从小程序后台（开发→开发设置）下载"小程序代码上传密钥"放到该位置');
    process.exit(1);
  }
  const project = new ci.Project({
    appid: APPID,
    type: 'miniProgram',
    projectPath: PROJECT_PATH,
    privateKeyPath: KEY_PATH,
    ignores: ['node_modules/**/*'],
  });
  await ci.preview({
    project,
    desc: '妈妈小店预览版',
    setting: { es6: true, minified: true },
    qrcodeFormat: 'image',
    qrcodeOutputDest: OUT,
  });
  console.log('预览二维码已生成：', OUT);
}

main().catch((e) => { console.error(e); process.exit(1); });
