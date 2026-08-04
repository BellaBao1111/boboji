# 钵钵鸡 · App Store 上架手册

> 本文档由 Claude 于 2026-07-29 生成。iOS 工程已全部就绪，照着下面一步步走即可上架。
> 遇到问题随时回来找 Claude：装好 Xcode 后直接说「帮我构建并在模拟器里跑钵钵鸡」。

## 已经帮你完成的 ✅

| 事项 | 说明 |
|---|---|
| iOS 原生工程 | `ios/` 目录，Capacitor 8（SPM 模式，无需 CocoaPods） |
| Bundle ID | `com.bellabao.boboji`（可在 Xcode 里改，上传前改都来得及） |
| App 图标 | 红油碗签签原创设计，源图 `assets/icon-only.png`，全尺寸已生成 |
| 启动屏 | 深色红油 + 毛笔金字「钵钵鸡」，浅色/深色模式各一套 |
| 字体离线化 | 两款中文字体已子集化打进包里（OFL 开源协议，可合法分发），游戏完全离线可玩 |
| 状态栏隐藏 | 全屏沉浸式游戏体验 |
| 音频会话 | 静音拨键不再静音游戏音效；不打断用户自己在放的音乐 |
| 出口合规 | `ITSAppUsesNonExemptEncryption=false` 已声明，每次提审少答一问 |
| 隐私政策页 | https://bellabao1111.github.io/boboji/privacy.html （随 GitHub Pages 部署） |
| 屏幕方向 | iPhone 竖屏+横屏、iPad 全方向（游戏自适应窗口尺寸） |
| **Game Center** | 原生插件已就绪（`GameCenterPlugin.swift`，entitlement 已配）：自动登录、2 个排行榜上报、14 个成就同步、图鉴页内打开 GC 面板。App Store Connect 侧配置见下方专章 |
| **好评弹窗** | `AppReviewPlugin.swift`：光盘拿三星的高光时刻请求评分；游戏侧节流（光盘≥3 碗、14 天一次、至多 3 次），系统再限流一层 |
| **繁体中文** | 游戏内第三语言（简中 → 繁體 → English 循环切换，含全部文案/碗名/称号）；上架时可加 zh-Hant 商店元数据，冲港台新马编辑推荐 |
| **隐私清单** | app 级 `PrivacyInfo.xcprivacy`：不追踪、零数据收集、无需声明理由的 API——与「数据不收集」隐私标签互相印证 |
| **图标名随系统语言** | 中文设备显示「钵钵鸡」、繁体设备「缽缽雞」、英文设备「BoBoJi」（InfoPlist.strings 三语），商店产品页「语言」栏正确列出简繁英 |
| **发版冒烟测试** | `tests/smoke.mjs`：Playwright 自动跑 启动→三语→开局→拔签→压签判定→暂停→通关→存档 十项检查（用法见文件头注释） |

## 你需要亲自做的三件大事

1. **安装 Xcode**（免费，~12 GB，App Store 下载，建议现在就开始挂着）
2. **注册 Apple Developer Program**（$99/年，https://developer.apple.com/programs/enroll/）
3. **在 App Store Connect 建 App 并提审**（材料本文全部备好）

---

## 第 1 步：安装 Xcode

