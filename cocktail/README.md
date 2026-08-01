# 🍸 摇摇酒馆 · The Tipsy Shaker

> 深夜调酒小游戏 —— 像塞尔达做饭一样自由混合材料：调中经典解锁酒谱，调出怪东西……也会被记住。
>
> A late-night cocktail mixing game. Mix anything, Zelda-cooking style: nail a classic to unlock it, or invent something weird and it gets a name of its own.

BoBoJi（钵钵鸡）的姊妹作，同一仓库的 `/cocktail/` 子页面。设计文档见 [`docs/cocktail-game-design.md`](../docs/cocktail-game-design.md)。

## 玩法 / How to Play

**两种模式**：🌙 **营业模式**（主玩法）——客人以点单小票上门：有的只说心情（"来杯苦一点的，我想清醒地难过"），有的直接报酒名（长岛冰茶！）；照着酒谱手册调出来，按满足度拿小费，一晚 6 位客人后打烊结算评级。🧪 **随心调**——无压力沙盒，自由实验。8 种客人各有脾气：健身达人滴酒不沾、老饕点名考经典、微醺常客藏着一个善意的彩蛋、颜值党只看颜色……

**16 种材料**（悬停可看属性卡）、**14 款经典配方**：酒谱手册从一开始就写明配比 / 技法 / 用冰 / 要不要捣，调成过的会点亮配图和星级。

- 🫗 **按住瓶子**往杯里倒，按多久倒多少，全看手感（顶栏可关掉量酒器读数，进入 Free Pour 模式）
- 🥄 **技法决定命运**：摇和（快速甩动指针 / 狂按空格 / 手机真摇）、搅拌（围着杯子画圈）、捣（连点杯子）
- 🧊 无冰 / 方冰 / 碎冰，冰会稀释
- 🛎️ **上酒判定**：材料 + 比例 + 技法命中经典鸡尾酒 → 按误差评 1~3 星并解锁图鉴；没命中 → 属性引擎给这杯自创酒起名（同配方永远同名）
- 🌋 **黑历史**：摇碳酸会喷、纯烈酒混饮会放倒客人、苦精按滴算……失败也是收藏品
- 📖 酒谱图鉴：14 款经典（含无酒精）、本店特调（你的发明）、黑历史
- 🌐 默认中文，一键切换 English；进度存 localStorage

## 技术 / Tech

像素风渲染：画布以 1/3 分辨率绘制再放大（image-rendering: pixelated），得到真像素颗粒；场景全部 Canvas2D 手绘（雨夜窗景、霓虹招牌、吊灯光锥、液体分层与气泡），音效全部 WebAudio 现场合成。中文像素字体使用 [缝合像素字体 Fusion Pixel Font](https://github.com/TakWolf/fusion-pixel-font)（SIL OFL 1.1）按用字子集化（约 40KB）。判定核心是属性引擎：每种材料带 烈/甜/酸/苦/气泡/密度/颜色 向量，成品实时计算，OKLab 加权混色。

模块：`data.ts`（材料/配方/词库）· `engine.ts`（属性引擎与判定）· `scene.ts`（Canvas 渲染）· `ui.ts`（DOM 界面）· `sfx.ts`（合成音效）· `i18n.ts` · `store.ts`

## 开发 / Dev

```bash
npm install
npm run dev      # http://localhost:5173/cocktail/
npm run build    # 与主游戏一起构建到 dist/cocktail/
```

部署跟随主仓库的 GitHub Pages workflow：合并到 `main` 后地址为 `https://<user>.github.io/boboji/cocktail/`。
