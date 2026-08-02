import type { ModId, SkewerKind } from './config';
import type { LevelDef } from './config';

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
  btnDaily: string;
  btnCollection: string;
  // 选关
  menuTitle: string;
  back: string;
  notTried: string;
  lockedHint: string;
  bestPrefix: (score: number) => string;
  levels: Record<string, LevelText>;
  stageLabel: (n: number) => string;
  stageDesc: (count: number, time: number) => string;
  heroEat: string;
  heroCleared: string;
  feastTag: string;
  rewardTag: string;
  newBowlTag: string;
  modNames: Record<ModId, string>;
  modDescs: Record<ModId, string>;
  specialNames: Record<string, string>;
  specialTips: Record<string, string>;
  foodNames: Record<string, string>;
  shopTitle: string;
  collectionTitle: string;
  missionsTitle: string;
  coinName: string;
  // HUD
  statLeft: string;
  statScore: string;
  helpEat: string;
  goalTip: string;
  comboPrefix: string;
  frenzyTag: string;
  // 播报
  serve: (name: string) => string;
  digIn: string;
  refill: string;
  helperShout: string;
  winShout: string;
  loseShout: string;
  fullShout: string;
  reviveShout: string;
  // 飘字
  blocked: string[];
  golden: (sec: number) => string;
  deadlockGift: string;
  praises: [number, string][];
  bombDefused: (sec: number) => string;
  bombBoom: (sec: number) => string;
  chiliOn: string;
  magnetPull: string;
  // 暂停
  pauseTitle: string;
  pauseSub: string;
  resume: string;
  restart: string;
  changeBowl: string;
  // 续命
  reviveTitle: string;
  reviveSub: (n: number) => string;
  reviveFree: string;
  revivePaid: (c: number) => string;
  reviveGiveUp: string;
  // 结算
  winTitle: string;
  loseTitle: string;
  fullTitle: string;
  winSub: (name: string, total: number) => string;
  loseSub: (remaining: number) => string;
  nearMiss: (remaining: number) => string;
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
  oneMoreBowl: string;
  retryBowl: string;
  shareBtn: string;
  nextBowlTeaser: (name: string) => string;
  teaserFood: (name: string) => string;
  teaserSpecial: (name: string) => string;
  coinsEarned: (n: number) => string;
  // 任务/成就/称号
  missionNames: Record<string, string>;
  missionDone: (name: string, coins: number) => string;
  achieveNames: Record<string, string>;
  achieveDone: (name: string, coins: number) => string;
  titleUp: (title: string) => string;
  titleLabel: string;
  nextTitleIn: (n: number) => string;
  // 图鉴 / 战绩
  tabFoods: string;
  tabAchieves: string;
  statPulls: string;
  statGolden: string;
  statBowls: string;
  statBestCombo: string;
  statSpecials: string;
  statStage: string;
  eatenTimes: (n: number) => string;
  notEaten: string;
  lockedAchieve: string;
  // 小卖部
  slotBowl: string;
  slotBroth: string;
  skinNames: Record<string, string>;
  buy: string;
  equip: string;
  equipped: string;
  notEnough: string;
  streakGift: (n: number) => string;
  // 每日一钵
  dailyTitle: string;
  dailySub: string;
  dailyStart: string;
  dailyRetry: string;
  dailyDoneTag: string;
  dailyTodayDone: string;
  dailyStreak: (n: number) => string;
  dailyRules: string;
  dailyCalTitle: string;
  // 分享
  shareSave: string;
  shareCopy: string;
  shareCopied: string;
  shareClose: string;
  shareCardTitle: string;
  shareDaily: string;
  shareStageLine: (n: number, name: string) => string;
  shareInvite: string;
  // 帮助
  helpTitle: string;
  gotIt: string;
  helpRows: { ico: string; title: string; body: string }[];
}

