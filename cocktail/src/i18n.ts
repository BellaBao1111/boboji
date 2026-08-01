// ============ 双语文案：默认中文，一键切换 English ============

export type Lang = 'zh' | 'en';

export interface Dict {
  pageTitle: string;
  barName: string;
  neonName: string;
  langBtn: string;
  // 顶栏
  book: string;
  // 材料架分组
  catSpirit: string;
  catLiqueur: string;
  catMixer: string;
  catOther: string;
  // 操作
  actIceNone: string;
  actIceCube: string;
  actIceCrushed: string;
  actMuddle: string;
  actStir: string;
  actShake: string;
  actServe: string;
  actDump: string;
  // 模式提示
  stirHint: string;
  shakeHint: string;
  shakeMotionBtn: string;
  muddleHint: string;
  cancel: string;
  // 飘字 / 提示
  toastFull: string;
  toastEmpty: string;
  toastDumped: string;
  toastMintRaw: string;
  overflow: string;
  mlSuffix: (n: number) => string;
  dashSuffix: (n: number) => string;
  leafSuffix: (n: number) => string;
  // 结果页
  newDiscovery: string;
  knownRecipe: string;
  creationTitle: string;
  creationSub: string;
  plainDrink: (name: string) => string;
  disasterTitle: string;
  intoBook: string;
  intoDark: string;
  again: string;
  openBook: string;
  techWrongJoke: (recipe: string) => string;
  nearMissRatio: (recipe: string) => string;
  nearMissTech: string;
  nearMissMuddle: string;
  nearMissMissing: Record<string, string>;
  attrNames: [string, string, string, string, string];
  abvLabel: (pct: string) => string;
  alcoholFree: string;
  // 图鉴
  bookTitle: string;
  tabClassic: string;
  tabCreation: string;
  tabDark: string;
  progress: (n: number, total: number) => string;
  lockedName: string;
  creationEmpty: string;
  darkEmpty: string;
  madeTimes: (n: number) => string;
  close: string;
  bestStars: string;
  recipeOf: string;
  techLabel: Record<string, string>;
  muddleMark: string;
  // 引导
  introTitle: string;
  introLines: string[];
  introStart: string;
  // 首页 & 模式
  tagline: string;
  startNight: string;
  freePlay: string;
  totalTips: (n: number) => string;
  nightsPlayed: (n: number) => string;
  discoveredShort: (n: number, total: number) => string;
  // 营业模式
  custProgress: (i: number, n: number) => string;
  nightMoney: (n: number) => string;
  nextCustomer: string;
  closeNight: string;
  tipGain: (n: number) => string;
  noTip: string;
  secretTag: string;
  nightTitle: string;
  nightIncome: (n: number) => string;
  gradeText: (g: string) => string;
  nightAgain: string;
  backHome: string;
  newNightRecord: string;
  // 杂项
  statMade: (n: number) => string;
  measureOn: string;
  measureOff: string;
}

