import { LEVELS, LevelDef } from './config';
import type { SaveData } from './store';

export interface UICallbacks {
  onStart(): void;
  onSelectLevel(id: string): void;
  onPause(): void;
  onResume(): void;
  onQuitToLevels(): void;
  onRetry(): void;
  onNext(): void;
  onHelp(): void;
  onToggleMute(): boolean;
}

export interface ResultInfo {
  win: boolean;
  endless: boolean;
  levelName: string;
  stars: number;
  picked: number;
  total: number;
  timeUsed: number;
  remaining: number;
  score: number;
  bestCombo: number;
  isNewBest: boolean;
  hasNext: boolean;
}

export class UI {
  floatRoot: HTMLElement;
  private root: HTMLElement;
  private cbs: UICallbacks;
  private els: Record<string, HTMLElement> = {};
  private comboTimer: number | undefined;
  private announceTimer: number | undefined;

  constructor(root: HTMLElement, cbs: UICallbacks, muted: boolean) {
    this.root = root;
    this.cbs = cbs;
    root.innerHTML = `
      <div class="vignette"></div>

      <div id="screen-home" class="screen">
        <div class="home-badge">硅谷冷串串 · 巴适得板</div>
        <div class="home-title"><span class="zh">钵</span><span class="zh">钵</span><span class="zh">鸡</span></div>
        <div class="home-sub">红油签签 · 压住的莫拔 · 限时清盘</div>
        <div class="home-btns">
          <button class="btn gold" id="btn-start">开 吃 ！</button>
          <button class="btn ghost small" id="btn-help">怎么玩</button>
        </div>
        <div class="home-foot">作者：圣何塞椰子鸡 · 致敬我最好的成都友友们</div>
      </div>

      <div id="screen-levels" class="screen">
        <div class="levels-title">点 单</div>
        <div class="level-cards" id="level-cards"></div>
        <button class="btn ghost small" id="btn-levels-back">返回</button>
      </div>

      <div id="screen-hud" class="screen">
        <div class="hud-top">
          <div class="hud-left">
            <button class="icon-btn" id="btn-pause" title="暂停">⏸</button>
            <button class="icon-btn" id="btn-mute" title="声音">${muted ? '🔇' : '🔊'}</button>
          </div>
          <div class="hud-center">
            <div class="timer-wrap" id="timer-wrap">
              <div class="timer-row">
                <span class="t-ico">🌶️</span>
                <div class="timer-bar"><div class="timer-fill" id="timer-fill"></div></div>
                <span class="timer-num" id="timer-num">0s</span>
              </div>
            </div>
          </div>
          <div class="hud-right">
            <div class="hud-stat"><div class="v" id="stat-count">0</div><div class="k">剩余签</div></div>
            <div class="hud-stat"><div class="v" id="stat-score">0</div><div class="k">得分</div></div>
          </div>
        </div>
        <div class="combo-pop" id="combo-pop">
          <div class="combo-num" id="combo-num"></div>
          <div class="combo-word" id="combo-word"></div>
        </div>
        <div class="hud-bottom">
          <button class="shake-btn" id="btn-help-eat">🥢 帮吃 <span class="cnt" id="help-cnt"></span></button>
        </div>
        <div class="goal-tip" id="goal-tip">点没被压住的签 · 拖动空白处转视角</div>
        <div class="announce" id="announce"></div>
      </div>

      <div id="screen-result" class="screen">
        <div class="panel result-panel" id="result-panel"></div>
      </div>

      <div id="screen-pause" class="screen">
        <div class="panel result-panel">
          <div class="pause-title">歇口气</div>
          <div class="result-sub">汤还热着，签签不等人～</div>
          <div class="result-btns">
            <button class="btn gold" id="btn-resume">继续吃</button>
            <button class="btn small" id="btn-pause-retry">重新上桌</button>
            <button class="btn ghost small" id="btn-pause-quit">换个碗</button>
          </div>
        </div>
      </div>

      <div id="screen-help" class="screen">
        <div class="panel help-panel">
          <h3>怎么吃钵钵鸡</h3>
          <div class="help-row"><div class="ico">🍢</div><div class="t"><b>只能拔没被压住的签</b><span>签签在红汤里层层叠叠，上面压着别根签就拔不动，还要扣 2 秒！被压的签会闪红光提示。</span></div></div>
          <div class="help-row"><div class="ico">⏱️</div><div class="t"><b>限时拔完所有签</b><span>手快连击有额外加分，连到位川妹儿直接开夸。金签卤蛋 +8 秒，看到先抢！</span></div></div>
          <div class="help-row"><div class="ico">🥢</div><div class="t"><b>卡住了喊友友帮吃</b><span>成都友友出手，直接替你吃掉最上面 3 签——压住的也照吃！第几碗就有几次，真死锁了还免费送。</span></div></div>
          <div class="help-row"><div class="ico">👆</div><div class="t"><b>按住瞄准，松手才拔</b><span>手指按住时瞄准的签会发光，可以按着微调，松手才算拔。拖动空白处旋转视角、滚轮/双指缩放。</span></div></div>
          <div class="help-close-wrap"><button class="btn gold small" id="btn-help-close">晓得了</button></div>
        </div>
      </div>
    `;

    this.floatRoot = document.createElement('div');
    this.floatRoot.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;';
    root.appendChild(this.floatRoot);

    const ids = [
      'screen-home', 'screen-levels', 'screen-hud', 'screen-result', 'screen-pause', 'screen-help',
      'level-cards', 'timer-wrap', 'timer-fill', 'timer-num', 'stat-count', 'stat-score',
      'combo-pop', 'combo-num', 'combo-word', 'btn-help-eat', 'help-cnt', 'goal-tip', 'announce', 'result-panel',
      'btn-mute',
    ];
    for (const id of ids) this.els[id] = document.getElementById(id)!;

    const on = (id: string, fn: () => void) =>
      document.getElementById(id)!.addEventListener('click', (e) => {
        e.stopPropagation();
        fn();
      });
    on('btn-start', () => this.cbs.onStart());
    on('btn-help', () => this.show('help'));
    on('btn-help-close', () => this.show(this.helpReturn));
    on('btn-levels-back', () => this.show('home'));
    on('btn-pause', () => this.cbs.onPause());
    on('btn-resume', () => this.cbs.onResume());
    on('btn-pause-retry', () => this.cbs.onRetry());
    on('btn-pause-quit', () => this.cbs.onQuitToLevels());
    on('btn-help-eat', () => this.cbs.onHelp());
    on('btn-mute', () => {
      const muted = this.cbs.onToggleMute();
      this.els['btn-mute'].textContent = muted ? '🔇' : '🔊';
    });
  }

