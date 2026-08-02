# 🍢 BoBoJi (钵钵鸡) · Pull the Skewers

> Silicon Valley Cold Skewers · Bashi! ——— A 3D physics skewer-pulling game inspired by "Catch the Goose" (抓大鹅)
>
> **By San Jose Coconut Chicken · A tribute to my best Chengdu friends** ❤️

*[中文版在下面](#-钵钵鸡--签签拔起来) · English default? No — the game defaults to Chinese, toggle English on the title screen.*

A basin of scalding chili broth, dozens of bamboo skewers criss-crossed on top of each other. **A skewer pinned under another one won't budge** — read the pile, find the free skewers, and clear the whole basin before time runs out. Every pulled skewer gets eaten on the spot; the bare stick drops into the counting cup. Count the sticks, pay the bill!

![screenshot](docs/screenshot.jpg)

**🎮 Play online**: <https://bellabao1111.github.io/boboji/>

## How to Play

- 🍢 **Tap an unpinned skewer** to pull and eat it; the bare stick lands in the counting cup
- 🎯 **Hover (desktop) or press-and-hold (mobile)** — the targeted skewer gets a bright orange outline; release to pull
- ⛔ Tapping a **pinned skewer** costs 2 seconds; the blockers flash red to show you why
- ⚡ Quick **combos** earn bonus points and Sichuan-style praise ("Bashi!")
- 🥢 Stuck? **Call your friends**: a Chengdu friend eats the top 3 skewers for you, pinned or not (a true gridlock auto-resolves — a friend takes one bite for free)
- 💪 **So close?** When you time out with just a few skewers left, the boss hands you 10 extra seconds — first one's on the house
- 🌐 **Bilingual**: Chinese by default, one-tap English toggle on the title screen (remembered)

### Endless bowl progression

Bowls never run out: clear one and the next is served, procedurally generated with a sawtooth difficulty curve — every 5th bowl is a super-sized **Street Feast** 🎉, every 4th is an easy **On-the-House** 🎁 breather, deep bowls pile skewers into gnarlier tangles, and modifier bowls remix the rules (Misty Pot 🌫️, Midnight Diner 🕯️, Lazy Susan 🎡, Double Spice 🌶️, Big Eater 🐷). New foods (rice cake, tripe, aorta, brain flower…) and trick skewers unlock as you eat deeper. **How far can you eat?**

| Trick skewer | Rule |
| --- | --- |
| 🌟 Golden Egg | +8s, +300 pts |
| 🧨 Firecracker | pull before the fuse burns: +5s; boom: −5s |
| 🌶️ Devil Pepper | 5 seconds of double score |
| 👻 Ghost Skewer | only pullable while visible |
| 🧲 Magnet Skewer | slides out even when pinned |

### Daily Bowl & more

- 📅 **Daily Bowl**: the date seeds the layout — everyone on Earth eats the same bowl today. Clear it to keep your streak (7-day streak earns the Gilded Bowl 🏆)
- ♾️ **Endless Feast**: each pull buys time, refills every 11 pulls — chase the high score
- 🎋 **Bamboo coins** from pulls, clears and daily tasks buy **cosmetic skins** at the corner shop (clay pot, steel basin, tomato / green-pepper broth…) — looks only, never power
- 📖 **Diner's Book**: food gallery, 14 achievements, and titles from *Skewer Apprentice* all the way to *BoBoJi Grandmaster*
- 📤 **Share card**: one tap renders your result as a canvas-drawn card + emoji text to brag in the group chat

Stars (★★★) are awarded by remaining time; everything is saved in localStorage.

## Tech Notes

**Zero external assets**: every 3D model is procedural, every texture is canvas-drawn, every sound is WebAudio-synthesized — no image, model, or audio files in the repo (except the README screenshot 😄).

| Module | Approach |
| --- | --- |
| Rendering | [Three.js](https://threejs.org/): ACES tone mapping, PCF soft shadows, room-environment reflections |
| Physics | [Rapier](https://rapier.rs/) (WASM). Each skewer = a thin capsule stick + convex food colliders as one rigid body; the bowl wall & rounded rim are rings of tilted convex boxes (avoiding trimesh pitfalls) |
| **Pin detection** | Iterate the skewer's **contact pairs**; if a contact-manifold normal's vertical component > 0.42, the other skewer is resting on top. Pulling = removing the rigid body, so upper layers collapse in real time |
| Food modeling | Lotus root (真 holes via ExtrudeGeometry), kelp knots (torus knot), quail eggs, gizzards (noise-displaced icosahedra), carrot slices, fried tofu rolls, broccoli, beef — plus the golden braised egg. Chili-oil coating = clearcoat material |
| Broth | Custom shader: fbm oil swirls, glints, event-driven ripple rings; chili flakes / peppercorns / scallions / sesame are instanced particles in a slow circular current |
| Highlight | Normal-inflated back-face shell outline — clearly visible on any food color (emissive glow alone is invisible on white food) |
| Effects | Oil-splash particle pool, three-phase pull animation (lift → bite-by-bite eating → stick into cup), steam sprites, camera shake, floating HTML text |
| Audio | All WebAudio-synthesized: the "pop" of a pull, crunching, stick drops, pentatonic combo chimes, the dull thud of a pinned tap |

### Anti-frustration design

Blockers flash red on a failed tap, an idle hint glows a pullable skewer (ripples point to submerged ones), a mutually-pinned gridlock is auto-resolved by a friend eating one skewer, escaped skewers are fished back into the bowl, and tapping empty broth makes playful ripples.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # output in dist/
```

Debug mode: append `?debug=1` and use `__boboji` in the console (`freeIds()` / `tryPick(id)` / `setTime(s)` / `startLevel(id)`).

Pushing to `main` auto-builds and deploys to GitHub Pages (see `.github/workflows/deploy.yml`; select "GitHub Actions" as the Pages source once in repo Settings).

## Credits

- Gameplay inspiration: the WeChat mini-game "Catch the Goose" (抓大鹅)
- Technical references: [a front-end 抓大鹅 write-up (Juejin)](https://juejin.cn/post/7375090667732680758), [Yuming0929/goose-catch](https://github.com/Yuming0929/goose-catch)
- Designed & built with [Claude Code](https://claude.com/claude-code)

---

# 🍢 钵钵鸡 · 签签拔起来

> 硅谷冷串串 · 巴适得板 ——— 一款灵感来自「抓大鹅」的 3D 物理拔签小游戏
>
> **作者：圣何塞椰子鸡 · 谨以此游戏致敬我最好的成都友友们** ❤️

一钵滚烫红汤，几十根竹签层层叠叠压在一起。**上面压着别根签的签是拔不动的** —— 看清层叠关系、找到"自由"的签，在时间耗尽前把整钵签签全部安排！拔出的签当场吃掉，光签落进签筒，数签结账。

**🎮 在线试玩**：<https://bellabao1111.github.io/boboji/>

## 玩法

- 🍢 **点击没被压住的签**把它拔出来吃掉，光签会落进旁边的签筒计数
- 🎯 **悬停（电脑）/ 按住（手机）**：瞄准的签会亮橙色描边，松手才拔
- ⛔ 点到**被压住的签**：扣 2 秒，压住它的"元凶"会闪红光提示
- ⚡ 手快**连击**有额外加分，连到位川妹儿开夸：巴适！安逸～雄起！
- 🥢 卡住了喊**友友帮吃**：直接替你吃掉最上面 3 签（压住的也照吃）；签签互相压死的死锁会被自动识别，友友帮吃一根解开
- 💪 **就差一点？** 超时时只剩几签，老板会再送你 10 秒——第一次免费
- 🌐 中英双语：默认中文，首页一键切换 English（选择会记住）

### 无限碗：一碗接一碗

光盘就上下一碗，碗永远吃不完——程序化生成 + 锯齿难度：每 5 碗一场加量加时的**坝坝宴** 🎉，每 4 碗一份轻松的**老板送菜** 🎁，深碗把签堆得更深更纠缠，修饰词碗换着花样整活（雾锅 🌫️ / 深夜食堂 🕯️ / 转桌 🎡 / 麻辣双倍 🌶️ / 大胃王 🐷）。越吃越深还会解锁新食材（年糕、毛肚、黄喉、脑花……）和特殊签。**看你能吃到第几碗！**

| 特殊签 | 规则 |
| --- | --- |
| 🌟 黄金卤蛋 | +8 秒 +300 分 |
| 🧨 炮仗签 | 引线烧完会炸：抢拔 +5s，炸了 −5s |
| 🌶️ 魔鬼椒 | 拔掉后 5 秒全场双倍分 |
| 👻 幽灵签 | 时隐时现，显形才拔得到 |
| 🧲 磁签 | 压住也能直接吸出来 |

### 每日一钵 & 更多

- 📅 **每日一钵**：日期就是菜单，全世界今天吃的都是同一钵。光盘续上打卡，连吃 7 天送鎏金碗 🏆
- ♾️ **流水席**：拔一签回一口气，每 11 签"老板加签！"，冲最高分
- 🎋 **竹签币**：拔签、光盘、每日三件事都攒币，小卖部换**纯装饰皮肤**（老砂锅、不锈钢盆、番茄/青花椒锅底……）不卖数值
- 📖 **食客手册**：食材图鉴、14 个成就、称号从"拔签学徒"一路吃到"钵钵鸡非遗传承人"
- 📤 **晒战绩**：一键生成 Canvas 手绘分享卡 + emoji 战绩文案，发到群里攀比

按剩余时间结星（★★★），全部进度存在本地 localStorage。

## 技术实现

**零外部资源**：所有 3D 模型程序化生成、所有纹理 Canvas 绘制、所有音效 WebAudio 合成——仓库里没有一张图片、一个模型文件、一条音频（README 截图除外 😄）。

| 模块 | 方案 |
| --- | --- |
| 渲染 | [Three.js](https://threejs.org/)：ACES 色调映射、PCF 软阴影、房间环境反射 |
| 物理 | [Rapier](https://rapier.rs/)（WASM）：每根签 = 细胶囊签身 + 各食材凸体的复合刚体；碗壁与碗口圆唇用两圈斜置凸盒拼成，避开 Trimesh 碰撞的坑 |
| **压签判定** | 遍历该签所有碰撞体的**接触对**，取接触流形法线：法线竖直分量 > 0.42 即"对方压在我上面"。拔签 = 移除刚体，上层实时塌落重排 |
| 食材建模 | 藕片（带孔 ExtrudeGeometry）、海带结（环面纽结）、鹌鹑蛋、郡肝（噪声凸包）、胡萝卜片、金黄豆皮卷、西兰花、牛肉片 + 金签卤蛋；红油挂汁 = clearcoat 清漆材质 |
| 红汤 | 自定义 shader：fbm 油花回旋 + 油光闪点 + 事件驱动涟漪环；辣椒碎/花椒/葱花/芝麻是带环流场与推开力的实例化粒子 |
| 高亮 | 沿法线膨胀的背面壳描边——任何底色的食材上都清晰可见（白色食材光靠自发光看不出来） |
| 特效 | 红油飞溅粒子池、三段式拔签动画（拔出→逐口吃→光签入筒）、蒸汽 sprite、相机震动、HTML 飘字 |
| 音效 | 全部 WebAudio 现场合成：拔签"啵"、咀嚼、光签入筒、连击五声音阶、被压闷响 |

### 防挫败设计

被压时闪红光标出元凶、静默提示可拔的签、互相压死的死锁自动帮吃一根解开、飞出碗外的签自动捞回、点空汤面也能拨出涟漪解压。

## 本地开发

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 产物在 dist/
```

调试模式：URL 加 `?debug=1`，控制台可用 `__boboji`（`freeIds()` / `tryPick(id)` / `setTime(s)` / `startLevel(id)` 等）。

推送到 `main` 会自动构建并部署 GitHub Pages（见 `.github/workflows/deploy.yml`）。

## 参考与致谢

- 玩法灵感：微信小游戏「抓大鹅」
- 技术路线参考：[前端实现"抓大鹅"游戏（掘金）](https://juejin.cn/post/7375090667732680758)、[Yuming0929/goose-catch](https://github.com/Yuming0929/goose-catch)
- 使用 [Claude Code](https://claude.com/claude-code) 设计与实现

🌶️ 吃好喝好，签签拔完再走～