export const DICTS: Record<Lang, Dict> = {
  zh: {
    pageTitle: '摇摇酒馆 · 深夜调酒小游戏',
    barName: '摇摇酒馆',
    neonName: '摇摇酒馆',
    langBtn: 'EN',
    book: '酒谱',
    catSpirit: '基酒',
    catLiqueur: '利口 · 味美思',
    catMixer: '果汁 · 汽水',
    catOther: '糖 · 香料',
    actIceNone: '无冰',
    actIceCube: '方冰',
    actIceCrushed: '碎冰',
    actMuddle: '捣',
    actStir: '搅拌',
    actShake: '摇和',
    actServe: '上酒',
    actDump: '倒掉',
    stirHint: '在杯子附近画圈搅拌 ↻',
    shakeHint: '快速甩动指针（或狂按空格）摇它！',
    shakeMotionBtn: '📳 用手机摇一摇',
    muddleHint: '连点杯子，把香气捣出来！',
    cancel: '算了',
    toastFull: '满了满了！杯子快装不下了',
    toastEmpty: '杯子还是空的，先倒点什么吧',
    toastDumped: '倒掉重来，当无事发生',
    toastMintRaw: '薄荷好像没什么味道……要不要捣一捣？',
    overflow: '溢出来了！',
    mlSuffix: (n) => `${n} ml`,
    dashSuffix: (n) => `${n} 滴`,
    leafSuffix: (n) => `${n} 片`,
    newDiscovery: '新发现',
    knownRecipe: '经典再现',
    creationTitle: '本店特调',
    creationSub: '一杯没有名字的酒……现在有了。',
    plainDrink: (name) => `就是一杯${name}，很诚实。`,
    disasterTitle: '翻车了',
    intoBook: '已记入酒谱图鉴',
    intoDark: '已收进黑历史',
    again: '再调一杯',
    openBook: '翻翻酒谱',
    techWrongJoke: (recipe) => `味道是${recipe}的味道，但手法不太对哦（行家皱了皱眉）`,
    nearMissRatio: (recipe) => `离一杯经典只差一点点……比例再琢磨琢磨？`,
    nearMissTech: '材料都对，要不要换个手法试试？',
    nearMissMuddle: '闻起来少了点香气……薄荷是不是该捣一捣？',
    nearMissMissing: {
      sour: '感觉离一杯经典很近了……好像少了点酸？',
      sweet: '感觉离一杯经典很近了……好像少了点甜？',
      fizz: '感觉离一杯经典很近了……好像少了点气泡？',
      bitter: '感觉离一杯经典很近了……好像少了一点点苦？',
      mint: '感觉离一杯经典很近了……好像少了点绿色的东西？',
      strong: '感觉离一杯经典很近了……好像还缺一味酒？',
      other: '感觉离一杯经典很近了……好像还少一样东西？',
    },
    attrNames: ['烈', '甜', '酸', '苦', '泡'],
    abvLabel: (pct) => `酒精度约 ${pct}`,
    alcoholFree: '无酒精 · 放心喝',
    bookTitle: '酒谱图鉴',
    tabClassic: '经典',
    tabCreation: '本店特调',
    tabDark: '黑历史',
    progress: (n, total) => `已发现 ${n} / ${total}`,
    lockedName: '？？？',
    creationEmpty: '还没有你发明的酒。\n随便倒点什么，说不定就是名作。',
    darkEmpty: '还没有翻过车。\n（要不要试试摇一摇可乐？）',
    madeTimes: (n) => `调过 ${n} 次`,
    close: '关闭',
    bestStars: '最佳',
    recipeOf: '配方',
    techLabel: { build: '直调', stir: '搅拌', shake: '摇和' },
    muddleMark: '需捣',
    introTitle: '欢迎来到摇摇酒馆',
    introLines: [
      '按住瓶子往杯里倒，倒多倒少全看手感',
      '摇和、搅拌、捣一捣——手法决定一杯酒的命运',
      '调中经典会解锁酒谱；调出怪东西……也会被记住',
    ],
    introStart: '开始调酒',
    tagline: '深夜雨窗下的小酒馆。客人点的不是酒名，是心情。',
    startNight: '开始营业',
    freePlay: '随心调',
    totalTips: (n) => `累计小费 ¥${n}`,
    nightsPlayed: (n) => `营业 ${n} 晚`,
    discoveredShort: (n, total) => `酒谱 ${n}/${total}`,
    custProgress: (i, n) => `第 ${i}/${n} 位客人`,
    nightMoney: (n) => `今晚 ¥${n}`,
    nextCustomer: '下一位客人',
    closeNight: '打烊结算',
    tipGain: (n) => `小费 +¥${n}`,
    noTip: '没有小费……',
    secretTag: '🤫 善意的谎言，小费加倍',
    nightTitle: '🌙 今夜打烊',
    nightIncome: (n) => `今晚收入 ¥${n}`,
    gradeText: (g) => `本晚评级 ${g}`,
    nightAgain: '再营业一晚',
    backHome: '回首页',
    newNightRecord: '🎉 单晚新纪录！',
    statMade: (n) => `第 ${n} 杯`,
    measureOn: '量酒器：开',
    measureOff: '量酒器：关（凭手感！）',
  },
  en: {
    pageTitle: 'The Tipsy Shaker · a late-night mixing game',
    barName: 'The Tipsy Shaker',
    neonName: 'TIPSY SHAKER',
    langBtn: '中文',
    book: 'Book',
    catSpirit: 'Spirits',
    catLiqueur: 'Liqueurs & Vermouth',
    catMixer: 'Juice & Fizz',
    catOther: 'Sugar & Spice',
    actIceNone: 'No Ice',
    actIceCube: 'Cubes',
    actIceCrushed: 'Crushed',
    actMuddle: 'Muddle',
    actStir: 'Stir',
    actShake: 'Shake',
    actServe: 'Serve',
    actDump: 'Dump',
    stirHint: 'Draw circles near the glass to stir ↻',
    shakeHint: 'Wiggle the pointer fast (or mash Space) to shake!',
    shakeMotionBtn: '📳 Shake your phone',
    muddleHint: 'Tap the glass to muddle the aroma out!',
    cancel: 'Never mind',
    toastFull: 'Whoa — the glass is nearly full!',
    toastEmpty: 'The glass is empty. Pour something first.',
    toastDumped: 'Down the drain. Nothing happened here.',
    toastMintRaw: 'The mint tastes like… nothing. Maybe muddle it?',
    overflow: 'Overflowing!',
    mlSuffix: (n) => `${n} ml`,
    dashSuffix: (n) => `${n} dash`,
    leafSuffix: (n) => `${n} leaves`,
    newDiscovery: 'New Discovery',
    knownRecipe: 'Classic, again',
    creationTitle: 'House Special',
    creationSub: 'A drink with no name… until now.',
    plainDrink: (name) => `It's just a glass of ${name}. Honest.`,
    disasterTitle: 'Disaster',
    intoBook: 'Recorded in your recipe book',
    intoDark: 'Filed under Dark History',
    again: 'Mix Another',
    openBook: 'Open the Book',
    techWrongJoke: (recipe) => `Tastes like a ${recipe}, but the technique was… creative. (A connoisseur winces.)`,
    nearMissRatio: () => 'So close to a classic… maybe tweak the ratio?',
    nearMissTech: 'Right ingredients — maybe try a different technique?',
    nearMissMuddle: 'Something aromatic is missing… should the mint be muddled?',
    nearMissMissing: {
      sour: 'So close to a classic… missing something sour?',
      sweet: 'So close to a classic… missing something sweet?',
      fizz: 'So close to a classic… missing some bubbles?',
      bitter: 'So close to a classic… missing a touch of bitter?',
      mint: 'So close to a classic… missing something green?',
      strong: 'So close to a classic… missing a spirit?',
      other: 'So close to a classic… one thing short?',
    },
    attrNames: ['ABV', 'Sweet', 'Sour', 'Bitter', 'Fizz'],
    abvLabel: (pct) => `~${pct} ABV`,
    alcoholFree: 'Alcohol-free · safe to chug',
    bookTitle: 'Recipe Book',
    tabClassic: 'Classics',
    tabCreation: 'House Specials',
    tabDark: 'Dark History',
    progress: (n, total) => `Discovered ${n} / ${total}`,
    lockedName: '???',
    creationEmpty: 'No inventions yet.\nPour something random — it might be a masterpiece.',
    darkEmpty: 'No disasters yet.\n(Have you tried shaking cola?)',
    madeTimes: (n) => `Mixed ${n}×`,
    close: 'Close',
    bestStars: 'Best',
    recipeOf: 'Recipe',
    techLabel: { build: 'Build', stir: 'Stir', shake: 'Shake' },
    muddleMark: 'Muddle',
    introTitle: 'Welcome to The Tipsy Shaker',
    introLines: [
      'Hold a bottle to pour — how much is up to your hands',
      'Shake, stir, muddle — technique decides a drink\'s fate',
      'Nail a classic to unlock it; mix something weird… it will be remembered too',
    ],
    introStart: 'Start Mixing',
    tagline: 'A tiny bar behind a rainy window. Customers order moods, not names.',
    startNight: 'Open the Bar',
    freePlay: 'Free Mix',
    totalTips: (n) => `Tips earned $${n}`,
    nightsPlayed: (n) => `${n} nights open`,
    discoveredShort: (n, total) => `Recipes ${n}/${total}`,
    custProgress: (i, n) => `Customer ${i}/${n}`,
    nightMoney: (n) => `Tonight $${n}`,
    nextCustomer: 'Next Customer',
    closeNight: 'Close Up',
    tipGain: (n) => `Tip +$${n}`,
    noTip: 'No tip…',
    secretTag: '🤫 A kind lie — double tip',
    nightTitle: '🌙 Closing Time',
    nightIncome: (n) => `Tonight's take: $${n}`,
    gradeText: (g) => `Night grade: ${g}`,
    nightAgain: 'Open Another Night',
    backHome: 'Home',
    newNightRecord: '🎉 New single-night record!',
    statMade: (n) => `Drink #${n}`,
    measureOn: 'Jigger: ON',
    measureOff: 'Jigger: OFF (free pour!)',
  },
};
