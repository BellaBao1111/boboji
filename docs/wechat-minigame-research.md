# 🎮 钵钵鸡 → 微信小游戏 移植调研

> 调研日期:2026-08。结论先行:**技术上完全可行,2-4 周单人工作量(大头是 UI 重写);
> 广告接入本身半天搞定,真正的门槛是资质——需要国内主体(个人身份证即可)+ 软著,海外主体走不通游戏类目。**

---

## 1. 资质与政策(先看这个,决定做不做)

### 1.1 主体选择

| 主体 | 可行性 | 要求 | 限制 |
| --- | --- | --- | --- |
| **国内个人主体**(推荐) | ✅ 最现实的路径 | 中国大陆身份证 + 手机号;《计算机软件著作权登记证书》(软著)+《游戏自审自查报告》 | **不能内购,只能广告变现**(正好契合本作"不卖数值"设计);不可选文化互动/角色/牌类类目(选休闲益智即可) |
| 国内企业主体 | ⚠️ 门槛高 | 版号批文 + 文化部备案 + 软著 + 自审报告 | 版号是硬门槛(排队久、个人拿不到);要内购必须走这条 |
| **境外主体** | ❌ 游戏类目走不通 | 小程序虽开放 200+ 国家/地区注册(企业等类型、免备案) | 游戏类目的资质体系(软著/版号)都是国内证书,没有面向境外主体的小游戏发行通道 |

**对作者(美国)的实操建议**:用本人中国身份证(如有)或信任的亲友注册**国内个人主体**;或与国内小游戏发行代运营合作(分成模式)。

### 1.2 无内购 = 不需要版号

多方信源一致:**没有付费功能/道具的小游戏无需版号,只需软著**。个人主体天然不能内购 → 天然免版号。这是休闲 IAA(纯广告变现)小游戏的标准路径。

### 1.3 周期与费用

- **软著**:官方通道免费但约 2-4 个月;代办加急数百~千元人民币、数周;2026 年电子版权认证更快,适合赶时间。
- **备案**(2023 年底起强制):微信后台提交主体信息 + 负责人人脸识别,审核约 7-20 个工作日。
- 微信认证:个人主体免 300 元认证费(企业需要)。

## 2. 广告接入(难度:极低;门槛:UV 1000)

### 2.1 流量主开通条件

- 小游戏**累计独立访客(UV)≥ 1000** 且无违规记录 → 公众平台后台一键开通。

### 2.2 分成比例(2024.10 政策,2026 仍有效)

- 单日广告流水 **≤200 万元部分:开发者分 70%**;超出部分分 50%。
- 2026 年另有**广告金配赠激励**(用于买量):可选"注册用户 1-30 天广告流水的 40%"或"1-90 天的 35%"等模式;IAA 游戏(内购占比<30%)可用腾讯广告 + 外部渠道买量。

### 2.3 技术接入 = 几行代码

```js
const ad = wx.createRewardedVideoAd({ adUnitId: 'adunit-xxxx' });
ad.show();                         // 激励视频
ad.onClose(res => { if (res.isEnded) grantReward(); });
// 另有 createBannerAd / createInterstitialAd / 原生模板(格子)广告
```

### 2.4 本作的广告位设计(已留好钩子)

| 场景 | 现在(H5) | 小游戏版 |
| --- | --- | --- |
| 第 2 次续命 | 88 竹签币 | **看激励视频免费续**(经典位,转化最高) |
| 结算竹签币 | +N 🎋 | 看视频**翻倍** |
| 帮吃用完 | 等下一碗 | 看视频补 1 次 |
| Banner | — | 结算页底部(注意别挡按钮,违规会被处罚) |

现有代码里续命/结算/帮吃都是独立函数,插广告回调是**半天到一天**的工作量。

## 3. 技术移植(难度:中;2-4 周单人)

### 3.1 好消息:体量完全不是问题

包体限制:主包/单个分包 4M,总包 30M(未开虚拟支付 20M)。本作全量 gzip 约 950KB(零外部素材的红利),three + rapier wasm 全塞主包都绰绰有余。

### 3.2 逐模块评估

