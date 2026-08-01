// ============ 数据层：材料 / 配方 / 词库 / 灾难 ============

export type Cat = 'spirit' | 'liqueur' | 'mixer' | 'other';
export type Unit = 'ml' | 'dash' | 'leaf';
export type Tech = 'build' | 'stir' | 'shake';

export interface Ing {
  id: string;
  zh: string;
  en: string;
  cat: Cat;
  /** 液体颜色（sRGB hex） */
  color: string;
  /** 不透明度 0~1（烈酒接近透明，果汁/奶油不透明） */
  opacity: number;
  /** 酒精度 0~1 */
  abv: number;
  sweet: number; // 0~10
  sour: number;
  bitter: number;
  fizz: number;
  /** 相对密度，分层用（大的沉底） */
  density: number;
  unit: Unit;
  /** 倒酒速率 ml/s（ml 类）*/
  rate: number;
  tag?: 'herbal' | 'citrus' | 'mint' | 'creamy' | 'spicy' | 'coffee';
}

const ing = (o: Ing) => o;

export const INGREDIENTS: Ing[] = [
  // —— 基酒 ——
  ing({ id: 'gin',      zh: '金酒',       en: 'Gin',            cat: 'spirit',  color: '#d8e6e2', opacity: 0.14, abv: 0.4, sweet: 0, sour: 0, bitter: 1, fizz: 0, density: 0.95, unit: 'ml', rate: 30, tag: 'herbal' }),
  ing({ id: 'vodka',    zh: '伏特加',     en: 'Vodka',          cat: 'spirit',  color: '#e8edf2', opacity: 0.10, abv: 0.4, sweet: 0, sour: 0, bitter: 0, fizz: 0, density: 0.95, unit: 'ml', rate: 30 }),
  ing({ id: 'rum',      zh: '白朗姆',     en: 'White Rum',      cat: 'spirit',  color: '#efe3cf', opacity: 0.14, abv: 0.4, sweet: 1, sour: 0, bitter: 0, fizz: 0, density: 0.95, unit: 'ml', rate: 30 }),
  ing({ id: 'tequila',  zh: '龙舌兰',     en: 'Tequila',        cat: 'spirit',  color: '#eee7d0', opacity: 0.14, abv: 0.4, sweet: 0, sour: 0, bitter: 1, fizz: 0, density: 0.95, unit: 'ml', rate: 30 }),
  ing({ id: 'whisky',   zh: '威士忌',     en: 'Whisky',         cat: 'spirit',  color: '#d29a4b', opacity: 0.55, abv: 0.4, sweet: 1, sour: 0, bitter: 2, fizz: 0, density: 0.96, unit: 'ml', rate: 30 }),
  // —— 利口酒 / 味美思 ——
  ing({ id: 'triplesec', zh: '橙皮利口酒', en: 'Triple Sec',     cat: 'liqueur', color: '#f3d9a4', opacity: 0.30, abv: 0.30, sweet: 6, sour: 0, bitter: 0, fizz: 0, density: 1.04, unit: 'ml', rate: 26, tag: 'citrus' }),
  ing({ id: 'campari',   zh: '金巴利',     en: 'Campari',        cat: 'liqueur', color: '#d63a4e', opacity: 0.78, abv: 0.25, sweet: 3, sour: 0, bitter: 8, fizz: 0, density: 1.06, unit: 'ml', rate: 26 }),
  ing({ id: 'svermouth', zh: '甜味美思',   en: 'Sweet Vermouth', cat: 'liqueur', color: '#8e3b47', opacity: 0.62, abv: 0.16, sweet: 5, sour: 0, bitter: 3, fizz: 0, density: 1.04, unit: 'ml', rate: 26 }),
  ing({ id: 'dvermouth', zh: '干味美思',   en: 'Dry Vermouth',   cat: 'liqueur', color: '#dfe3c8', opacity: 0.26, abv: 0.17, sweet: 1, sour: 1, bitter: 2, fizz: 0, density: 1.00, unit: 'ml', rate: 26 }),
  ing({ id: 'kahlua',    zh: '咖啡利口酒', en: 'Coffee Liqueur', cat: 'liqueur', color: '#3a2418', opacity: 0.94, abv: 0.20, sweet: 7, sour: 0, bitter: 4, fizz: 0, density: 1.14, unit: 'ml', rate: 26, tag: 'coffee' }),
  // —— 果汁 / 汽水 ——
  ing({ id: 'lime',      zh: '青柠汁',     en: 'Lime Juice',     cat: 'mixer',   color: '#cfe8a8', opacity: 0.58, abv: 0, sweet: 0, sour: 9, bitter: 0, fizz: 0, density: 1.03, unit: 'ml', rate: 40, tag: 'citrus' }),
  ing({ id: 'lemon',     zh: '柠檬汁',     en: 'Lemon Juice',    cat: 'mixer',   color: '#f2eaa0', opacity: 0.52, abv: 0, sweet: 0, sour: 8, bitter: 0, fizz: 0, density: 1.03, unit: 'ml', rate: 40, tag: 'citrus' }),
  ing({ id: 'oj',        zh: '橙汁',       en: 'Orange Juice',   cat: 'mixer',   color: '#f5a623', opacity: 0.92, abv: 0, sweet: 5, sour: 3, bitter: 0, fizz: 0, density: 1.04, unit: 'ml', rate: 55 }),
  ing({ id: 'cranberry', zh: '蔓越莓汁',   en: 'Cranberry',      cat: 'mixer',   color: '#c8323e', opacity: 0.82, abv: 0, sweet: 4, sour: 4, bitter: 0, fizz: 0, density: 1.04, unit: 'ml', rate: 55 }),
  ing({ id: 'cola',      zh: '可乐',       en: 'Cola',           cat: 'mixer',   color: '#3a2a20', opacity: 0.88, abv: 0, sweet: 7, sour: 0, bitter: 1, fizz: 7, density: 1.04, unit: 'ml', rate: 60 }),
  ing({ id: 'tonic',     zh: '汤力水',     en: 'Tonic',          cat: 'mixer',   color: '#eef4f0', opacity: 0.12, abv: 0, sweet: 2, sour: 0, bitter: 2, fizz: 8, density: 1.00, unit: 'ml', rate: 60 }),
  ing({ id: 'soda',      zh: '苏打水',     en: 'Soda',           cat: 'mixer',   color: '#f0f6f8', opacity: 0.08, abv: 0, sweet: 0, sour: 0, bitter: 0, fizz: 8, density: 1.00, unit: 'ml', rate: 60 }),
  ing({ id: 'ginger',    zh: '姜汁汽水',   en: 'Ginger Beer',    cat: 'mixer',   color: '#e8c76a', opacity: 0.48, abv: 0, sweet: 4, sour: 1, bitter: 0, fizz: 7, density: 1.02, unit: 'ml', rate: 60, tag: 'spicy' }),
  ing({ id: 'cream',     zh: '奶油',       en: 'Cream',          cat: 'mixer',   color: '#f6f1e6', opacity: 1.0, abv: 0, sweet: 2, sour: 0, bitter: 0, fizz: 0, density: 1.02, unit: 'ml', rate: 35, tag: 'creamy' }),
  // —— 其他 ——
  ing({ id: 'syrup',     zh: '糖浆',       en: 'Syrup',          cat: 'other',   color: '#f0e8d8', opacity: 0.38, abv: 0, sweet: 10, sour: 0, bitter: 0, fizz: 0, density: 1.32, unit: 'ml', rate: 22 }),
  ing({ id: 'grenadine', zh: '红石榴糖浆', en: 'Grenadine',      cat: 'other',   color: '#c2183c', opacity: 0.88, abv: 0, sweet: 9, sour: 0, bitter: 0, fizz: 0, density: 1.18, unit: 'ml', rate: 22 }),
  ing({ id: 'mint',      zh: '薄荷叶',     en: 'Mint',           cat: 'other',   color: '#3f9e63', opacity: 1.0, abv: 0, sweet: 0, sour: 0, bitter: 0, fizz: 0, density: 0.5, unit: 'leaf', rate: 0, tag: 'mint' }),
  ing({ id: 'bitters',   zh: '苦精',       en: 'Bitters',        cat: 'other',   color: '#6b3226', opacity: 0.9, abv: 0.44, sweet: 0, sour: 0, bitter: 10, fizz: 0, density: 1.05, unit: 'dash', rate: 0 }),
];