  private current: string = 'home';
  private helpReturn: 'home' | 'levels' = 'home';

  show(name: 'home' | 'levels' | 'hud' | 'result' | 'pause' | 'help') {
    if (name === 'help') this.helpReturn = this.current === 'levels' ? 'levels' : 'home';
    for (const s of ['home', 'levels', 'hud', 'result', 'pause', 'help']) {
      this.els[`screen-${s}`].classList.toggle('on', s === name || (name === 'pause' && s === 'hud') || (name === 'result' && s === 'hud'));
    }
    if (name !== 'pause' && name !== 'result') {
      // hud 独占时确保其它遮罩层关闭
    }
    this.current = name;
  }

  refreshLevels(save: SaveData) {
    const wrap = this.els['level-cards'];
    wrap.innerHTML = '';
    for (const lv of LEVELS) {
      const unlocked = this.isUnlocked(lv, save);
      const stars = save.stars[lv.id] ?? 0;
      const best = save.best[lv.id] ?? 0;
      const card = document.createElement('button');
      card.className = `level-card${unlocked ? '' : ' locked'}`;
      const starsHtml = lv.endless
        ? `<div class="lv-stars">🏆</div>`
        : `<div class="lv-stars">${[1, 2, 3].map((i) => `<span class="${i <= stars ? 'lit' : ''}">★</span>`).join('')}</div>`;
      card.innerHTML = `
        ${unlocked ? '' : '<span class="lv-lock">🔒</span>'}
        <span class="lv-emoji">${lv.emoji}</span>
        <span class="lv-name">${lv.name}</span>
        <span class="lv-desc">${lv.desc.replace('\n', '<br>')}</span>
        ${starsHtml}
        <div class="lv-best">${best > 0 ? `最高 ${best} 分` : unlocked ? '还没吃过' : '先吃上一碗'}</div>
      `;
      if (unlocked) card.addEventListener('click', () => this.cbs.onSelectLevel(lv.id));
      wrap.appendChild(card);
    }
  }