从 Mac App Store 搜索 "Xcode" 安装（或 https://developer.apple.com/xcode/）。装完后在终端执行：

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
xcodebuild -downloadPlatform iOS
```

最后一条会下载 iOS 模拟器运行时（几个 GB，耐心等）。

## 第 2 步：本地跑通（模拟器）

```bash
npx cap open ios
```

Xcode 打开后：顶部设备选 **iPhone 16 Pro** 模拟器 → 按 **⌘R** 运行。第一次会自动解析 Swift Package 依赖，等一两分钟。

> 也可以装好 Xcode 后直接让 Claude 来：构建、跑模拟器、截上架截图都能代劳。

**日常开发循环**：改了游戏代码后执行 `npm run build && npx cap sync ios`，再在 Xcode 里 ⌘R。网页版和 App 共用同一套代码，GitHub Pages 部署不受任何影响。

## 第 3 步：注册 Apple Developer Program

- 地址：https://developer.apple.com/programs/enroll/，用你的 Apple ID 登录，$99/年
- **个人账户**：最快，但 App Store 卖家名会显示你的**真实姓名**（不是笔名「圣何塞椰子鸡」）
- **公司账户**：卖家名显示公司名，需要 DUNS 编号，周期长很多。个人开发者选个人即可
- 审核通常 1~2 天，期间可以继续做第 2 步的事

## 第 4 步：签名

Xcode 左栏点蓝色 **App** 项目 → TARGETS 选 **App** → **Signing & Capabilities**：

- 勾选 "Automatically manage signing"
- Team 选你的开发者账号（Xcode → Settings → Accounts 里先登录 Apple ID）
- 若提示 Bundle ID 被占用，改一个（如 `com.bellabao.boboji2026`），App Store Connect 里保持一致即可

## 第 5 步：App Store Connect 建 App

https://appstoreconnect.apple.com → 我的 App → ➕ 新建 App：

| 字段 | 填写 |
|---|---|
| 平台 | iOS |
| 名称 | 钵钵鸡·签签拔起来（若被占用，备选：钵钵鸡：红油拔签、川味钵钵鸡） |
| 主要语言 | 简体中文 |
| Bundle ID | 选 `com.bellabao.boboji` |
| SKU | boboji2026（随意，用户不可见） |

### ⚠️ 中国大陆区的特别提醒

2023 年起，App 要在**中国大陆区** App Store 上架必须提供 **ICP 备案号**，海外个人开发者基本办不了。
建议：**定价与销售范围**里去掉中国大陆，保留美国、加拿大、新加坡、港澳台等地区 —— 海外川渝老乡照样吃得到。

## 第 6 步：截图（必需）

规格（2026 年现行要求，二选一即可，Apple 会自动缩放到其他尺寸）：

- **iPhone 6.9"**：1320×2868（竖）或 2868×1320（横）—— iPhone 16 Pro Max 模拟器直出
- **iPad 13"**：2064×2752 或 2752×2064 —— iPad Pro 13" 模拟器直出（因为工程支持 iPad，此组必需）

模拟器里跑起游戏后截图：**⌘S** 直接存桌面，或：

```bash
xcrun simctl io booted screenshot shot1.png
```

建议 4~6 张的内容编排：
1. 标题页（「钵钵鸡」毛笔大字 + 红油碗）
2. 游戏中：签签堆叠的碗 + 倒计时
3. 高亮瞄准一根签的瞬间（体现「压住的莫拔」）
4. 连击飘字「巴适！」「雄起！」
5. 结算页（光盘咯！+ 结账 XX 元）
6. 流水席模式

> 让 Claude 代劳也行：「帮我在模拟器里截 6 张上架截图」。

## 第 7 步：填元数据（直接复制粘贴）

### 简体中文（主语言）

**副标题**（30 字内）：
```
红油签签，考验手速眼力的 3D 拔签
```

**推广文本**（170 字内，可随时改）：
```
硅谷冷串串开碗了！红油打底，签签入汤，压住的莫拔，限时清盘。巴适得板！
```

**描述**：
```
红油熬好了，签签上桌了——开吃！

「钵钵鸡」是一款 3D 物理拔签小游戏：一碗红油冷串串，签签层层叠叠泡在汤里。你的任务只有一个——在时间耗尽前，把它们全部拔出来。

但是记到起：压住的莫拔！
每根签都有真实的物理堆叠，上头压着别根签就拔不动，硬扯还要扣时间。看准了、瞄稳了，一根一根安排。

【怎么耍】
· 点没被压住的签，拔起就吃
· 手快连击有加分，川妹儿在线开夸：巴适！安逸！雄起！
· 金签卤蛋 +8 秒，看到先抢
· 卡壳了喊成都友友帮吃，压住的也照吃
· 拖动空白处转视角，换个角度找签签

【菜单】
· 小碗 / 中碗 / 大盆：从垫肚子吃到扶墙出
· 流水席：吃不完根本吃不完，拔一签回一口气

【放心吃】
· 完全离线，无广告、无内购、不收集任何数据
· 全 3D 物理引擎，每一碗的堆法都不重样
· 原创程序化美术与音效，川味拉满

来嘛，签签拔起来！
```

**关键词**（100 字符内，半角逗号分隔）：
```
钵钵鸡,串串,冷串串,拔签,休闲,益智,物理,3D,川菜,成都,小游戏,解压,单机,离线
```

**技术支持网址**：`https://github.com/BellaBao1111/boboji/issues`
**隐私政策网址**：`https://bellabao1111.github.io/boboji/privacy.html`

### English (U.S.)（添加英文本地化，覆盖海外市场）