export const ING_BY_ID: Record<string, Ing> = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

// ---------------- 配方 ----------------

export interface RecipeItem {
  id: string;
  /** ml 目标量；dash/leaf 单位时是个数 */
  amount: number;
  /** 相对容差（默认 0.35），实际容差 = max(amount*tol, 8ml / 1dash / 1leaf) */
  tol?: number;
}

export interface Recipe {
  id: string;
  zh: string;
  en: string;
  items: RecipeItem[];
  /** 允许的技法 */
  tech: Tech[];
  /** 需要捣过（薄荷类） */
  muddle?: boolean;
  /** 必须保持分层（搅/摇会毁掉它） */
  keepLayers?: boolean;
  alcoholFree?: boolean;
  /** 图鉴谜语提示 */
  hintZh: string;
  hintEn: string;
  /** 解锁后的一句风味小注 */
  loreZh: string;
  loreEn: string;
  /** 结果画杯型 */
  glass: 'highball' | 'rocks' | 'martini' | 'flute';
}

const r = (o: Recipe) => o;

export const RECIPES: Recipe[] = [
  r({
    id: 'gintonic', zh: '金汤力', en: 'Gin & Tonic', glass: 'highball',
    items: [{ id: 'gin', amount: 45 }, { id: 'tonic', amount: 120 }],
    tech: ['build'],
    hintZh: '两样东西的极简经典，微苦的气泡是灵魂。',
    hintEn: 'Two ingredients, one classic. Bitter bubbles are the soul.',
    loreZh: '殖民地军官的奎宁药水，被金酒拯救成了传世饮品。',
    loreEn: 'Quinine medicine rescued by gin into immortality.',
  }),
  r({
    id: 'cubalibre', zh: '自由古巴', en: 'Cuba Libre', glass: 'highball',
    items: [{ id: 'rum', amount: 45 }, { id: 'cola', amount: 110 }, { id: 'lime', amount: 10 }],
    tech: ['build'],
    hintZh: '朗姆遇到最流行的黑色汽水，再挤一点酸。',
    hintEn: 'Rum meets the world\'s favorite dark fizz, plus a squeeze of sour.',
    loreZh: '一句"自由古巴！"的干杯口号，变成了一杯酒的名字。',
    loreEn: 'A toast of "¡Cuba Libre!" that became a drink.',
  }),
  r({
    id: 'screwdriver', zh: '螺丝起子', en: 'Screwdriver', glass: 'highball',
    items: [{ id: 'vodka', amount: 45 }, { id: 'oj', amount: 110 }],
    tech: ['build'],
    hintZh: '据说工人用某种工具搅过这杯橙色的酒。',
    hintEn: 'Legend says a worker stirred this orange drink with a tool.',
    loreZh: '油田工人没有吧勺，就用螺丝刀搅了搅。',
    loreEn: 'No bar spoon on the oil rig — a screwdriver did the job.',
  }),
  r({
    id: 'moscowmule', zh: '莫斯科骡子', en: 'Moscow Mule', glass: 'rocks',
    items: [{ id: 'vodka', amount: 45 }, { id: 'ginger', amount: 110 }, { id: 'lime', amount: 15 }],
    tech: ['build'],
    hintZh: '一头辛辣的骡子，踢你一口姜味。',
    hintEn: 'A spicy mule with a gingery kick.',
    loreZh: '本该用铜杯装，但骡子不挑杯子。',
    loreEn: 'Traditionally in copper — but the mule won\'t mind.',
  }),
  r({
    id: 'mojito', zh: '莫吉托', en: 'Mojito', glass: 'highball',
    items: [{ id: 'rum', amount: 45 }, { id: 'lime', amount: 20 }, { id: 'syrup', amount: 15 }, { id: 'soda', amount: 80 }, { id: 'mint', amount: 4 }],
    tech: ['build'], muddle: true,
    hintZh: '把夏天捣碎，兑上气泡。海明威可能喜欢过它。',
    hintEn: 'Muddle the summer, top with bubbles. Hemingway may have approved.',
    loreZh: '薄荷要捣不要切，香气是拍出来的。',
    loreEn: 'Muddle, don\'t chop — aroma is coaxed, not forced.',
  }),
  r({
    id: 'virginmojito', zh: '无酒精莫吉托', en: 'Virgin Mojito', glass: 'highball',
    items: [{ id: 'lime', amount: 25 }, { id: 'syrup', amount: 20 }, { id: 'soda', amount: 110 }, { id: 'mint', amount: 4 }],
    tech: ['build'], muddle: true, alcoholFree: true,
    hintZh: '清醒版的夏天，待会还要开会也能喝。',
    hintEn: 'Sober summer — safe even before a meeting.',
    loreZh: '不喝酒的人也值得一杯像样的鸡尾酒。',
    loreEn: 'Teetotalers deserve a proper cocktail too.',
  }),
  r({
    id: 'daiquiri', zh: '大吉利', en: 'Daiquiri', glass: 'martini',
    items: [{ id: 'rum', amount: 50 }, { id: 'lime', amount: 25 }, { id: 'syrup', amount: 15 }],
    tech: ['shake'],
    hintZh: '朗姆、酸、甜，摇到冰凉——名字听起来就很吉利。',
    hintEn: 'Rum, sour, sweet — shaken ice-cold. The lucky classic.',
    loreZh: '酸甜平衡的教科书，调酒师的第一课。',
    loreEn: 'The textbook of balance — every bartender\'s first lesson.',
  }),
  r({
    id: 'gimlet', zh: '吉姆雷特', en: 'Gimlet', glass: 'martini',
    items: [{ id: 'gin', amount: 55 }, { id: 'lime', amount: 20 }, { id: 'syrup', amount: 12 }],
    tech: ['shake'],
    hintZh: '"真正的吉姆雷特"该怎么调？钱德勒的马洛有过答案。',
    hintEn: 'Chandler\'s Marlowe knew what a real one should be.',
    loreZh: '一半金酒一半青柠糖浆？现代人还是喜欢清爽点。',
    loreEn: 'Half gin, half lime cordial? Modern palates went lighter.',
  }),
  r({
    id: 'margarita', zh: '玛格丽特', en: 'Margarita', glass: 'martini',
    items: [{ id: 'tequila', amount: 40 }, { id: 'triplesec', amount: 20 }, { id: 'lime', amount: 20 }],
    tech: ['shake'],
    hintZh: '龙舌兰的三重奏，大力摇匀，杯口本该有一圈盐。',
    hintEn: 'A tequila trio, shaken hard. The rim misses its salt.',
    loreZh: '据说是为一位叫玛格丽特的姑娘发明的——有很多位。',
    loreEn: 'Invented for a girl named Margarita — several of them, allegedly.',
  }),
  r({
    id: 'cosmopolitan', zh: '大都会', en: 'Cosmopolitan', glass: 'martini',
    items: [{ id: 'vodka', amount: 40 }, { id: 'triplesec', amount: 15 }, { id: 'lime', amount: 15 }, { id: 'cranberry', amount: 30 }],
    tech: ['shake'],
    hintZh: '粉红色的都市传说，欲望都市的女主角人手一杯。',
    hintEn: 'A pink urban legend — Sex and the City made it a star.',
    loreZh: '蔓越莓只是为了那一抹粉，别倒太多。',
    loreEn: 'The cranberry is for the blush — easy does it.',
  }),
  r({
    id: 'whiskysour', zh: '威士忌酸酒', en: 'Whisky Sour', glass: 'rocks',
    items: [{ id: 'whisky', amount: 45 }, { id: 'lemon', amount: 25 }, { id: 'syrup', amount: 18 }],
    tech: ['shake'],
    hintZh: '威士忌皱着眉，柠檬来讲和，糖浆当和事佬。',
    hintEn: 'Whisky frowns, lemon negotiates, syrup mediates.',
    loreZh: '酸酒家族的族长，一百五十年不过时。',
    loreEn: 'Patriarch of the sour family, 150 years young.',
  }),
  r({
    id: 'negroni', zh: '内格罗尼', en: 'Negroni', glass: 'rocks',
    items: [{ id: 'gin', amount: 30 }, { id: 'campari', amount: 30 }, { id: 'svermouth', amount: 30 }],
    tech: ['stir'],
    hintZh: '三等分的猩红色苦涩，献给想清醒地难过的人。',
    hintEn: 'Equal parts of scarlet bitterness, for elegant sorrow.',
    loreZh: '伯爵嫌美国佬不够劲，让酒保把苏打换成了金酒。',
    loreEn: 'A count swapped the soda in his Americano for gin.',
  }),
  r({
    id: 'americano', zh: '美国佬', en: 'Americano', glass: 'highball',
    items: [{ id: 'campari', amount: 30 }, { id: 'svermouth', amount: 30 }, { id: 'soda', amount: 90 }],
    tech: ['build'],
    hintZh: '内格罗尼的温柔前身，气泡冲淡了苦。',
    hintEn: 'The Negroni\'s gentler ancestor, bitterness softened by fizz.',
    loreZh: '007 在赌场皇家里点的第一杯酒其实是它。',
    loreEn: 'Bond\'s actual first drink in Casino Royale.',
  }),
  r({
    id: 'manhattan', zh: '曼哈顿', en: 'Manhattan', glass: 'martini',
    items: [{ id: 'whisky', amount: 55 }, { id: 'svermouth', amount: 25 }, { id: 'bitters', amount: 2 }],
    tech: ['stir'],
    hintZh: '鸡尾酒里的老绅士：威士忌、红味美思，和几滴神秘的苦。',
    hintEn: 'The old gentleman: whisky, red vermouth, dashes of mystery.',
    loreZh: '据说诞生于曼哈顿俱乐部的一场宴会。',
    loreEn: 'Born, allegedly, at a Manhattan Club banquet.',
  }),
  r({
    id: 'oldfashioned', zh: '古典鸡尾酒', en: 'Old Fashioned', glass: 'rocks',
    items: [{ id: 'whisky', amount: 55 }, { id: 'syrup', amount: 10 }, { id: 'bitters', amount: 2 }],
    tech: ['stir'],
    hintZh: '名字就叫"老派"：糖、苦精、威士忌，慢慢搅。',
    hintEn: 'Literally "old-fashioned": sugar, bitters, whisky, stirred slow.',
    loreZh: '当年的人管所有鸡尾酒都叫这个，后来它自己留下了这个名字。',
    loreEn: 'Once the name for all cocktails — it kept the title.',
  }),
  r({
    id: 'martini', zh: '马提尼', en: 'Martini', glass: 'martini',
    items: [{ id: 'gin', amount: 60 }, { id: 'dvermouth', amount: 12 }],
    tech: ['stir'],
    hintZh: '鸡尾酒之王。有人喜欢摇，但行家都知道要怎么做。',
    hintEn: 'The king of cocktails. Someone likes it shaken — insiders know better.',
    loreZh: '摇匀不搅拌？那是电影台词。搅拌，保持清澈。',
    loreEn: '"Shaken, not stirred" is a movie line. Stir it clear.',
  }),
  r({
    id: 'whiterussian', zh: '白俄罗斯', en: 'White Russian', glass: 'rocks',
    items: [{ id: 'vodka', amount: 45 }, { id: 'kahlua', amount: 25 }, { id: 'cream', amount: 30 }],
    tech: ['build', 'stir'],
    hintZh: '咖啡、奶油和伏特加，懒人的睡前甜点。The Dude 的最爱。',
    hintEn: 'Coffee, cream, vodka — The Dude\'s dessert of choice.',
    loreZh: '和俄罗斯没什么关系，只是因为放了伏特加。',
    loreEn: 'Nothing to do with Russia, except the vodka.',
  }),
  r({
    id: 'sunrise', zh: '龙舌兰日出', en: 'Tequila Sunrise', glass: 'highball',
    items: [{ id: 'tequila', amount: 45 }, { id: 'oj', amount: 100 }, { id: 'grenadine', amount: 15 }],
    tech: ['build'], keepLayers: true,
    hintZh: '把一场日出装进杯子里——重的沉底，轻的浮起，千万别搅。',
    hintEn: 'A sunrise in a glass — heavy sinks, light floats. Never stir.',
    loreZh: '红石榴糖浆慢慢沉下去，才有朝霞的渐变。',
    loreEn: 'Let the grenadine sink slowly — that\'s your dawn gradient.',
  }),
  r({
    id: 'shirley', zh: '秀兰·邓波儿', en: 'Shirley Temple', glass: 'highball',
    items: [{ id: 'ginger', amount: 120 }, { id: 'grenadine', amount: 15 }],
    tech: ['build'], alcoholFree: true,
    hintZh: '以一位童星命名的粉红汽水，小朋友的第一杯"鸡尾酒"。',
    hintEn: 'A pink fizz named after a child star — everyone\'s first "cocktail".',
    loreZh: '好莱坞餐厅为小演员特调的无酒精饮品。',
    loreEn: 'Hollywood\'s alcohol-free special for its youngest star.',
  }),
];