const ZH: Dict = {
  pageTitle: '钵钵鸡 · 签签拔起来',
  badge: '硅谷冷串串 · 巴适得板',
  sub: '红油签签 · 压住的莫拔 · 一碗接一碗根本停不下来',
  start: '开 吃 ！',
  howTo: '怎么玩',
  langBtn: 'English',
  footer: '作者：圣何塞椰子鸡 · 致敬我最好的成都友友们',
  btnDaily: '📅 每日一钵',
  btnCollection: '📖 图鉴',
  menuTitle: '点 单',
  back: '返回',
  notTried: '还没吃过',
  lockedHint: '先吃上一碗',
  bestPrefix: (s) => `最高 ${s} 分`,
  levels: {
    l1: { name: '小碗', desc: '先垫个肚子' },
    l2: { name: '中碗', desc: '吃出节奏了' },
    l3: { name: '大盆', desc: '老板多舀点汤' },
    endless: { name: '流水席', desc: '吃不完根本吃不完\n拔一签回一口气' },
  },
  stageLabel: (n) => `第 ${n} 碗`,
  stageDesc: (c, t) => `${c} 串 · ${t} 秒`,
  heroEat: '开吃这碗！',
  heroCleared: '已光盘',
  feastTag: '坝坝宴 · 加量加时',
  rewardTag: '老板送的 · 轻松一碗',
  newBowlTag: '新碗',
  modNames: {
    fog: '雾锅',
    night: '深夜食堂',
    spin: '转桌',
    double: '麻辣双倍',
    eater: '大胃王',
  },
  modDescs: {
    fog: '蒸汽弥漫，看不清下层',
    night: '灯光昏暗，指哪亮哪',
    spin: '桌子在转，瞄准要跟上',
    double: '得分×2，时间收紧',
    eater: '吃得飞快，纯爽',
  },
  specialNames: {
    golden: '黄金卤蛋',
    bomb: '炮仗签',
    chili: '魔鬼椒',
    ghost: '幽灵签',
    magnet: '磁签',
  },
  specialTips: {
    bomb: '🧨 炮仗签：引线烧完会炸，抢先拔掉 +5s！',
    chili: '🌶️ 魔鬼椒：拔掉后 5 秒全场双倍分！',
    ghost: '👻 幽灵签：时隐时现，显形才拔得到！',
    magnet: '🧲 磁签：压住也能直接吸出来！',
  },
  foodNames: {
    egg: '鹌鹑蛋',
    lotus: '藕片',
    kelp: '海带结',
    gizzard: '郡肝',
    carrot: '胡萝卜',
    tofu: '豆皮卷',
    broccoli: '西兰花',
    beef: '牛肉',
    golden: '黄金卤蛋',
    ricecake: '年糕',
    tripe: '毛肚',
    aorta: '黄喉',
    brain: '脑花',
    chilifood: '魔鬼椒',
  },
  shopTitle: '小卖部',
  collectionTitle: '食客手册',
  missionsTitle: '每日三件事',
  coinName: '竹签币',
  statLeft: '剩余签',
  statScore: '得分',
  helpEat: '帮吃',
  goalTip: '点没被压住的签 · 拖动空白处转视角',
  comboPrefix: '连击 ×',
  frenzyTag: '双倍分！',
  serve: (name) => `${name}上桌！`,
  digIn: '开吃！',
  refill: '老板加签！',
  helperShout: '友友帮吃！',
  winShout: '光盘咯！',
  loseShout: '时间到咯～',
  fullShout: '吃饱了！',
  reviveShout: '再战！',
  blocked: ['压住了！', '上头有签！', '先拿上面的！', '莫急莫急！'],
  golden: (sec) => `黄金卤蛋 +${sec}s`,
  deadlockGift: '签签卡死了，友友来帮吃一口！',
  praises: [
    [3, '巴适！'],
    [5, '安逸～'],
    [8, '雄起！'],
    [12, '不摆了！'],
    [16, '神仙手速！'],
    [20, '签神下凡！'],
    [26, '开挂了嗦！'],
  ],
  bombDefused: (sec) => `拆弹成功 +${sec}s`,
  bombBoom: (sec) => `炸了！-${sec}s`,
  chiliOn: '上头了！双倍分 ×5s',
  magnetPull: '吸出来了！',
  pauseTitle: '歇口气',
  pauseSub: '汤还热着，签签不等人～',
  resume: '继续吃',
  restart: '重新上桌',
  changeBowl: '换个碗',
  reviveTitle: '就差一点！',
  reviveSub: (n) => `只剩 ${n} 签了，放弃可惜了嘛`,
  reviveFree: '老板加送 10 秒',
  revivePaid: (c) => `${c} 🎋 续 10 秒`,
  reviveGiveUp: '认输',
  winTitle: '光盘咯！',
  loseTitle: '时间到咯～',
  fullTitle: '吃饱了！',
  winSub: (name, total) => `「${name}」一共 ${total} 签，全部安排！`,
  loseSub: (remaining) => `还剩 ${remaining} 签没拔完，再来一盘嘛`,
  nearMiss: (remaining) => `就差 ${remaining} 签！老板都替你着急`,
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
  oneMoreBowl: '再来一碗！',
  retryBowl: '再拼一次！',
  shareBtn: '晒战绩',
  nextBowlTeaser: (name) => `下一碗 · ${name}`,
  teaserFood: (name) => `解锁新食材「${name}」`,
  teaserSpecial: (name) => `解锁「${name}」`,
  coinsEarned: (n) => `+${n} 🎋`,
  missionNames: {
    pull50: '拔签 50 根',
    pull120: '拔签 120 根',
    combo8: '达成一次 8 连击',
    combo12: '达成一次 12 连击',
    golden3: '吃 3 根金签',
    clear2: '光盘 2 次',
    nohelp: '不用帮吃光盘一次',
    fastwin: '剩 30% 时间光盘一次',
    special5: '拔 5 根特殊签',
    endless30: '流水席单局拔 30 签',
  },
  missionDone: (name, coins) => `任务完成「${name}」 +${coins} 🎋`,
  achieveNames: {
    pulls100: '百签斩',
    pulls1000: '千签宴',
    pulls5000: '五千签传说',
    combo15: '十五连神手',
    zeromiss: '零失误光盘',
    solo: '单挑一碗',
    golden50: '金蛋收藏家',
    bowl10: '十碗打卡',
    bowl25: '廿五碗常客',
    bowl50: '五十碗镇店',
    daily7: '连吃七天',
    rich: '千币富翁',
    foodie: '全食材图鉴',
    special20: '花活满级',
  },
  achieveDone: (name, coins) => `成就解锁「${name}」 +${coins} 🎋`,
  titleUp: (title) => `称号晋升「${title}」！`,
  titleLabel: '当前称号',
  nextTitleIn: (n) => `再拔 ${n} 签晋升`,
  tabFoods: '食材图鉴',
  tabAchieves: '成就',
  statPulls: '累计拔签',
  statGolden: '金签',
  statBowls: '光盘次数',
  statBestCombo: '最高连击',
  statSpecials: '特殊签',
  statStage: '吃到第几碗',
  eatenTimes: (n) => `吃过 ${n} 串`,
  notEaten: '还没吃过',
  lockedAchieve: '？？？',
  slotBowl: '碗',
  slotBroth: '锅底',
  skinNames: {
    porcelain: '青花瓷碗',
    clay: '老砂锅',
    steel: '不锈钢盆',
    blackpottery: '黑陶碗',
    gold: '鎏金碗',
    redoil: '红油锅底',
    clear: '清汤锅底',
    tomato: '番茄锅底',
    greenpepper: '青花椒锅底',
  },
  buy: '买',
  equip: '穿上',
  equipped: '用着呢',
  notEnough: '竹签币不够，再吃两碗嘛',
  streakGift: (n) => `连吃 ${n} 天赠品`,
  dailyTitle: '每日一钵',
  dailySub: '全球同一钵 · 一天一次',
  dailyStart: '今日开钵！',
  dailyRetry: '再试一次（成绩已记）',
  dailyDoneTag: '今日已光盘 ✓',
  dailyTodayDone: '今天吃过了，明天再来！',
  dailyStreak: (n) => `🔥 连吃 ${n} 天`,
  dailyRules: '日期就是菜单，全世界今天吃的都是同一钵。光盘续上打卡，连着吃有赠品！',
  dailyCalTitle: '最近七天',
  shareSave: '保存图片',
  shareCopy: '复制战绩文案',
  shareCopied: '已复制！发到群里去',
  shareClose: '关闭',
  shareCardTitle: '钵钵鸡 · 签签拔起来',
  shareDaily: '每日一钵',
  shareStageLine: (n, name) => `第 ${n} 碗「${name}」`,
  shareInvite: '你能吃到第几碗？',
  helpTitle: '怎么吃钵钵鸡',
  gotIt: '晓得了',
  helpRows: [
    {
      ico: '🍢',
      title: '只能拔没被压住的签',
      body: '签签在红汤里层层叠叠，上面压着别根签就拔不动，还要扣 2 秒！被压的签会闪红光提示。',
    },
    {
      ico: '🍲',
      title: '一碗接一碗，越吃越大',
      body: '光盘就上下一碗，碗越来越大、花样越来越多：坝坝宴、深碗、特殊签……看你能吃到第几碗！',
    },
    {
      ico: '⏱️',
      title: '手快有加分',
      body: '连击有额外加分，连到位川妹儿直接开夸。金签卤蛋 +8 秒，看到先抢！差一点点时老板还会送你续命。',
    },
    {
      ico: '🥢',
      title: '卡住了喊友友帮吃',
      body: '成都友友出手，直接替你吃掉最上面 3 签——压住的也照吃！真出现签签互相压死的死锁，友友会自动帮吃一根解开。',
    },
    {
      ico: '🎋',
      title: '竹签币换皮肤',
      body: '拔签、光盘、做每日任务都攒竹签币，去小卖部换砂锅、番茄锅底……全是装饰，不卖数值。',
    },
  ],
};

