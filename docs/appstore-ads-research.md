# 📱 钵钵鸡 App Store 广告变现调研

> 调研日期:2026-08。前提:iOS 工程已就绪(见 `APPSTORE.md`,Capacitor 8 + SPM)。
> 结论先行:**门槛远低于微信(无软著/版号/UV 要求,$99/年 + 过审即可);
> 技术接入 2-3 天;主选 AdMob 激励视频(美区 eCPM ~$13-20);
> 苹果还比微信多一个武器——个人开发者也能开内购(15% 佣金)。**

---

## 1. 方案选型:AdMob 激励视频为主

| 方案 | 适配我们 | 说明 |
| --- | --- | --- |
| **Google AdMob**(主选) | ✅ | 移动游戏广告事实标准;激励视频美区 eCPM ~$13-20,优化好可到 $30+;Capacitor 生态支持最好 |
| AppLovin / Unity LevelPlay | ⚠️ 以后再说 | 聚合(mediation)抬 eCPM 用的,DAU 上量之前不值得引入复杂度 |
| Apple 自家广告 | ❌ | iAd 早已关闭,苹果不提供 App 内广告 SDK |
| AdSense H5 Games Ads | 🌐 网页版彩蛋 | 见 §5,网页版也能变现 |

**广告位设计(游戏钩子已留好,与微信版一致):**

| 场景 | 触发 | 形式 |
| --- | --- | --- |
| 第 2 次续命 | `acceptRevive()` 的付费分支 | 看激励视频免续(转化最高的经典位) |
| 结算竹签币翻倍 | 结算屏加"看视频 ×2"按钮 | 激励视频 |
| 帮吃用完补 1 次 | 帮吃按钮灰态 | 激励视频 |
| ~~Banner~~ | 不建议 | 3D 全屏游戏放 banner 毁体验毁口碑,收益还低(CPC 几毛) |

**只做激励视频**:玩家自愿看、有回报、不打断——留存友好,也符合本作"不恶心玩家"的底色。

## 2. 技术接入(本仓库具体路径)

### 2.1 一个真实的摩擦点:插件 vs SPM

我们的 iOS 工程用 **Capacitor 8 + Swift Package Manager**(无 CocoaPods)。社区插件
`@capacitor-community/admob` 文档标注支持到 Capacitor 6(npm 上可能有更新版),SPM 支持不明——传统上它走 CocoaPods。三条路:

1. **自写薄插件(推荐)**:Google Mobile Ads SDK **官方支持 SPM**,写一个 ~60 行的自定义 Capacitor 插件(Swift)暴露 `prepareRewarded()/showRewarded()` 给 JS 即可。与现有 SPM 工程零冲突,依赖最少,完全可控。
2. 试 `@capacitor-community/admob` 最新版:若已适配 Cap 7/8 + SPM 则直接用(API 现成:`AdMob.initialize()` → `prepareRewardVideoAd()` → `showRewardVideoAd()`,监听 `RewardAdPluginEvents.Rewarded` 发奖)。
3. 工程退回 CocoaPods 接插件:能用但放弃了 SPM 的干净,不推荐。

### 2.2 必需的 iOS 配置(不管哪条路)

```xml
<!-- Info.plist -->
<key>GADApplicationIdentifier</key><string>ca-app-pub-xxxx~yyyy</string>
<key>SKAdNetworkItems</key><array>
  <dict><key>SKAdNetworkIdentifier</key><string>cstr6suwn9.skadnetwork</string></dict>
  <!-- + Google 提供的完整 SKAdNetwork ID 列表 -->
</array>
<key>NSUserTrackingUsageDescription</key><string>用于向你展示更相关的广告</string>
```

### 2.3 游戏侧改动(半天)

```ts
// 广告桥:web 环境降级为"直接给奖励/隐藏按钮"
if (Capacitor.isNativePlatform()) { /* 走原生激励视频 */ }
```

续命/结算/帮吃三处调用点都是现成函数,插回调即可。**网页版完全不受影响。**

### 2.4 工作量合计

原生接入 1-2 天 + 游戏逻辑 0.5 天 + 提审材料更新 0.5 天 ≈ **2-3 天**。

## 3. 合规四件套(比技术更重要)