export const RECIPE_BY_ID: Record<string, Recipe> = Object.fromEntries(RECIPES.map((x) => [x.id, x]));

// ---------------- 灾难 ----------------

export interface Disaster {
  id: 'spray' | 'donkey' | 'herbal' | 'curdle';
  emoji: string;
  zh: string; en: string;
  descZh: string; descEn: string;
}

export const DISASTERS: Disaster[] = [
  { id: 'spray',  emoji: '🌋', zh: '火山特调',   en: 'Volcano Special',
    descZh: '你摇了碳酸饮料。恭喜，你发明的不是鸡尾酒，是喷泉。', descEn: 'You shook something fizzy. That\'s not a cocktail, that\'s a fountain.' },
  { id: 'donkey', emoji: '🫏', zh: '闷倒驴',     en: 'Knockout Donkey',
    descZh: '一杯下去，驴都得扶墙走。客人已被保安抬出。', descEn: 'One sip would floor a donkey. The customer left horizontally.' },
  { id: 'herbal', emoji: '🧪', zh: '老中医',     en: 'Herbal Doctor',
    descZh: '苦精是按"滴"算的朋友……这杯建议饭后温服。', descEn: 'Bitters are counted in dashes, friend. Take after meals, while warm.' },
  { id: 'curdle', emoji: '🥴', zh: '翻车酸奶',   en: 'Curdled Chaos',
    descZh: '奶油遇到酸就翻脸了。物理不骗人，牛奶也不。', descEn: 'Cream meets acid, cream files for divorce. Physics never lies.' },
];