const EN: Dict = {
  pageTitle: 'BoBoJi · Pull the Skewers',
  badge: 'Silicon Valley Cold Skewers · Bashi!',
  sub: 'Chili-oil skewers · Never pull a pinned one · One bowl leads to another',
  start: 'DIG IN!',
  howTo: 'How to Play',
  langBtn: '中文',
  footer: 'By San Jose Coconut Chicken · A tribute to my best Chengdu friends',
  btnDaily: '📅 Daily Bowl',
  btnCollection: '📖 Collection',
  menuTitle: 'MENU',
  back: 'Back',
  notTried: 'Not tried yet',
  lockedHint: 'Clear the previous bowl',
  bestPrefix: (s) => `Best ${s}`,
  levels: {
    l1: { name: 'Small Bowl', desc: 'Just a warm-up' },
    l2: { name: 'Medium Bowl', desc: 'Finding the rhythm' },
    l3: { name: 'Big Basin', desc: 'Extra soup, boss!' },
    endless: { name: 'Endless Feast', desc: 'It never ends…\nEach pull buys you time' },
  },
  stageLabel: (n) => `Bowl ${n}`,
  stageDesc: (c, t) => `${c} skewers · ${t}s`,
  heroEat: 'EAT THIS BOWL!',
  heroCleared: 'Cleared',
  feastTag: 'Street Feast · Super-sized',
  rewardTag: 'On the house · Easy one',
  newBowlTag: 'NEW',
  modNames: {
    fog: 'Misty Pot',
    night: 'Midnight Diner',
    spin: 'Lazy Susan',
    double: 'Double Spice',
    eater: 'Big Eater',
  },
  modDescs: {
    fog: 'Thick steam hides the lower layers',
    night: 'Lights out — your finger is the torch',
    spin: 'The table keeps turning',
    double: 'Score ×2, tighter clock',
    eater: 'Eat at double speed, pure fun',
  },
  specialNames: {
    golden: 'Golden Egg',
    bomb: 'Firecracker',
    chili: 'Devil Pepper',
    ghost: 'Ghost Skewer',
    magnet: 'Magnet Skewer',
  },
  specialTips: {
    bomb: '🧨 Firecracker: pull before the fuse burns out for +5s!',
    chili: '🌶️ Devil Pepper: 5 seconds of double score after pulling!',
    ghost: '👻 Ghost Skewer: only pullable while visible!',
    magnet: '🧲 Magnet Skewer: slides out even when pinned!',
  },
  foodNames: {
    egg: 'Quail Egg',
    lotus: 'Lotus Root',
    kelp: 'Kelp Knot',
    gizzard: 'Gizzard',
    carrot: 'Carrot',
    tofu: 'Tofu Roll',
    broccoli: 'Broccoli',
    beef: 'Beef',
    golden: 'Golden Egg',
    ricecake: 'Rice Cake',
    tripe: 'Tripe',
    aorta: 'Aorta Slice',
    brain: 'Brain Flower',
    chilifood: 'Devil Pepper',
  },
  shopTitle: 'Corner Shop',
  collectionTitle: "Diner's Book",
  missionsTitle: 'Daily Tasks',
  coinName: 'Bamboo Coins',
  statLeft: 'Left',
  statScore: 'Score',
  helpEat: 'Help',
  goalTip: 'Tap unpinned skewers · Drag empty space to rotate',
  comboPrefix: 'Combo ×',
  frenzyTag: 'DOUBLE!',
  serve: (name) => `${name} served!`,
  digIn: 'Dig in!',
  refill: 'More skewers!',
  helperShout: 'Friends help out!',
  winShout: 'All clear!',
  loseShout: "Time's up~",
  fullShout: 'So full!',
  reviveShout: 'Round two!',
  blocked: ['Pinned!', 'One on top!', 'Top ones first!', 'Easy now!'],
  golden: (sec) => `Golden Egg +${sec}s`,
  deadlockGift: 'Gridlock! A friend takes a free bite!',
  praises: [
    [3, 'Bashi!'],
    [5, 'Tasty~'],
    [8, 'On fire!'],
    [12, 'Unstoppable!'],
    [16, 'Chopstick god!'],
    [20, 'Skewer deity!'],
    [26, 'Beyond human!'],
  ],
  bombDefused: (sec) => `Defused! +${sec}s`,
  bombBoom: (sec) => `BOOM! -${sec}s`,
  chiliOn: 'ON FIRE! ×2 score, 5s',
  magnetPull: 'Slurped out!',
  pauseTitle: 'Take a Breath',
  pauseSub: "Soup's still hot, skewers won't wait~",
  resume: 'Keep Eating',
  restart: 'Restart',
  changeBowl: 'Change Bowl',
  reviveTitle: 'SO CLOSE!',
  reviveSub: (n) => `Only ${n} left — don't give up now!`,
  reviveFree: 'Boss gives you 10s',
  revivePaid: (c) => `${c} 🎋 for 10s`,
  reviveGiveUp: 'Give up',
  winTitle: 'All clear!',
  loseTitle: "Time's up~",
  fullTitle: 'So full!',
  winSub: (name, total) => `"${name}" — all ${total} skewers devoured!`,
  loseSub: (remaining) => `${remaining} skewers left — one more round?`,
  nearMiss: (remaining) => `Just ${remaining} short! Even the boss is sweating`,
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
  oneMoreBowl: 'Next bowl!',
  retryBowl: 'Try again!',
  shareBtn: 'Share',
  nextBowlTeaser: (name) => `Next · ${name}`,
  teaserFood: (name) => `New food: ${name}`,
  teaserSpecial: (name) => `Unlocks: ${name}`,
  coinsEarned: (n) => `+${n} 🎋`,
  missionNames: {
    pull50: 'Pull 50 skewers',
    pull120: 'Pull 120 skewers',
    combo8: 'Hit an 8-combo',
    combo12: 'Hit a 12-combo',
    golden3: 'Eat 3 golden skewers',
    clear2: 'Clear 2 bowls',
    nohelp: 'Clear a bowl without help',
    fastwin: 'Clear with 30% time left',
    special5: 'Pull 5 special skewers',
    endless30: 'Pull 30 in one endless run',
  },
  missionDone: (name, coins) => `Task done: ${name} +${coins} 🎋`,
  achieveNames: {
    pulls100: 'Hundred Pulls',
    pulls1000: 'Thousand Skewer Feast',
    pulls5000: 'Legend of 5000',
    combo15: 'Fifteen-Combo Hands',
    zeromiss: 'Flawless Bowl',
    solo: 'Solo Bowl',
    golden50: 'Golden Egg Collector',
    bowl10: 'Ten Bowls In',
    bowl25: 'Bowl 25 Regular',
    bowl50: 'Fifty Bowl Legend',
    daily7: 'Seven-Day Streak',
    rich: 'Coin Collector',
    foodie: 'Full Menu Foodie',
    special20: 'Trick Skewer Pro',
  },
  achieveDone: (name, coins) => `Achievement: ${name} +${coins} 🎋`,
  titleUp: (title) => `New title: ${title}!`,
  titleLabel: 'Current Title',
  nextTitleIn: (n) => `${n} more pulls to rank up`,
  tabFoods: 'Foods',
  tabAchieves: 'Achievements',
  statPulls: 'Total Pulls',
  statGolden: 'Golden',
  statBowls: 'Bowls Cleared',
  statBestCombo: 'Best Combo',
  statSpecials: 'Specials',
  statStage: 'Furthest Bowl',
  eatenTimes: (n) => `Eaten ×${n}`,
  notEaten: 'Not yet',
  lockedAchieve: '???',
  slotBowl: 'Bowl',
  slotBroth: 'Broth',
  skinNames: {
    porcelain: 'Blue-White Porcelain',
    clay: 'Clay Pot',
    steel: 'Steel Basin',
    blackpottery: 'Black Pottery',
    gold: 'Gilded Bowl',
    redoil: 'Chili Oil',
    clear: 'Clear Broth',
    tomato: 'Tomato Broth',
    greenpepper: 'Green Pepper Broth',
  },
  buy: 'Buy',
  equip: 'Equip',
  equipped: 'Equipped',
  notEnough: 'Not enough coins — eat more bowls!',
  streakGift: (n) => `${n}-day streak gift`,
  dailyTitle: 'Daily Bowl',
  dailySub: 'Same bowl worldwide · Once a day',
  dailyStart: "Open today's bowl!",
  dailyRetry: 'Try again (score recorded)',
  dailyDoneTag: 'Cleared today ✓',
  dailyTodayDone: 'Done for today — come back tomorrow!',
  dailyStreak: (n) => `🔥 ${n}-day streak`,
  dailyRules: "The date is the menu — everyone on Earth eats the same bowl today. Clear it to keep your streak; streaks earn gifts!",
  dailyCalTitle: 'Last 7 days',
  shareSave: 'Save Image',
  shareCopy: 'Copy Text',
  shareCopied: 'Copied! Go brag',
  shareClose: 'Close',
  shareCardTitle: 'BoBoJi · Pull the Skewers',
  shareDaily: 'Daily Bowl',
  shareStageLine: (n, name) => `Bowl ${n} "${name}"`,
  shareInvite: 'How far can YOU eat?',
  helpTitle: 'How to Eat BoBoJi',
  gotIt: 'Got it',
  helpRows: [
    {
      ico: '🍢',
      title: 'Only pull unpinned skewers',
      body: "Skewers pile up in the chili broth. If another skewer rests on top, it won't budge — and costs you 2 seconds! Blockers flash red to show you why.",
    },
    {
      ico: '🍲',
      title: 'One bowl leads to another',
      body: 'Clear a bowl to unlock the next — bigger bowls, wilder twists: street feasts, deep bowls, trick skewers… How far can you eat?',
    },
    {
      ico: '⏱️',
      title: 'Fast hands earn more',
      body: 'Combos add bonus points and Sichuan-style praise. Golden eggs give +8s. And when you are THIS close, the boss may hand you extra seconds.',
    },
    {
      ico: '🥢',
      title: 'Stuck? Call your friends',
      body: 'A Chengdu friend eats the top 3 skewers for you — pinned or not! And if the pile truly gridlocks, a friend automatically takes one bite to unjam it.',
    },
    {
      ico: '🎋',
      title: 'Coins buy looks, not power',
      body: 'Pulls, clears and daily tasks earn bamboo coins. Spend them on clay pots and tomato broth at the corner shop — cosmetics only.',
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

/** 关卡显示名：经典碗走词典，无限碗用生成名 */
export function levelName(def: LevelDef): string {
  const d = t();
  if (d.levels[def.id]) return d.levels[def.id].name;
  return current === 'en' ? (def.nameEn ?? def.id) : (def.nameZh ?? def.id);
}
