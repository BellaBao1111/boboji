export type Lang = 'zh' | 'en';

interface LevelText {
  name: string;
  desc: string;
}

export interface Dict {
  pageTitle: string;
  // 首页
  badge: string;
  sub: string;
  start: string;
  howTo: string;
  langBtn: string; // 切换按钮显示的“对方语言”
  footer: string;
  // 选关
  menuTitle: string;
  back: string;
  notTried: string;
  lockedHint: string;
  bestPrefix: (score: number) => string;
  levels: Record<string, LevelText>;
  // HUD
  statLeft: string;
  statScore: string;
  helpEat: string;
  goalTip: string;
  comboPrefix: string;
  // 播报
  serve: (name: string) => string;
  digIn: string;
  refill: string;
  helperShout: string;
  winShout: string;
  loseShout: string;
  fullShout: string;
  // 飘字
  blocked: string[];
  golden: (sec: number) => string;
  deadlockGift: string;
  praises: [number, string][];
  // 暂停
  pauseTitle: string;
  pauseSub: string;
  resume: string;
  restart: string;
  changeBowl: string;
  // 结算
  winTitle: string;
  loseTitle: string;
  fullTitle: string;
  winSub: (name: string, total: number) => string;
  loseSub: (remaining: number) => string;
  fullSub: (picked: number) => string;
  rowPick: string;
  rowTime: string;
  rowCombo: string;
  rowBill: string;
  pickVal: (n: number) => string;
  billVal: (n: number) => string;
  scoreLabel: string;
  newRecord: string;
  nextBowl: string;
  oneMore: string;
  // 帮助
  helpTitle: string;
  gotIt: string;
  helpRows: { ico: string; title: string; body: string }[];
}

const ZH: Dict = {
  pageTitle: '钵钵鸡 · 签签拔起来',
  badge: '硅谷冷串串 · 巴适得板',
  sub: '红油签签 · 压住的莫拔 · 限时清盘',
  start: '开 吃 ！',
  howTo: '怎么玩',
  langBtn: 'English',
  footer: '作者：圣何塞椰子鸡 · 致敬我最好的成都友友们',
  menuTitle: '点 单',
  back: '返回',
  notTried: '还没吃过',
  lockedHint: '先吃上一碗',
  bestPrefix: (s) => `最高 ${s} 分`,
  levels: {
    l1: { name: '小碗', desc: '16 串 · 90 秒\n先垫个肚子' },
    l2: { name: '中碗', desc: '26 串 · 110 秒\n吃出节奏了' },
    l3: { name: '大盆', desc: '38 串 · 140 秒\n老板多舀点汤' },
    endless: { name: '流水席', desc: '吃不完根本吃不完\n拔一签回一口气' },
  },
  statLeft: '剩余签',
  statScore: '得分',
  helpEat: '帮吃',
  goalTip: '点没被压住的签 · 拖动空白处转视角',
  comboPrefix: '连击 ×',
  serve: (name) => `${name}上桌！`,
  digIn: '开吃！',
  refill: '老板加签！',
  helperShout: '友友帮吃！',
  winShout: '光盘咯！',
  loseShout: '时间到咯～',
  fullShout: '吃饱了！',
  blocked: ['压住了！', '上头有签！', '先拿上面的！', '莫急莫急！'],
  golden: (sec) => `黄金卤蛋 +${sec}s`,
  deadlockGift: '签签卡死了，友友来帮吃一口！',
  praises: [
    [3, '巴适！'],
    [5, '安逸～'],
    [8, '雄起！'],
    [12, '不摆了！'],
    [16, '神仙手速！'],
  ],
  pauseTitle: '歇口气',
  pauseSub: '汤还热着，签签不等人～',
  resume: '继续吃',
  restart: '重新上桌',
  changeBowl: '换个碗',
  winTitle: '光盘咯！',
  loseTitle: '时间到咯～',
  fullTitle: '吃饱了！',
  winSub: (name, total) => `「${name}」一共 ${total} 签，全部安排！`,
  loseSub: (remaining) => `还剩 ${remaining} 签没拔完，再来一盘嘛`,
  fullSub: (picked) => `流水席上一共拔了 <b>${picked}</b> 签`,
  rowPick: '拔签',
  rowTime: '用时',
  rowCombo: '最高连击',
  rowBill: '结账',
  pickVal: (n) => `${n} 签`,
  billVal: (n) => `${n * 2} 元`,
  scoreLabel: '总分',
  newRecord: ' · 🎉 新纪录！',
  nextBowl: '下一碗',
  oneMore: '再来一份',
  helpTitle: '怎么吃钵钵鸡',
  gotIt: '晓得了',
  helpRows: [
    {
      ico: '🍢',
      title: '只能拔没被压住的签',
      body: '签签在红汤里层层叠叠，上面压着别根签就拔不动，还要扣 2 秒！被压的签会闪红光提示。',
    },
    {
      ico: '⏱️',
      title: '限时拔完所有签',
      body: '手快连击有额外加分，连到位川妹儿直接开夸。金签卤蛋 +8 秒，看到先抢！',
    },
    {
      ico: '🥢',
      title: '卡住了喊友友帮吃',
      body: '成都友友出手，直接替你吃掉最上面 3 签——压住的也照吃！第几碗就有几次，真死锁了还免费送。',
    },
    {
      ico: '👆',
      title: '按住瞄准，松手才拔',
      body: '手指按住时瞄准的签会发光，可以按着微调，松手才算拔。拖动空白处旋转视角、滚轮/双指缩放。',
    },
  ],
};