export const DISASTER_BY_ID: Record<string, Disaster> = Object.fromEntries(DISASTERS.map((d) => [d.id, d]));

// ---------------- 自创酒命名词库 ----------------
// 名字 = [形容词] + [名词]，由配方哈希决定 → 同配方永远同名

export const NAME_NOUNS: [string, string][] = [
  ['踌躇', 'Hesitation'], ['加班费', 'Overtime Pay'], ['月光', 'Moonlight'], ['末班车', 'Last Train'],
  ['情书', 'Love Letter'], ['借口', 'Excuse'], ['周末', 'Weekend'], ['小秘密', 'Little Secret'],
  ['雨夜', 'Rainy Night'], ['告白', 'Confession'], ['心跳', 'Heartbeat'], ['时差', 'Jet Lag'],
  ['存档点', 'Save Point'], ['白日梦', 'Daydream'], ['退堂鼓', 'Cold Feet'], ['勇气', 'Courage'],
  ['乡愁', 'Homesickness'], ['口哨', 'Whistle'], ['晚风', 'Evening Breeze'], ['第二杯', 'Second Round'],
  ['备忘录', 'Memo'], ['走神', 'Wandering Mind'], ['顺风车', 'Free Ride'], ['和解', 'Truce'],
];

/** 按主导属性挑选的形容词组 */
export const NAME_ADJS: Record<string, [string, string][]> = {
  strong: [['滚烫的', 'Blazing'], ['上头的', 'Dizzy'], ['壮胆的', 'Emboldened']],
  sweet: [['温柔的', 'Tender'], ['蜜色的', 'Honeyed'], ['甜过头的', 'Oversweet']],
  sour: [['皱眉的', 'Pouting'], ['酸溜溜的', 'Zesty'], ['醒神的', 'Wide-awake']],
  bitter: [['清醒的', 'Sober'], ['固执的', 'Stubborn'], ['深夜的', 'Midnight']],
  fizzy: [['冒泡的', 'Fizzy'], ['嘶嘶作响的', 'Hissing'], ['轻飘飘的', 'Weightless']],
  creamy: [['奶白色的', 'Milky'], ['绵软的', 'Velvety'], ['困倦的', 'Drowsy']],
  mild: [['微醺的', 'Tipsy'], ['慢吞吞的', 'Unhurried'], ['低声的', 'Whispered']],
};

