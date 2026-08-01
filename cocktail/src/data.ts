// ============ 数据层：材料 / 配方 / 词库 / 灾难 ============

export type Cat = 'spirit' | 'liqueur' | 'mixer' | 'other';
export type Unit = 'ml' | 'leaf';
export type Tech = 'build' | 'stir' | 'shake';
export type IceReq = 'cube' | 'none' | 'any';

export interface Ing {
  id: string;
  zh: string;
  en: string;
  cat: Cat;
  /** 液体颜色（sRGB hex） */
  color: string;
  /** 不透明度 0~1（烈酒接近透明，果汁不透明） */
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
  /** 悬停提示的一句话 */
  noteZh: string;
  noteEn: string;
  tag?: 'herbal' | 'citrus' | 'mint' | 'spicy';
}

const ing = (o: Ing) => o;

export const INGREDIENTS: Ing[] = [
  // —— 基酒 ——
  ing({ id: 'gin',      zh: '金酒',   en: 'Gin',        cat: 'spirit', color: '#d8e6e2', opacity: 0.14, abv: 0.4, sweet: 0, sour: 0, bitter: 1, fizz: 0, density: 0.95, unit: 'ml', rate: 30, tag: 'herbal',
    noteZh: '草本香气的烈酒，金汤力和内格罗尼的灵魂', noteEn: 'Herbal spirit — soul of the G&T and Negroni' }),
  ing({ id: 'vodka',    zh: '伏特加', en: 'Vodka',      cat: 'spirit', color: '#e8edf2', opacity: 0.10, abv: 0.4, sweet: 0, sour: 0, bitter: 0, fizz: 0, density: 0.95, unit: 'ml', rate: 30,
    noteZh: '无色无味的纯粹烈酒，跟谁都合得来', noteEn: 'Colorless, odorless, mixes with anything' }),
  ing({ id: 'rum',      zh: '白朗姆', en: 'White Rum',  cat: 'spirit', color: '#efe3cf', opacity: 0.14, abv: 0.4, sweet: 1, sour: 0, bitter: 0, fizz: 0, density: 0.95, unit: 'ml', rate: 30,
    noteZh: '甘蔗酿的微甜烈酒，莫吉托的心脏', noteEn: 'Sugarcane spirit — the heart of a Mojito' }),
  ing({ id: 'tequila',  zh: '龙舌兰', en: 'Tequila',    cat: 'spirit', color: '#eee7d0', opacity: 0.14, abv: 0.4, sweet: 0, sour: 0, bitter: 1, fizz: 0, density: 0.95, unit: 'ml', rate: 30,
    noteZh: '带植物气息的墨西哥烈酒，日出与玛格丽特都靠它', noteEn: 'Mexican agave spirit — sunrises & margaritas' }),
  ing({ id: 'whisky',   zh: '威士忌', en: 'Whisky',     cat: 'spirit', color: '#d29a4b', opacity: 0.55, abv: 0.4, sweet: 1, sour: 0, bitter: 2, fizz: 0, density: 0.96, unit: 'ml', rate: 30,
    noteZh: '琥珀色、带木桶香的烈酒，微苦有分量', noteEn: 'Amber, oaky, slightly bitter — a spirit with weight' }),
  // —— 利口酒 ——
  ing({ id: 'triplesec', zh: '橙皮酒', en: 'Triple Sec', cat: 'liqueur', color: '#f3d9a4', opacity: 0.30, abv: 0.30, sweet: 6, sour: 0, bitter: 0, fizz: 0, density: 1.04, unit: 'ml', rate: 26, tag: 'citrus',
    noteZh: '橙皮味的甜利口酒，中度酒精', noteEn: 'Sweet orange-peel liqueur, medium proof' }),
  ing({ id: 'campari',   zh: '金巴利', en: 'Campari',    cat: 'liqueur', color: '#d63a4e', opacity: 0.78, abv: 0.25, sweet: 3, sour: 0, bitter: 8, fizz: 0, density: 1.06, unit: 'ml', rate: 26,
    noteZh: '猩红色的苦味利口酒，成年人的味道', noteEn: 'Scarlet and bitter — an acquired, grown-up taste' }),
  ing({ id: 'svermouth', zh: '甜味美思', en: 'Vermouth', cat: 'liqueur', color: '#8e3b47', opacity: 0.62, abv: 0.16, sweet: 5, sour: 0, bitter: 3, fizz: 0, density: 1.04, unit: 'ml', rate: 26,
    noteZh: '加香型甜酒，低度、甜中带苦', noteEn: 'Aromatized sweet wine — low proof, bittersweet' }),
  // —— 果汁 / 汽水 ——
  ing({ id: 'lime',      zh: '青柠汁', en: 'Lime Juice', cat: 'mixer', color: '#cfe8a8', opacity: 0.58, abv: 0, sweet: 0, sour: 9, bitter: 0, fizz: 0, density: 1.03, unit: 'ml', rate: 40, tag: 'citrus',
    noteZh: '酸味担当，几乎所有酸甜酒都少不了它', noteEn: 'The sour backbone of nearly every shaken classic' }),
  ing({ id: 'oj',        zh: '橙汁',   en: 'Orange Juice', cat: 'mixer', color: '#f5a623', opacity: 0.92, abv: 0, sweet: 5, sour: 3, bitter: 0, fizz: 0, density: 1.04, unit: 'ml', rate: 55,
    noteZh: '酸甜平衡的橙色果汁，颜值也在线', noteEn: 'Sweet-tart, sunny orange — looks as good as it tastes' }),
  ing({ id: 'cola',      zh: '可乐',   en: 'Cola',       cat: 'mixer', color: '#3a2a20', opacity: 0.88, abv: 0, sweet: 7, sour: 0, bitter: 1, fizz: 7, density: 1.04, unit: 'ml', rate: 60,
    noteZh: '甜、深色、有气——千万别拿去摇', noteEn: 'Sweet, dark, fizzy — whatever you do, don\'t shake it' }),
  ing({ id: 'tonic',     zh: '汤力水', en: 'Tonic',      cat: 'mixer', color: '#eef4f0', opacity: 0.12, abv: 0, sweet: 2, sour: 0, bitter: 2, fizz: 8, density: 1.00, unit: 'ml', rate: 60,
    noteZh: '微苦的气泡水，金酒的官配', noteEn: 'Lightly bitter bubbles — gin\'s soulmate' }),
  ing({ id: 'soda',      zh: '苏打水', en: 'Soda',       cat: 'mixer', color: '#f0f6f8', opacity: 0.08, abv: 0, sweet: 0, sour: 0, bitter: 0, fizz: 8, density: 1.00, unit: 'ml', rate: 60,
    noteZh: '纯气泡，无味，负责清爽和稀释', noteEn: 'Pure fizz — adds sparkle, softens everything' }),
  // —— 糖 / 香料 ——
  ing({ id: 'syrup',     zh: '糖浆',   en: 'Syrup',      cat: 'other', color: '#f0e8d8', opacity: 0.38, abv: 0, sweet: 10, sour: 0, bitter: 0, fizz: 0, density: 1.32, unit: 'ml', rate: 22,
    noteZh: '纯甜，一点点就够，倒多了齁死人', noteEn: 'Pure sweetness — a little goes a long way' }),
  ing({ id: 'grenadine', zh: '红石榴糖浆', en: 'Grenadine', cat: 'other', color: '#c2183c', opacity: 0.88, abv: 0, sweet: 9, sour: 0, bitter: 0, fizz: 0, density: 1.18, unit: 'ml', rate: 22,
    noteZh: '艳红的甜糖浆，密度大会沉底——日出的秘密', noteEn: 'Ruby-red and dense — it sinks. The sunrise secret' }),
  ing({ id: 'mint',      zh: '薄荷叶', en: 'Mint',       cat: 'other', color: '#3f9e63', opacity: 1.0, abv: 0, sweet: 0, sour: 0, bitter: 0, fizz: 0, density: 0.5, unit: 'leaf', rate: 0, tag: 'mint',
    noteZh: '点几片进杯，捣过才有香气', noteEn: 'Tap to add leaves — muddle to release the aroma' }),
];