const EN: Dict = {
  pageTitle: 'BoBoJi · Pull the Skewers',
  badge: 'Silicon Valley Cold Skewers · Bashi!',
  sub: 'Chili-oil skewers · Never pull a pinned one · Clear the bowl in time',
  start: 'DIG IN!',
  howTo: 'How to Play',
  langBtn: '中文',
  footer: 'By San Jose Coconut Chicken · A tribute to my best Chengdu friends',
  menuTitle: 'MENU',
  back: 'Back',
  notTried: 'Not tried yet',
  lockedHint: 'Clear the previous bowl',
  bestPrefix: (s) => `Best ${s}`,
  levels: {
    l1: { name: 'Small Bowl', desc: '16 skewers · 90s\nJust a warm-up' },
    l2: { name: 'Medium Bowl', desc: '26 skewers · 110s\nFinding the rhythm' },
    l3: { name: 'Big Basin', desc: '38 skewers · 140s\nExtra soup, boss!' },
    endless: { name: 'Endless Feast', desc: 'It never ends…\nEach pull buys you time' },
  },
  statLeft: 'Left',
  statScore: 'Score',
  helpEat: 'Help',
  goalTip: 'Tap unpinned skewers · Drag empty space to rotate',
  comboPrefix: 'Combo ×',
  serve: (name) => `${name} served!`,
  digIn: 'Dig in!',
  refill: 'More skewers!',
  helperShout: 'Friends help out!',
  winShout: 'All clear!',
  loseShout: "Time's up~",
  fullShout: 'So full!',
  blocked: ['Pinned!', 'One on top!', 'Top ones first!', 'Easy now!'],
  golden: (sec) => `Golden Egg +${sec}s`,
  deadlockGift: 'Gridlock! A friend takes a free bite!',
  praises: [
    [3, 'Bashi!'],
    [5, 'Tasty~'],
    [8, 'On fire!'],
    [12, 'Unstoppable!'],
    [16, 'Chopstick god!'],
  ],
  pauseTitle: 'Take a Breath',
  pauseSub: "Soup's still hot, skewers won't wait~",
  resume: 'Keep Eating',
  restart: 'Restart',
  changeBowl: 'Change Bowl',
  winTitle: 'All clear!',
  loseTitle: "Time's up~",
  fullTitle: 'So full!',
  winSub: (name, total) => `"${name}" — all ${total} skewers devoured!`,
  loseSub: (remaining) => `${remaining} skewers left — one more round?`,
  fullSub: (picked) => `Pulled <b>${picked}</b> skewers at the endless feast`,
  rowPick: 'Skewers',
  rowTime: 'Time',
  rowCombo: 'Best Combo',
  rowBill: 'Bill',
  pickVal: (n) => `${n}`,
  billVal: (n) => `¥${n * 2}`,
  scoreLabel: 'Total Score',
  newRecord: ' · 🎉 New record!',
  nextBowl: 'Next Bowl',
  oneMore: 'One More',
  helpTitle: 'How to Eat BoBoJi',
  gotIt: 'Got it',
  helpRows: [
    {
      ico: '🍢',
      title: 'Only pull unpinned skewers',
      body: 'Skewers pile up in the chili broth. If another skewer rests on top, it won\'t budge — and costs you 2 seconds! Blockers flash red to show you why.',
    },
    {
      ico: '⏱️',
      title: 'Clear the bowl before time runs out',
      body: 'Quick combos earn bonus points and Sichuan-style praise. Golden egg skewers give +8s — grab them fast!',
    },
    {
      ico: '🥢',
      title: 'Stuck? Call your friends',
      body: 'A Chengdu friend eats the top 3 skewers for you — pinned or not! Bowl number = number of helps, and a true gridlock earns a free one.',
    },
    {
      ico: '👆',
      title: 'Press to aim, release to pull',
      body: 'The skewer under your finger glows while you hold — adjust freely, release to pull. Drag empty space to rotate, scroll/pinch to zoom.',
    },
  ],
};

let current: Lang = 'zh';

export function initLang(saved: string | undefined) {
  current = saved === 'en' ? 'en' : 'zh';
}

export function getLang(): Lang {
  return current;
}

export function setLang(l: Lang) {
  current = l;
}

export function t(): Dict {
  return current === 'en' ? EN : ZH;
}