/** 结果页按主导属性给的一句风味评语 */
export const TASTE_LINES: Record<string, [string, string][]> = {
  strong: [
    ['入口像被野马踢了一脚，但踢得很有格调。', 'Kicks like a mule — an elegant mule.'],
    ['喝完这杯，勇气+10，明天-10。', '+10 courage tonight, −10 tomorrow.'],
  ],
  sweet: [
    ['甜得像周五下午六点的下班铃。', 'Sweet as the 6 p.m. bell on a Friday.'],
    ['这杯适合配一句"没事的，都会好的"。', 'Pairs well with "it\'s going to be okay."'],
  ],
  sour: [
    ['酸得恰到好处，像一句舍不得说重的抱怨。', 'Sour like a complaint you soften at the last second.'],
    ['喝一口，精神了，睫毛都翘起来了。', 'One sip and even your eyelashes wake up.'],
  ],
  bitter: [
    ['苦是苦，但苦得明明白白。', 'Bitter, yes — but honestly bitter.'],
    ['成年人的味道，配今晚的雨刚刚好。', 'Tastes like adulthood. Goes well with tonight\'s rain.'],
  ],
  fizzy: [
    ['气泡在杯子里放小型烟花。', 'Tiny fireworks going off in the glass.'],
    ['清爽！像把窗户全部推开的那阵风。', 'Crisp — like throwing every window open at once.'],
  ],
  creamy: [
    ['绵密顺滑，像给喉咙盖了条小毯子。', 'Smooth as a tiny blanket for your throat.'],
  ],
  mild: [
    ['温和平衡，是一杯不吵不闹的好酒。', 'Balanced and quiet — a drink that never raises its voice.'],
    ['没什么脾气的一杯，适合慢慢聊。', 'An easygoing glass, made for slow conversation.'],
  ],
};

/** 玻璃杯容量（ml），倒到这就要溢出 */
export const CAPACITY = 250;