  isUnlocked(lv: LevelDef, save: SaveData): boolean {
    if (lv.id === 'l1') return true;
    if (lv.id === 'l2') return (save.stars['l1'] ?? 0) > 0;
    if (lv.id === 'l3') return (save.stars['l2'] ?? 0) > 0;
    if (lv.id === 'endless') return (save.stars['l1'] ?? 0) > 0;
    return true;
  }

  // ---------- HUD ----------
  setTimer(left: number, total: number) {
    (this.els['timer-fill'] as HTMLElement).style.width = `${Math.max(0, (left / total) * 100)}%`;
    this.els['timer-num'].textContent = `${Math.ceil(left)}s`;
    this.els['timer-wrap'].classList.toggle('low', left <= 12 && left > 0);
  }

  hurtTimer() {
    const el = this.els['timer-wrap'];
    el.classList.remove('hurt');
    void el.offsetWidth;
    el.classList.add('hurt');
  }

  setCount(n: number) {
    this.els['stat-count'].textContent = `${n}`;
  }

  setScore(n: number) {
    this.els['stat-score'].textContent = `${n}`;
  }

  setHelps(n: number, enabled: boolean) {
    this.els['help-cnt'].textContent = `×${n}`;
    (this.els['btn-help-eat'] as HTMLButtonElement).disabled = !enabled || n <= 0;
  }

  combo(n: number, word?: string) {
    const pop = this.els['combo-pop'];
    this.els['combo-num'].textContent = `连击 ×${n}`;
    this.els['combo-word'].textContent = word ?? '';
    pop.classList.remove('show');
    void (pop as HTMLElement).offsetWidth;
    pop.classList.add('show');
    window.clearTimeout(this.comboTimer);
    this.comboTimer = window.setTimeout(() => pop.classList.remove('show'), word ? 1500 : 900);
  }

  hideCombo() {
    this.els['combo-pop'].classList.remove('show');
  }

  announce(text: string, hold = 1150) {
    const el = this.els['announce'];
    el.textContent = text;
    el.classList.remove('show');
    void (el as HTMLElement).offsetWidth;
    el.classList.add('show');
    window.clearTimeout(this.announceTimer);
    this.announceTimer = window.setTimeout(() => el.classList.remove('show'), hold);
  }

  goalTip(showIt: boolean) {
    this.els['goal-tip'].classList.toggle('hide', !showIt);
  }

  // ---------- 结算 ----------
  showResult(info: ResultInfo) {
    const p = this.els['result-panel'];
    const stars = info.endless
      ? ''
      : `<div class="result-stars">${[1, 2, 3].map((i) => `<span class="${i <= info.stars ? 'lit' : ''}">★</span>`).join('')}</div>`;
    const title = info.endless ? '吃饱了！' : info.win ? '光盘咯！' : '时间到咯～';
    const sub = info.endless
      ? `流水席上一共拔了 <b>${info.picked}</b> 签`
      : info.win
        ? `「${info.levelName}」一共 ${info.total} 签，全部安排！`
        : `还剩 ${info.remaining} 签没拔完，再来一盘嘛`;
    p.innerHTML = `
      <div class="result-title">${title}</div>
      <div class="result-sub">${sub}</div>
      ${stars}
      <div class="result-rows">
        <div class="rrow"><div class="k">拔签</div><div class="v">${info.picked} 签</div></div>
        <div class="rrow"><div class="k">用时</div><div class="v">${info.timeUsed.toFixed(0)}s</div></div>
        <div class="rrow"><div class="k">最高连击</div><div class="v">×${info.bestCombo}</div></div>
        <div class="rrow"><div class="k">结账</div><div class="v">${info.picked * 2} 元</div></div>
      </div>
      <div class="result-score">总分${info.isNewBest ? ' · 🎉 新纪录！' : ''}<b>${info.score}</b></div>
      <div class="result-btns">
        ${info.win && info.hasNext ? '<button class="btn gold" id="btn-next">下一碗</button>' : ''}
        <button class="btn ${info.win && info.hasNext ? 'small' : 'gold'}" id="btn-retry">再来一份</button>
        <button class="btn ghost small" id="btn-quit">换个碗</button>
      </div>
    `;
    p.querySelector('#btn-retry')!.addEventListener('click', () => this.cbs.onRetry());
    p.querySelector('#btn-quit')!.addEventListener('click', () => this.cbs.onQuitToLevels());
    p.querySelector('#btn-next')?.addEventListener('click', () => this.cbs.onNext());
    this.show('result');
  }
}