| 项 | 要求 | 我们的选择 |
| --- | --- | --- |
| **ATT**(跟踪授权) | 投个性化广告必须弹 ATT 弹窗;用户拒绝 → 自动降级非个性化 | 弹。拒绝就拒绝,AdMob 自动处理 |
| **非个性化备选** | 不想弹 ATT 可全量非个性化(NPA) | 不推荐,eCPM 低 30-50% |
| **GDPR/UMP** | 2024/1 起欧盟无同意不出 AdMob 广告;用 Google UMP SDK 弹同意书(AdMob 后台配置消息) | 必接(UMP 与 ATT 弹窗可串联) |
| **App Privacy 标签** | 现在写的"不收集数据"必须改:广告要申报"设备标识符/广告数据" | 提审时更新;`APPSTORE.md` 元数据里"无广告"文案同步改 |

⚠️ 注意:**上架描述现在的卖点是"无广告、无内购、零收集"**。加广告是产品定位的取舍——建议 v1.0 先按纯净版上架攒五星口碑,v1.1 再加"只有自愿激励视频"的广告并如实更新文案(见 §6 路线)。

## 4. 别忽略:苹果还能做内购(微信个人主体做不到的)

- 与微信个人主体"禁止内购"不同,**苹果个人开发者可以开 IAP**。
- **Small Business Program**:年净收入 ≤ $100 万,佣金从 30% 降到 **15%**(2026 仍有效,需每年主动申请)。
- 适合本作的组合:**皮肤礼包**(把小卖部的碗/锅底做成 $0.99-2.99 包,竹签币照攒,买是捷径)+ **"请老板喝奶茶"打赏**($1.99,解锁鎏金碗之类的荣誉物)。
- 广告 + IAP 双轨是休闲游戏标准结构:大盘吃广告,1-3% 付费玩家贡献 IAP。

## 5. 彩蛋:网页版也能变现(AdSense H5 Games Ads)

Google 的 **H5 Games Ads(Ad Placement API)** 允许网页游戏放激励视频/插屏:`adBreak()/adConfig()` 两个函数接入,GitHub Pages 也能跑;需要 AdSense 账号 + H5 项目申请(审批制)。它甚至支持"H5 游戏跑在 App WebView 里与 AdMob 打通"的模式。若网页版流量起来,这是零原生代码的变现通道。

## 6. 收入现实预期(泼点冷水)

```
日收入 ≈ DAU × 人均激励观看次数 × eCPM / 1000
例:1000 DAU × 1.2 次/人 × $15 ≈ $18/天 ≈ $540/月
```

- 激励视频美区 eCPM 基准 ~$13-20(iOS 略高于 Android),头部优化到 $30-40。
- **规模决定一切**:广告是"锦上添花",不是商业模式;App Store 没有微信的关系链,冷启动靠 ASO 关键词、TikTok/小红书短视频、TestFlight 口碑。
- 微信版(若做)的想象空间更大:关系链裂变 + 流量主 70% 分成。两版共用一套游戏逻辑,不冲突。

## 7. 推荐路线

```
v1.0(现在就能提审) → 按 APPSTORE.md 纯净版上架:无广告无内购,攒评分与口碑
v1.1(上架后 2-4 周) → AdMob 激励视频(只做续命/翻倍/补帮吃三个自愿位)
                        + Game Center 排行榜 + 触觉反馈
                        + App Privacy 标签与描述如实更新
v1.2(看数据)       → IAP 皮肤礼包(15% 佣金档)/ AdMob mediation 抬价
```

---

## 参考来源

- [capacitor-community/admob(GitHub)](https://github.com/capacitor-community/admob)
- [Capacitor 官方 Ads 指南](https://capacitorjs.com/docs/guides/ads)
- [AdMob iOS 隐私策略(ATT/IDFA,官方)](https://developers.google.com/admob/ios/privacy/strategies)
- [AdMob IDFA/ATT 说明(官方)](https://developers.google.com/admob/ios/privacy/idfa)
- [UMP(GDPR 同意)实践](https://benbregman.medium.com/implementing-the-user-messaging-platform-ump-for-google-admob-on-ios-59ccce45647f)
- [Rewarded Video eCPM 基准 2025/2026(Business of Apps)](https://www.businessofapps.com/ads/rewarded-video/)
- [AdMob eCPM Benchmarks(Playwire)](https://www.playwire.com/blog/admob-ecpm-benchmarks-what-publishers-should-expect)
- [Apple Small Business Program(官方)](https://developer.apple.com/app-store/small-business-program/)
- [Small Business Program 2026 解读(RevenueCat)](https://www.revenuecat.com/blog/engineering/small-business-program)
- [AdSense H5 Games Ads(官方)](https://support.google.com/adsense/answer/9959170?hl=en)
- [H5 Games Ads 产品页](https://adsense.google.com/start/h5-games-ads/)