- **Name**: BoBoJi: Pull the Skewers
- **Subtitle**: `3D physics skewer-pulling puzzle`
- **Description**:
```
The chili oil is ready, the skewers are stacked — dig in!

BoBoJi is a 3D physics puzzle inspired by Sichuan bobo chicken (cold skewers in chili broth). Skewers pile up in the bowl; your job: pull them ALL out before time runs out.

One rule: never pull a pinned skewer!
Every skewer stacks with real physics. If another one rests on top, it won't budge — and costs you precious seconds. Aim smart, pull clean.

HOW TO PLAY
· Tap unpinned skewers to pull and eat
· Chain quick pulls for combo bonuses and Sichuan-style praise
· Golden egg skewers add +8s — grab them fast
· Stuck? Call a Chengdu friend to eat the top 3 for you
· Drag to rotate the bowl and scout your next pull

MENU
· Small Bowl / Medium Bowl / Big Basin — from warm-up to feast
· Endless Feast — it never ends; each pull buys you time

WORRY-FREE
· Fully offline, no ads, no purchases, zero data collection
· Real 3D physics — every bowl stacks differently
· Original procedural art & sound, full Sichuan flavor

Come on — pull those skewers!
```
- **Keywords**: `skewer,bobo,chicken,sichuan,puzzle,physics,3d,casual,pull,pick,offline,zen,chengdu,food`

### 其他设置

| 项目 | 选择 |
|---|---|
| 分类 | 游戏 › 益智解谜（次分类：休闲） |
| 价格 | 免费（Price Schedule 选 USD 0） |
| App 隐私 | 「不收集数据」（Data Not Collected，一路选否即可，与隐私政策一致） |
| 年龄分级 | 问卷全选"无" → 4+ |
| 版权 | 2026 BellaBao |
| 登录信息 | 无需登录，Sign-in required 不勾 |

## 第 7.5 步：Game Center 配置（App Store Connect）

App Store Connect → 你的 App → **服务 › Game Center**，创建以下 ID（代码里已写死，照抄即可）：

**排行榜（经典排行榜，整数，越大越好）**

| ID | 名称建议 | 说明 |
|---|---|---|
| `boboji.stage` | 吃到第几碗 | 无限进度最高碗号 |
| `boboji.endless` | 流水席最高分 | 无尽模式单局分数 |

**成就（全部一次性，100% 解锁）**——ID = `boboji.ach.` + 游戏内成就 id：

`boboji.ach.pulls100`（百签斩）、`pulls1000`（千签宴）、`pulls5000`（五千签传说）、`combo15`（十五连神手）、`zeromiss`（零失误光盘）、`solo`（单挑一碗）、`golden50`（金蛋收藏家）、`bowl10`（十碗打卡）、`bowl25`（廿五碗常客）、`bowl50`（五十碗镇店）、`daily7`（连吃七天）、`rich`（千币富翁）、`foodie`（全食材图鉴）、`special20`（花活满级）

> 每个成就需要一张 512×512 图标（可用食材缩略图风格让 Claude 生成）；成就分值总和 ≤1000，14 个成就建议每个 50~100 分。
> 未登录 GC 的玩家一切照旧（上报静默跳过）；提审时记得在 App Store Connect 勾选该版本启用 Game Center。

## 第 8 步：Archive 上传

1. Xcode 顶部设备选 **Any iOS Device (arm64)**
2. 菜单 **Product → Archive**
3. 弹出 Organizer → **Distribute App → App Store Connect → Upload**，一路默认
4. 10~30 分钟后构建出现在 App Store Connect → 你的 App → **TestFlight/构建版本** 里
5. 回到 App Store 页签，版本信息里**选择该构建版本**，保存 → **提交以供审核**

（可选）先用 **TestFlight** 发给成都友友们内测：TestFlight 页签 → 内部测试 → 添加测试员邮箱。

## 第 9 步：审核

- 一般 24~72 小时出结果，节假日顺延
- 本 App 无账号、无内购、无网络请求、素材全原创、字体 OFL 协议 —— 常见拒审雷区都已避开
- 若被问「为什么请求网络」：App 不发任何请求，可直接回复 fully offline
- 审核通过后默认自动发布（可在提交时改成手动发布）

## 版本更新流程（以后每次）

```bash
# 1. 改代码 → 2. 构建同步
npm run build && npx cap sync ios
# 3. Xcode 里把 Version 改成 1.1（Build 自动或 +1）→ Archive → Upload
# 4. App Store Connect 建新版本，填「此版本的新增内容」→ 提审
```

## 以后可以加的料（v1.1+ 建议）

- **Game Center 排行榜**：全球拔签手速榜（Capacitor 社区插件可接）
- **触觉反馈**：拔签成功震一下更爽（@capacitor/haptics）
- **iPad 布局微调**：大屏 UI 间距优化
- **本地化扩展**：繁中、日语（游戏 i18n 架构已就绪）
