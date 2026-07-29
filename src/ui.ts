import { LEVELS, LevelDef } from './config';
import { t } from './i18n';
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
  onToggleLang(): void;
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
  private muted: boolean;

  constructor(root: HTMLElement, cbs: UICallbacks, muted: boolean) {
    this.root = root;
    this.cbs = cbs;
    this.muted = muted;
    this.floatRoot = document.createElement('div');
    this.floatRoot.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;';
    this.render();
  }

  /** 语言切换后整体重绘（只会在首页触发） */
  rebuild() {
    this.render();
  }

  private render() {
    const d = t();
    this.root.innerHTML = `
      <div class="vignette"></div>

      <div id="screen-home" class="screen">
        <div class="home-badge">${d.badge}</div>
        <div class="home-title"><span class="zh">钵</span><span class="zh">钵</span><span class="zh">鸡</span></div>
        <div class="home-sub">${d.sub}</div>
        <div class="home-btns">
          <button class="btn gold" id="btn-start">${d.start}</button>
          <div style="display:flex;gap:12px;">
            <button class="btn ghost small" id="btn-help">${d.howTo}</button>
            <button class="btn ghost small" id="btn-lang">🌐 ${d.langBtn}</button>
          </div>
        </div>
        <div class="home-foot">${d.footer}</div>
      </div>

      <div id="screen-levels" class="screen">
        <div class="levels-title">${d.menuTitle}</div>
        <div class="level-cards" id="level-cards"></div>
        <button class="btn ghost small" id="btn-levels-back">${d.back}</button>
      </div>

      <div id="screen-hud" class="screen">
        <div class="hud-top">
          <div class="hud-left">
            <button class="icon-btn" id="btn-pause" title="pause">⏸</button>
            <button class="icon-btn" id="btn-mute" title="sound">${this.muted ? '🔇' : '🔊'}</button>
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
            <div class="hud-stat"><div class="v" id="stat-count">0</div><div class="k">${d.statLeft}</div></div>
            <div class="hud-stat"><div class="v" id="stat-score">0</div><div class="k">${d.statScore}</div></div>
          </div>
        </div>
        <div class="combo-pop" id="combo-pop">
          <div class="combo-num" id="combo-num"></div>
          <div class="combo-word" id="combo-word"></div>
        </div>
        <div class="hud-bottom">
          <button class="shake-btn" id="btn-help-eat">🥢 ${d.helpEat} <span class="cnt" id="help-cnt"></span></button>
        </div>
        <div class="goal-tip" id="goal-tip">${d.goalTip}</div>
        <div class="announce" id="announce"></div>
      </div>

      <div id="screen-result" class="screen">
        <div class="panel result-panel" id="result-panel"></div>
      </div>

      <div id="screen-pause" class="screen">
        <div class="panel result-panel">
          <div class="pause-title">${d.pauseTitle}</div>
          <div class="result-sub">${d.pauseSub}</div>
          <div class="result-btns">
            <button class="btn gold" id="btn-resume">${d.resume}</button>
            <button class="btn small" id="btn-pause-retry">${d.restart}</button>
            <button class="btn ghost small" id="btn-pause-quit">${d.changeBowl}</button>
          </div>
        </div>
      </div>

      <div id="screen-help" class="screen">
        <div class="panel help-panel">
          <h3>${d.helpTitle}</h3>
          ${d.helpRows
            .map(
              (r) =>
                `<div class="help-row"><div class="ico">${r.ico}</div><div class="t"><b>${r.title}</b><span>${r.body}</span></div></div>`,
            )
            .join('')}
          <div class="help-close-wrap"><button class="btn gold small" id="btn-help-close">${d.gotIt}</button></div>
        </div>
      </div>
    `;
    this.root.appendChild(this.floatRoot);

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
    on('btn-lang', () => this.cbs.onToggleLang());
    on('btn-help-close', () => this.show(this.helpReturn));
    on('btn-levels-back', () => this.show('home'));
    on('btn-pause', () => this.cbs.onPause());
    on('btn-resume', () => this.cbs.onResume());
    on('btn-pause-retry', () => this.cbs.onRetry());
    on('btn-pause-quit', () => this.cbs.onQuitToLevels());
    on('btn-help-eat', () => this.cbs.onHelp());
    on('btn-mute', () => {
      this.muted = this.cbs.onToggleMute();
      this.els['btn-mute'].textContent = this.muted ? '🔇' : '🔊';
    });
  }

  private current: string = 'home';
  private helpReturn: 'home' | 'levels' = 'home';

  show(name: 'home' | 'levels' | 'hud' | 'result' | 'pause' | 'help') {
    if (name === 'help') this.helpReturn = this.current === 'levels' ? 'levels' : 'home';
    for (const s of ['home', 'levels', 'hud', 'result', 'pause', 'help']) {
      this.els[`screen-${s}`].classList.toggle(
        'on',
        s === name || (name === 'pause' && s === 'hud') || (name === 'result' && s === 'hud'),
      );
    }
    this.current = name;
  }

  refreshLevels(save: SaveData) {
    const d = t();
    const wrap = this.els['level-cards'];
    wrap.innerHTML = '';
    for (const lv of LEVELS) {
      const text = d.levels[lv.id];
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
        <span class="lv-name">${text.name}</span>
        <span class="lv-desc">${text.desc.replace('\n', '<br>')}</span>
        ${starsHtml}
        <div class="lv-best">${best > 0 ? d.bestPrefix(best) : unlocked ? d.notTried : d.lockedHint}</div>
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
    this.els['combo-num'].textContent = `${t().comboPrefix}${n}`;
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
    const d = t();
    const p = this.els['result-panel'];
    const stars = info.endless
      ? ''
      : `<div class="result-stars">${[1, 2, 3].map((i) => `<span class="${i <= info.stars ? 'lit' : ''}">★</span>`).join('')}</div>`;
    const title = info.endless ? d.fullTitle : info.win ? d.winTitle : d.loseTitle;
    const sub = info.endless
      ? d.fullSub(info.picked)
      : info.win
        ? d.winSub(info.levelName, info.total)
        : d.loseSub(info.remaining);
    p.innerHTML = `
      <div class="result-title">${title}</div>
      <div class="result-sub">${sub}</div>
      ${stars}
      <div class="result-rows">
        <div class="rrow"><div class="k">${d.rowPick}</div><div class="v">${d.pickVal(info.picked)}</div></div>
        <div class="rrow"><div class="k">${d.rowTime}</div><div class="v">${info.timeUsed.toFixed(0)}s</div></div>
        <div class="rrow"><div class="k">${d.rowCombo}</div><div class="v">×${info.bestCombo}</div></div>
        <div class="rrow"><div class="k">${d.rowBill}</div><div class="v">${d.billVal(info.picked)}</div></div>
      </div>
      <div class="result-score">${d.scoreLabel}${info.isNewBest ? d.newRecord : ''}<b>${info.score}</b></div>
      <div class="result-btns">
        ${info.win && info.hasNext ? `<button class="btn gold" id="btn-next">${d.nextBowl}</button>` : ''}
        <button class="btn ${info.win && info.hasNext ? 'small' : 'gold'}" id="btn-retry">${d.oneMore}</button>
        <button class="btn ghost small" id="btn-quit">${d.changeBowl}</button>
      </div>
    `;
    p.querySelector('#btn-retry')!.addEventListener('click', () => this.cbs.onRetry());
    p.querySelector('#btn-quit')!.addEventListener('click', () => this.cbs.onQuitToLevels());
    p.querySelector('#btn-next')?.addEventListener('click', () => this.cbs.onNext());
    this.show('result');
  }
}
