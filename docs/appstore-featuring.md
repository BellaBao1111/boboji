# 🌟 钵钵鸡 App Store 编辑推荐(Featuring)打法

> 调研日期:2026-08。核心事实:**上推荐有官方提名通道,不是玄学,也不花钱**——
> App Store Connect 里的 Featuring Nominations 表单,人工编辑按地区挑选。
> 我们的任务是把"编辑爱看的点"逐条做实,然后在正确的时间窗口提名。

---

## 1. 官方通道:Featuring Nominations(免费,人工评审)

- 位置:**App Store Connect → 你的 App → Featuring Nominations**,可单条提交或 CSV 批量。
- 三种提名类型:**App Launch**(新游首发/预购)、**App Improvements**(大版本更新)、**New Content**(新内容/活动/促销)。
- **时间窗口是关键**:最少提前 2-3 周;首发想进"New Games We Love"建议提前 **6-8 周**;想蹭节日档期提前 **3 个月**。
- 提名怎么写(pitch 三要素):**有什么新东西 / 为什么是现在 / 面向哪些地区**。直接、聚焦、别写小作文。
- 所有推荐位(Today 的 App/Game of the Day、游戏板块合集、"我们喜爱的新游戏")都是**各地区编辑团队人工挑**的——本地化质量直接决定哪个区的编辑会看上你。

## 2. 编辑的评审标准 × 钵钵鸡的牌

官方公布的考量因素,对照我们手里的牌:

| 官方标准 | 我们的牌 | 状态 |
| --- | --- | --- |
| 独特性/创新 | **零素材程序化一切**(3D 模型/纹理/音效全代码生成)+ 真实物理拔签玩法 | ✅ 现成,写进 pitch 当主故事 |
| 故事性 | "硅谷工程师致敬成都友友"的情感故事 + 非遗小吃题材 | ✅ 编辑最爱 craft + 情怀 |
| 可重玩性 | 无限碗 + 每日一钵 + 收集图鉴 | ✅ 现成 |
| 音效音乐 | WebAudio 全合成(拔签"啵"、五声音阶连击) | ✅ 现成,pitch 里点一句 |
| 本地化 | 简中 + 英文已有;**建议加繁中**(港台新马编辑团队,川味文化契合度极高,竞争比美区小) | 🔨 i18n 架构现成,加一份词典即可 |
| 无障碍 | 目前无 | 🔨 低成本加分:减少动效开关、色弱友好签色、字号适配 |
| 产品页质量 | 截图规划已在 APPSTORE.md;**缺预览视频**(15-30s 拔签+连击爽感) | 🔨 上架前录制 |
| 评分 ≥4.0 | 90% 被推荐的 App 评分 ≥4.0 | 🔨 在"光盘拿三星"的高光时刻弹官方好评请求(SKStoreReviewController) |
| 技术采用 | 见 §3 | 🔨 |

## 3. Apple 技术采用清单(编辑明确偏爱"用了苹果技术"的游戏)

按投入产出排序,对 Capacitor 游戏都可行:

1. **Game Center 排行榜 + 成就**(最重要):我们已有 14 个成就 + 分数体系,映射到 Game Center 即可。
   **2025 年起苹果上线了独立的 Games App**(Home/Arcade/Play Together/Library 五个 tab),
   Game Center 的成就、排行榜、好友对比直接成为新的发现面——"和好友比谁吃到第几碗"在苹果生态里也成立了。不接 = 放弃一整个曝光渠道。
2. **触觉反馈**(@capacitor/haptics):拔签成功轻震、炮仗爆炸重震,半天工作量,体验和 pitch 都加分。
3. **iCloud 键值存档同步**:换机不丢"第 N 碗"进度。
4. 挑战赛/Widget/App Intents 等:锦上添花,以后再说。

## 4. In-App Events:反复上推荐的"长期通道"

- App Store Connect 可给每个活动建 **In-App Event**(带专属卡片),会出现在**产品页、搜索结果、Today/Games tab 的编辑精选**——这是老 App 反复获得曝光的机制,不只新游可用。
- 与我们设计文档里的节日限定完美咬合,活动日历建议:

| 时机 | 活动 | In-App Event 卡片 |
| --- | --- | --- |
| 每周末 | 坝坝宴周末(宴席碗掉落翻倍) | "周末坝坝宴开席!" |
| 中秋 | 月饼签限定食材 | 提前 3 个月提名,冲中秋合集 |
| 春节 | 汤圆签 + 红包皮肤 | 华人题材游戏的黄金档期 |
| 5 月 | 517 吃货节(谐音"我要吃") | 川味主题日 |

- 每个 event 同时提交一条 New Content 类型的 Featuring Nomination。

## 5. 执行时间线(把 §2-4 串起来)

```
上架前 6-8 周   提交 App Launch 提名(pitch:零素材程序化+成都情怀+物理玩法)
                同步做:繁中本地化 / Game Center / 触觉 / 预览视频 / 好评弹窗
上架当周        冲 "New Games We Love"(只给新游,首发窗口别浪费——别裸发!)
每个大版本      App Improvements 提名(例:v1.1 "特殊签种登场")
每个节日活动    In-App Event + New Content 提名(节日提前 3 个月)
持续            维持 4.5+ 评分、崩溃率低、快速修复差评提到的问题
```

## 6. 现实预期

- 提名没有回复保证,编辑不解释落选原因;被选中会收到 App Store Connect 通知并提供社媒素材。
- 独立游戏被推荐的常见画像:**craft 故事强 + 本地化用心 + 文化时刻契合**——我们三样全占,尤其适合打**港台新马中文区编辑**(题材契合、竞争小)和**美区亚裔美食文化时刻**。
- 推荐带来的是脉冲流量,留存靠游戏本身——好在上瘾循环我们已经建好了。

---

## 参考来源

- [Getting featured on the App Store(苹果官方标准)](https://developer.apple.com/app-store/getting-featured/)
- [Featuring Nominations 提交指南(App Store Connect Help)](https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring/)
- [In-App Events(苹果官方)](https://developer.apple.com/app-store/in-app-events)
- [In-App Events 概览(App Store Connect Help)](https://www.developer.apple.com/help/app-store-connect/offer-in-app-events/overview-of-in-app-events)
- [How to get featured 2026(AppTweak)](https://www.apptweak.com/en/aso-blog/how-to-get-your-app-featured-on-the-app-store)
- [Get Featured 2026: 7 Apple Criteria(App Screenshot Studio)](https://appscreenshotstudio.com/blog/get-featured-on-the-app-store-2026-nominations-guide)
- [苹果发布独立 Games App(TechCrunch, WWDC 2025)](https://techcrunch.com/2025/06/09/apple-debuts-a-new-dedicated-games-app-at-wwdc-2025)
- [In-App Events 对 ASO 的影响(AppTweak)](https://www.apptweak.com/en/aso-blog/what-are-in-app-events-how-do-they-impact-aso)