export const ING_BY_ID: Record<string, Ing> = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

// ---------------- 配方 ----------------

export interface RecipeItem {
  id: string;
  /** ml 目标量；leaf 单位时是片数 */
  amount: number;
  tol?: number;
}

export interface Recipe {
  id: string;
  zh: string;
  en: string;
  items: RecipeItem[];
  /** 允许的技法 */
  tech: Tech[];
  /** 建议用冰（图鉴展示） */
  ice: IceReq;
  /** 需要捣过（薄荷类） */
  muddle?: boolean;
  /** 必须保持分层（搅/摇会毁掉它） */
  keepLayers?: boolean;
  alcoholFree?: boolean;
  /** 解锁后的一句风味小注 */
  loreZh: string;
  loreEn: string;
  glass: 'highball' | 'rocks' | 'martini' | 'flute';
}

const r = (o: Recipe) => o;

export const RECIPES: Recipe[] = [
  r({
    id: 'gintonic', zh: '金汤力', en: 'Gin & Tonic', glass: 'highball',
    items: [{ id: 'gin', amount: 45 }, { id: 'tonic', amount: 120 }],
    tech: ['build'], ice: 'cube',
    loreZh: '殖民地军官的奎宁药水，被金酒拯救成了传世饮品。',
    loreEn: 'Quinine medicine rescued by gin into immortality.',
  }),
  r({
    id: 'cubalibre', zh: '自由古巴', en: 'Cuba Libre', glass: 'highball',
    items: [{ id: 'rum', amount: 45 }, { id: 'cola', amount: 110 }, { id: 'lime', amount: 10 }],
    tech: ['build'], ice: 'cube',
    loreZh: '一句"自由古巴！"的干杯口号，变成了一杯酒的名字。',
    loreEn: 'A toast of "¡Cuba Libre!" that became a drink.',
  }),
  r({
    id: 'screwdriver', zh: '螺丝起子', en: 'Screwdriver', glass: 'highball',
    items: [{ id: 'vodka', amount: 45 }, { id: 'oj', amount: 110 }],
    tech: ['build'], ice: 'cube',
    loreZh: '油田工人没有吧勺，就用螺丝刀搅了搅。',
    loreEn: 'No bar spoon on the oil rig — a screwdriver did the job.',
  }),
  r({
    id: 'mojito', zh: '莫吉托', en: 'Mojito', glass: 'highball',
    items: [{ id: 'rum', amount: 45 }, { id: 'lime', amount: 20 }, { id: 'syrup', amount: 15 }, { id: 'soda', amount: 80 }, { id: 'mint', amount: 4 }],
    tech: ['build'], ice: 'cube', muddle: true,
    loreZh: '薄荷要捣不要切，香气是拍出来的。',
    loreEn: 'Muddle, don\'t chop — aroma is coaxed, not forced.',
  }),
  r({
    id: 'virginmojito', zh: '无酒精莫吉托', en: 'Virgin Mojito', glass: 'highball',
    items: [{ id: 'lime', amount: 25 }, { id: 'syrup', amount: 20 }, { id: 'soda', amount: 110 }, { id: 'mint', amount: 4 }],
    tech: ['build'], ice: 'cube', muddle: true, alcoholFree: true,
    loreZh: '不喝酒的人也值得一杯像样的鸡尾酒。',
    loreEn: 'Teetotalers deserve a proper cocktail too.',
  }),
  r({
    id: 'daiquiri', zh: '大吉利', en: 'Daiquiri', glass: 'martini',
    items: [{ id: 'rum', amount: 50 }, { id: 'lime', amount: 25 }, { id: 'syrup', amount: 15 }],
    tech: ['shake'], ice: 'none',
    loreZh: '酸甜平衡的教科书，调酒师的第一课。',
    loreEn: 'The textbook of balance — every bartender\'s first lesson.',
  }),
  r({
    id: 'gimlet', zh: '吉姆雷特', en: 'Gimlet', glass: 'martini',
    items: [{ id: 'gin', amount: 55 }, { id: 'lime', amount: 20 }, { id: 'syrup', amount: 12 }],
    tech: ['shake'], ice: 'none',
    loreZh: '钱德勒笔下的马洛说：真正的吉姆雷特是金酒加青柠。',
    loreEn: 'Chandler\'s Marlowe: a real gimlet is gin and lime.',
  }),
  r({
    id: 'margarita', zh: '玛格丽特', en: 'Margarita', glass: 'martini',
    items: [{ id: 'tequila', amount: 40 }, { id: 'triplesec', amount: 20 }, { id: 'lime', amount: 20 }],
    tech: ['shake'], ice: 'any',
    loreZh: '据说是为一位叫玛格丽特的姑娘发明的——有很多位。',
    loreEn: 'Invented for a girl named Margarita — several of them, allegedly.',
  }),
  r({
    id: 'whiskysour', zh: '威士忌酸酒', en: 'Whisky Sour', glass: 'rocks',
    items: [{ id: 'whisky', amount: 45 }, { id: 'lime', amount: 25 }, { id: 'syrup', amount: 18 }],
    tech: ['shake'], ice: 'cube',
    loreZh: '威士忌皱着眉，青柠来讲和，糖浆当和事佬。',
    loreEn: 'Whisky frowns, lime negotiates, syrup mediates.',
  }),
  r({
    id: 'sunrise', zh: '龙舌兰日出', en: 'Tequila Sunrise', glass: 'highball',
    items: [{ id: 'tequila', amount: 45 }, { id: 'oj', amount: 100 }, { id: 'grenadine', amount: 15 }],
    tech: ['build'], ice: 'cube', keepLayers: true,
    loreZh: '红石榴糖浆慢慢沉下去，才有朝霞的渐变。千万别搅。',
    loreEn: 'Let the grenadine sink — that\'s your dawn gradient. Never stir.',
  }),
  r({
    id: 'liit', zh: '长岛冰茶', en: 'Long Island Iced Tea', glass: 'highball',
    items: [
      { id: 'vodka', amount: 15 }, { id: 'gin', amount: 15 }, { id: 'rum', amount: 15 },
      { id: 'tequila', amount: 15 }, { id: 'triplesec', amount: 15 },
      { id: 'lime', amount: 25 }, { id: 'syrup', amount: 10 }, { id: 'cola', amount: 40 },
    ],
    tech: ['build'], ice: 'cube',
    loreZh: '四种烈酒伪装成一杯冰红茶。喝不出酒味，站不起来是真的。',
    loreEn: 'Four spirits disguised as iced tea. Tastes innocent. Isn\'t.',
  }),
  r({
    id: 'negroni', zh: '内格罗尼', en: 'Negroni', glass: 'rocks',
    items: [{ id: 'gin', amount: 30 }, { id: 'campari', amount: 30 }, { id: 'svermouth', amount: 30 }],
    tech: ['stir'], ice: 'cube',
    loreZh: '三等分的猩红色苦涩，献给想清醒地难过的人。',
    loreEn: 'Equal parts of scarlet bitterness, for elegant sorrow.',
  }),
  r({
    id: 'americano', zh: '美国佬', en: 'Americano', glass: 'highball',
    items: [{ id: 'campari', amount: 30 }, { id: 'svermouth', amount: 30 }, { id: 'soda', amount: 90 }],
    tech: ['build'], ice: 'cube',
    loreZh: '内格罗尼的温柔前身，气泡冲淡了苦。',
    loreEn: 'The Negroni\'s gentler ancestor, bitterness softened by fizz.',
  }),
  r({
    id: 'shirley', zh: '秀兰·邓波儿', en: 'Shirley Temple', glass: 'highball',
    items: [{ id: 'soda', amount: 110 }, { id: 'grenadine', amount: 20 }],
    tech: ['build'], ice: 'cube', alcoholFree: true,
    loreZh: '以童星命名的粉红汽水，小朋友的第一杯"鸡尾酒"。',
    loreEn: 'A pink fizz named for a child star — everyone\'s first "cocktail".',
  }),
];