| 模块 | 现状 | 小游戏方案 | 工作量 |
| --- | --- | --- | --- |
| 渲染 | three.js r169 + DOM canvas | 官方 weapp-adapter 或 **three-platformize**(已适配微信小游戏的 three 分发);wx.createCanvas。微信支持 WebGL2,旧机型退 WebGL1 时 RoomEnvironment/PMREM 需降级为普通环境光 | 2-3 天 |
| **物理(最大技术坑)** | rapier3d-**compat**(base64 内嵌 wasm) | **WXWebAssembly.instantiate 只收包内 .wasm 文件路径,不支持 buffer** → 必须换非 compat 的 @dimforge/rapier3d + 自写加载器,把 rapier_wasm3d_bg.wasm(~1.3MB)放进包里。社区有 Ammo wasm 成熟先例(WXGameAmmoWasm),Rapier 同理。iOS 小游戏无 JIT,wasm 物理反而是性能优选 | 2-4 天 |
| **UI(最大工作量)** | 整套 HTML+CSS DOM(首页/选关/HUD/结算/图鉴/商店/每日/分享浮层) | 小游戏**没有 DOM**,全部要 canvas 重写(自绘或小游戏 UI 库)。约占移植总工时 60-70% | 1.5-2.5 周 |
| 音效 | WebAudio 全合成 | wx.createWebAudioContext,合成器代码基本平移 | 1 天 |
| 存档 | localStorage | wx.setStorageSync 薄壳 | 半天 |
| 字体 | woff2 ×2 | 转 ttf + wx.loadFont | 半天 |
| 分享卡 | Canvas 生成 + 下载/复制 | **反而更强**:canvas.toTempFilePath → wx.shareAppMessage 直接带图分享到群 | 1 天 |
| **好友排行榜**(移植的最大收益) | 无 | 开放数据域 + sharedCanvas 渲染好友成绩("第 N 碗"攀比进微信关系链——抓大鹅/羊了个羊爆火的真正引擎) | 3-5 天 |
| 触控 | pointer events | adapter 转 wx.onTouchStart/Move/End | 含在渲染适配里 |

### 3.3 建议的移植顺序

1. **PoC(第 1 周)**:adapter + three 场景跑通 → Rapier wasm 包内加载跑通 → 一碗签能拔。风险全在这一步,跑通后剩下是体力活。
2. **UI 重写(第 2-3 周)**:按屏优先级:HUD/结算 → 选关 → 商店/图鉴/每日。
3. **微信特性(第 4 周)**:分享带图、好友排行榜(开放数据域)、激励视频广告位。

## 4. 推荐路线(行政与开发并行)

```
现在        → H5 版继续迭代攒口碑(微信里可直接转发链接玩)
同步启动    → 国内个人主体注册 + 软著申请(电子版权认证加急)+ 备案   [周期最长,先跑起来]
第 1 周     → 技术 PoC(adapter + rapier wasm)
第 2-4 周   → UI 重写 + 微信特性 + 提审
上线后      → 攒 UV1000 开流量主 → 续命/翻倍接激励视频 → 好友排行榜驱动裂变
```

**备选渠道**:抖音小游戏门槛类似(软著 + 备案,个人可注册),引擎适配层社区同样成熟,可作为第二渠道;字节 IAA 买量生态更激进。

## 5. 风险与注意

- 个人主体**永远不能内购**——未来想卖皮肤需升级企业主体 + 版号,提前想清楚。
- 广告合规:Banner 不能诱导点击/遮挡操作,激励视频不能"不看就没法玩",违规会被停流量主。
- 审核对"血腥/赌博"敏感——本作食物题材零风险;"脑花"这类食材名审核无碍(餐饮常见词)。
- 微信对小游戏名称有唯一性要求,"钵钵鸡"若被占用需备选名(如"钵钵鸡·签签拔起来")。

---

## 参考来源

- [小游戏发布需要哪些资质(微信开放社区)](https://developers.weixin.qq.com/community/minigame/doc/000a0cd8328430ea4cdcf775a5d800)
- [小游戏资质提交审核指引(微信开放社区)](https://developers.weixin.qq.com/community/minigame/doc/0008282466cfb096eb679e9b551408)
- [关于微信小游戏的备案(微信开放社区)](https://developers.weixin.qq.com/community/develop/article/doc/0006a6f622cfb85d20305f0126bc13)
- [小程序游戏需要版号吗?(腾讯云社区)](https://cloud.tencent.com/developer/article/2321249)
- [微信小游戏流量主广告变现分成政策 2024.10(官方)](https://developers.weixin.qq.com/community/minigame/doc/000ecec6754138a7c2223911d66801)
- [2026 年微信小游戏广告变现激励政策(官方文档)](https://developers.weixin.qq.com/minigame/introduction/commercialization/guide/ad-monetization.html)
- [如何开通流量主/接入广告(微信开放社区)](https://developers.weixin.qq.com/community/develop/article/doc/00086a0a2209f08f435dcc42d56c13)
- [小游戏代码包大小限制调整(官方)](https://developers.weixin.qq.com/community/minigame/doc/00088e009103508f3270aaf9c61001)
- [WXWebAssembly(官方文档)](https://developers.weixin.qq.com/minigame/dev/guide/performance/perf-webassembly.html)
- [three-platformize(三方 three 适配)](https://github.com/deepkolos/three-platformize)
- [WXGameAmmoWasm(小游戏物理 wasm 先例)](https://github.com/liuxinyumocn/WXGameAmmoWasm)
- [境外主体支持情况(微信开放社区)](https://developers.weixin.qq.com/community/business/doc/0006eaf7f14ae8155172387406b80d)
- [类目设置(官方文档)](https://developers.weixin.qq.com/minigame/introduction/guide/type.html)
