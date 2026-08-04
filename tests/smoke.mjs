// 钵钵鸡发版前冒烟测试:启动→三语切换→开局→拔签→压签判定→暂停→通关→存档
//
// 运行方式(任一静态服务器伺服 dist 后):
//   npm run build
//   npx http-server dist -p 8123 -s   # 或 npx serve dist -l 8123
//   node tests/smoke.mjs              # 需要 playwright:npm i -D playwright && npx playwright install chromium
//
// 环境变量:BASE(默认 http://127.0.0.1:8123)、SHOT_DIR(截图目录,默认 tests/shots)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE ?? 'http://127.0.0.1:8123';
const DIR = process.env.SHOT_DIR ?? new URL('./shots', import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });
const SHOT = (n) => `${DIR}/${n}.png`;
const errors = [];
const failedRequests = [];

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
});
const ctx = await browser.newContext({
  viewport: { width: 390, height: 780 },
  deviceScaleFactor: 1, // 软件渲染下 DPR=1 才跑得动;真机/有 GPU 环境可调回 2
  hasTouch: true,
  isMobile: true,
});
const page = await ctx.newPage();
page.on('console', (m) => m.type() === 'error' && errors.push('[console.error] ' + m.text()));
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('requestfailed', (r) => failedRequests.push(`${r.url()} → ${r.failure()?.errorText}`));

// 游戏调试 API(?debug=1 时挂在 window.__boboji)
const dbg = (expr) => page.evaluate(`(() => { const b = window.__boboji; return b ? (${expr}) : '__none__'; })()`);
// 低帧率环境下游戏内时间远慢于墙钟(dt 钳制),一律轮询状态而非固定等待
const pollUntil = async (name, expr, pred, timeoutMs, everyMs = 2000) => {
  const t0 = Date.now();
  for (;;) {
    const v = await dbg(expr);
    if (pred(v)) return v;
    if (Date.now() - t0 > timeoutMs) throw new Error(`${name} 超时: 最后值=${JSON.stringify(v)}`);
    await page.waitForTimeout(everyMs);
  }
};
let failed = false;
const step = async (name, fn) => {
  const t0 = Date.now();
  try {
    const extra = await fn();
    console.log(`✅ ${name} (${((Date.now() - t0) / 1000).toFixed(0)}s)${extra ? ` ↳ ${extra}` : ''}`);
  } catch (e) {
    failed = true;
    console.log(`❌ ${name}: ${e.message.split('\n')[0]}`);
    await page.screenshot({ path: SHOT('fail-' + name.replace(/\W+/g, '-')) }).catch(() => {});
    throw e;
  }
};

try {
  await step('加载+引擎启动(Rapier WASM + WebGL2)', async () => {
    await page.goto(BASE + '/?debug=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#btn-start', { state: 'visible', timeout: 90000 });
    const gl = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      const g = c?.getContext('webgl2') || c?.getContext('webgl');
      return g ? g.getParameter(g.VERSION) : null;
    });
    if (!gl) throw new Error('无 WebGL 上下文');
    return gl;
  });

  await page.waitForTimeout(1000);
  await page.screenshot({ path: SHOT('01-home') });

  await step('三语循环(简→繁→EN→简)', async () => {
    const label = () => page.locator('#btn-start').innerText();
    const seen = [await label()];
    for (let i = 0; i < 3; i++) {
      await page.tap('#btn-lang');
      await page.waitForTimeout(300);
      seen.push(await label());
    }
    if (new Set(seen.slice(0, 3)).size !== 3) throw new Error(`切换异常: ${seen.join('→')}`);
    if (seen[3] !== seen[0]) throw new Error(`未循环回初始语言: ${seen.join('→')}`);
    return seen.join(' → ');
  });

  await step('进入选碗页', async () => {
    await page.tap('#btn-start');
    await page.waitForSelector('#hero-eat', { state: 'visible', timeout: 15000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: SHOT('02-levels') });
  });

  await step('开局落签,等待可玩状态(state=play)', async () => {
    await page.tap('#hero-eat');
    await pollUntil('state=play', `b.state()`, (v) => v === 'play', 240000);
    const remaining = await dbg('b.remaining()');
    await page.screenshot({ path: SHOT('03-gameplay') });
    return `剩余 ${remaining} 签`;
  });

  await step('拔 3 根自由签(计分+计数)', async () => {
    const r0 = await dbg('b.remaining()');
    const s0 = await dbg('b.score()');
    for (let i = 0; i < 3; i++) {
      const id = await dbg('b.pickFree()');
      if (id === -1) throw new Error('freeList 为空');
      await pollUntil(`第${i + 1}根生效`, 'b.remaining()', (v) => v === r0 - (i + 1), 90000, 1500);
    }
    const s1 = await dbg('b.score()');
    if (!(s1 > s0)) throw new Error(`分数未增加: ${s0} → ${s1}`);
    await page.screenshot({ path: SHOT('04-after-pulls') });
    return `剩余 ${r0}→${r0 - 3},分数 ${s0}→${s1}`;
  });

  await step('压签判定:拔被压的签必须失败', async () => {
    const r0 = await dbg('b.remaining()');
    const s0 = await dbg('b.score()');
    const id = await dbg('b.pickBlocked()');
    if (id === -1) return '当前无被压签(层数已浅),跳过';
    await page.waitForTimeout(4000);
    const r1 = await dbg('b.remaining()');
    const s1 = await dbg('b.score()');
    if (r1 !== r0 || s1 !== s0) throw new Error(`被压的签居然拔动了: 剩余${r0}→${r1}`);
    return `签#${id} 被正确拒绝(剩余/分数不变)`;
  });

  await step('真实触摸空白汤面(不崩)', async () => {
    await page.touchscreen.tap(50, 700);
    await page.waitForTimeout(1000);
  });

  await step('暂停/恢复', async () => {
    await page.tap('#btn-pause');
    await page.waitForSelector('#screen-pause.on', { state: 'attached', timeout: 8000 });
    await page.tap('#btn-resume');
    await pollUntil('恢复到 play', 'b.state()', (v) => v === 'play', 15000, 1000);
  });

  await step('forceWin 通关→结算页', async () => {
    await dbg('(b.forceWin(), true)');
    await pollUntil('state=result', 'b.state()', (v) => v === 'result', 120000);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: SHOT('05-result') });
  });

  await step('存档写入 localStorage', async () => {
    const keys = await page.evaluate(() => Object.keys(localStorage));
    if (keys.length === 0) throw new Error('无存档');
    return keys.join(', ');
  });
} finally {
  console.log('\n===== 汇总 =====');
  console.log(`JS 报错: ${errors.length}`);
  errors.slice(0, 10).forEach((e) => console.log('  ' + e.slice(0, 300)));
  console.log(`失败请求: ${failedRequests.length}`);
  failedRequests.slice(0, 5).forEach((r) => console.log('  ' + r));
  await browser.close();
  if (failed || errors.length > 0) process.exitCode = 1;
}