export const RECIPE_BY_ID: Record<string, Recipe> = Object.fromEntries(RECIPES.map((x) => [x.id, x]));

// ---------------- 灾难 ----------------

export interface Disaster {
  id: 'spray' | 'donkey' | 'sugarbomb' | 'toothpaste';
  emoji: string;
  zh: string; en: string;
  descZh: string; descEn: string;
}

export const DISASTERS: Disaster[] = [
  { id: 'spray',  emoji: '🌋', zh: '火山特调', en: 'Volcano Special',
    descZh: '你摇了碳酸饮料。恭喜，你发明的不是鸡尾酒，是喷泉。', descEn: 'You shook something fizzy. That\'s not a cocktail, that\'s a fountain.' },
  { id: 'donkey', emoji: '🫏', zh: '闷倒驴', en: 'Knockout Donkey',
    descZh: '一杯下去，驴都得扶墙走。客人已被保安抬出。', descEn: 'One sip would floor a donkey. The customer left horizontally.' },
  { id: 'sugarbomb', emoji: '🍭', zh: '齁死人', en: 'Sugar Bomb',
    descZh: '甜度超标三倍。客人喝完当场预约了牙医。', descEn: 'Triple the legal sweetness. The customer booked a dentist on the spot.' },
  { id: 'toothpaste', emoji: '🪥', zh: '牙膏水', en: 'Toothpaste Water',
    descZh: '薄荷放太多了。清新是很清新，就是像在喝漱口水。', descEn: 'Way too much mint. Refreshing, sure — like drinking mouthwash.' },
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
  mild: [['微醺的', 'Tipsy'], ['慢吞吞的', 'Unhurried'], ['低声的', 'Whispered']],
};

/** 结果页按主导属性给的一句风味评语 */
export const TASTE_LINES: Record<string, [string, string][]> = {
  strong: [
    ['入口像被野马踢了一脚，但踢得很有格调。', 'Kicks like a mule — an elegant mule.'],
    ['喝完这杯，勇气加十，明天减十。', '+10 courage tonight, −10 tomorrow.'],
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
  mild: [
    ['温和平衡，是一杯不吵不闹的好酒。', 'Balanced and quiet — a drink that never raises its voice.'],
    ['没什么脾气的一杯，适合慢慢聊。', 'An easygoing glass, made for slow conversation.'],
  ],
};

/** 玻璃杯容量（ml），倒到这就要溢出 */
export const CAPACITY = 250;
