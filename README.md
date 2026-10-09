# 妈妈小店 · 微信小程序

给妈妈在微信里卖洗碗布、洗洁精等日用品的小程序商城。

## 完全无电脑开发流水线（本项目专用）

项目 owner 没有电脑，所有操作在云 VM 上完成，真机预览靠手机扫码。
不需要微信开发者工具，不需要"测试号"。

### 前置条件（owner 在手机浏览器上完成，一次性）
1. 打开 `mp.weixin.qq.com` → 立即注册 → 选"小程序" → 主体选 **个人**（免费）。
用邮箱注册，按提示实名（身份证 + 人脸识别，手机上操作反而方便）。
2. 拿到 **AppID**（开发 → 开发设置 → 开发者 ID）。
3. 同一页面申请 **小程序代码上传密钥**，下载 key 文件发给开发者（**绝不进仓库**，只放云 VM 的 secrets 目录）。
4. 把 AppID 发给开发者。

> 为什么不用"测试号"：测试号没有代码上传密钥，云 VM 的 miniprogram-ci 链路需要真实 AppID + 上传密钥。个人主体注册免费，审核一般几小时。

### 开发者操作（云 VM，全自动）
```bash
# 1. 生成预览二维码（代替开发者工具的"预览"按钮）
node scripts/preview.js
# 输出 preview-qr.png，把图片发给 owner，手机微信扫码即看真机效果

# 2. 部署云函数（代替开发者工具右键"上传并部署"）
tcb login --apiKeyId xxx --apiKey yyy # 或扫码登录
tcb functions:deploy --envId <envId> # 逐个部署 cloudfunctions/ 下的函数
```

### 云开发环境开通
- 首次开通：手机浏览器打开云开发 Web 控制台 `cloud.weixin.qq.com`，
用小程序管理员微信扫码登录 → 创建环境 → 把 **环境 ID** 填到 `miniprogram/app.js` 的 `CLOUD_ENV_ID`。
- 数据库集合：`products`、`orders`、`addresses`、`users`（字段见《设计需求书》）。
- 妈妈的 openid：先跑通 `login` 云函数，从日志里拿到妈妈微信的 openid，
填到各云函数 `ADMIN_OPENIDS` 数组，重新部署。

### 支付（铁律）
- **上线必须接微信支付**，这是门面，没得商量。
- 一期（开发期，个人主体无商户号）：`payMode='transfer'`，下单后买家微信转账备注订单号，妈妈后台点"确认收款"。
- 二期（上线）：前提 → 小程序主体转**个体工商户**（执照免费办）+ 开通**微信支付商户号**；
实现 → 云函数 `orderPrepay` 内调微信支付 APIv3 统一下单（JSAPI），
商户号/密钥/证书走云函数**环境变量**，绝不写进代码；
前端 `app.globalData.payMode` 切到 `'wxpay'`，调用 `wx.requestPayment`（代码已预留）。
- 金额一律用"分"存储，前端展示除以 100。

### 目录结构
```
miniapp/
├── project.config.json # 项目配置（AppID 发布前替换真实值）
├── miniprogram/ # 前端：WXML + WXSS + JS
│ ├── app.js / app.json / app.wxss
│ └── pages/
│ ├── home/ # 首页（商品流+搜索）
│ ├── product/ # 商品详情
│ ├── checkout/ # 下单页
│ ├── orders/ # 订单列表
│ ├── profile/ # 我的（含妈妈后台入口）
│ ├── admin-products/ # 妈妈：商品管理
│ └── admin-orders/ # 妈妈：订单管理
├── cloudfunctions/ # 云函数（Node.js）
│ ├── login/ # 拿 openid、判管理员
│ ├── productList / productGet / productSave / productToggleSale
│ ├── orderCreate / orderList / orderUpdateStatus
│ └── orderPrepay/ # 微信支付统一下单占位
└── scripts/
└── preview.js # 云 VM 生成预览二维码（miniprogram-ci）
```

### 分工
- 骨架 + 工程操作：Miku（云 VM）
- UI 设计细化：Claude + GPT
- 找 bug：GPT 直接读本仓库代码（公开仓库，省附件额度）
- 拍板：owner
