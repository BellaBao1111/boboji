import { LEVELS, ModId } from './config';
import { getLang, levelName, t } from './i18n';
import type { SaveData } from './store';
import { ACHIEVEMENTS, MISSION_POOL, SKINS, ownsSkin } from './meta';
import { TITLES, foodUnlockStage, stageLevel, titleFor } from './progression';
import { FOOD_TYPES } from './foods';
import { last7Days } from './daily';
import { copyShareText, saveCardImage } from './share';
import { sfx } from './sfx';

export interface UICallbacks {
  onStart(): void;
  onSelectStage(n: number): void;
  onSelectLevel(id: string): void;
  onStartDaily(): void;
  onPause(): void;
  onResume(): void;
  onQuitToLevels(): void;
  onRetry(): void;
  onNext(): void;
  onHelp(): void;
  onReviveAccept(): void;
  onReviveDecline(): void;
  onBuySkin(id: string): boolean;
  onEquipSkin(id: string): void;
  onShare(): void;
  onToggleMute(): boolean;
  onToggleLang(): void;
}

export interface ResultInfo {
  win: boolean;
  endless: boolean;
  daily: boolean;
  stage?: number;
  levelName: string;
  stars: number;
  picked: number;
  total: number;
  timeUsed: number;
  remaining: number;
  score: number;
  bestCombo: number;
  isNewBest: boolean;
  nearMiss: boolean;
  coinsEarned: number;
  streak: number;
  firstDailyWin: boolean;
  next?: { stage: number; name: string; emoji: string; teasers: string[]; feast: boolean; reward: boolean };
  missions: { name: string; cur: number; target: number; done: boolean }[];
}

const MOD_EMOJI: Record<ModId, string> = {
  fog: '🌫️',
  night: '🕯️',
  spin: '🎡',
  double: '🌶️',
  eater: '🐷',
};

const FOOD_EMOJI: Record<string, string> = {
  egg: '🥚',
  lotus: '🪷',
  kelp: '🎗️',
  gizzard: '🫀',
  carrot: '🥕',
  tofu: '🌯',
  broccoli: '🥦',
  beef: '🥩',
  ricecake: '🍡',
  tripe: '🐮',
  aorta: '🫙',
  brain: '🧠',
  golden: '🌟',
};

export class UI {
  floatRoot: HTMLElement;
  private root: HTMLElement;
  private cbs: UICallbacks;
  private save: SaveData;
  private els: Record<string, HTMLElement> = {};
  private comboTimer: number | undefined;
  private announceTimer: number | undefined;
  private muted: boolean;
  private selStage = 1;
  private shareText = '';

  constructor(root: HTMLElement, cbs: UICallbacks, save: SaveData) {
    this.root = root;
    this.cbs = cbs;
    this.save = save;
    this.muted = save.muted;
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
            <button class="btn ghost small" id="btn-home-daily">${d.btnDaily}</button>
            <button class="btn ghost small" id="btn-home-collection">${d.btnCollection}</button>
          </div>
          <div style="display:flex;gap:12px;">
            <button class="btn ghost small" id="btn-help">${d.howTo}</button>
            <button class="btn ghost small" id="btn-lang">🌐 ${d.langBtn}</button>
          </div>
        </div>
        <div class="home-foot">${d.footer}</div>
      </div>

      <div id="screen-levels" class="screen">
        <div class="levels-scroll">
          <div class="levels-title">${d.menuTitle}</div>
          <div class="hero-card" id="hero-card"></div>
          <div class="side-cards" id="side-cards"></div>
          <div class="missions-card" id="missions-card"></div>
          <div class="meta-row" id="meta-row"></div>
          <button class="btn ghost small" id="btn-levels-back">${d.back}</button>
        </div>
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
            <div class="mods-row" id="mods-row"></div>
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
        <div class="frenzy-pill" id="frenzy-pill">🌶️ ${d.frenzyTag}</div>
        <div class="hud-bottom">
          <button class="shake-btn" id="btn-help-eat">🥢 ${d.helpEat} <span class="cnt" id="help-cnt"></span></button>
        </div>
        <div class="goal-tip" id="goal-tip">${d.goalTip}</div>
        <div class="announce" id="announce"></div>
      </div>

      <div id="screen-revive" class="screen">
        <div class="panel revive-panel" id="revive-panel"></div>
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

      <div id="ov-collection" class="overlay"><div class="panel ov-panel" id="collection-panel"></div></div>
      <div id="ov-shop" class="overlay"><div class="panel ov-panel" id="shop-panel"></div></div>
      <div id="ov-daily" class="overlay"><div class="panel ov-panel daily-panel" id="daily-panel"></div></div>
      <div id="ov-share" class="overlay"><div class="panel ov-panel share-panel" id="share-panel"></div></div>

      <div class="toast-root" id="toast-root"></div>
    `;
    this.root.appendChild(this.floatRoot);

    const ids = [
      'screen-home', 'screen-levels', 'screen-hud', 'screen-result', 'screen-pause', 'screen-help', 'screen-revive',
      'hero-card', 'side-cards', 'missions-card', 'meta-row',
      'timer-wrap', 'timer-fill', 'timer-num', 'stat-count', 'stat-score', 'mods-row', 'frenzy-pill',
      'combo-pop', 'combo-num', 'combo-word', 'btn-help-eat', 'help-cnt', 'goal-tip', 'announce',
      'result-panel', 'revive-panel', 'btn-mute',
      'ov-collection', 'ov-shop', 'ov-daily', 'ov-share',
      'collection-panel', 'shop-panel', 'daily-panel', 'share-panel', 'toast-root',
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
    on('btn-home-daily', () => {
      sfx.unlock();
      sfx.click();
      this.openDaily();
    });
    on('btn-home-collection', () => {
      sfx.unlock();
      sfx.click();
      this.openCollection();
    });
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
    // 点遮罩关闭浮层
    for (const ov of ['ov-collection', 'ov-shop', 'ov-daily', 'ov-share']) {
      this.els[ov].addEventListener('click', (e) => {
        if (e.target === this.els[ov]) this.closeOverlays();
      });
    }
  }

  private current: string = 'home';
  private helpReturn: 'home' | 'levels' = 'home';

  show(name: 'home' | 'levels' | 'hud' | 'result' | 'pause' | 'help' | 'revive') {
    if (name === 'help') this.helpReturn = this.current === 'levels' ? 'levels' : 'home';
    for (const s of ['home', 'levels', 'hud', 'result', 'pause', 'help', 'revive']) {
      this.els[`screen-${s}`].classList.toggle(
        'on',
        s === name || ((name === 'pause' || name === 'result' || name === 'revive') && s === 'hud'),
      );
    }
    this.current = name;
    this.closeOverlays();
  }

  closeOverlays() {
    for (const ov of ['ov-collection', 'ov-shop', 'ov-daily', 'ov-share']) {
      this.els[ov]?.classList.remove('on');
    }
  }

  // ---------- 选关 ----------
  refreshLevels(save: SaveData) {
    this.save = save;
    const maxSel = Math.max(1, save.stage + 1);
    if (this.selStage < 1 || this.selStage > maxSel) this.selStage = maxSel;
    this.renderHero();
    this.renderSideCards();
    this.renderMissions();
    this.renderMetaRow();
  }

  private renderHero() {
    const d = t();
    const save = this.save;
    const maxSel = Math.max(1, save.stage + 1);
    const def = stageLevel(this.selStage);
    const stars = save.stars[def.id] ?? 0;
    const best = save.best[def.id] ?? 0;
    const isNew = this.selStage === maxSel;
    const mods = def.mods ?? [];
    const tag = def.feast ? d.feastTag : def.reward ? d.rewardTag : '';
    const wrap = this.els['hero-card'];
    wrap.innerHTML = `
      <div class="hero-top">
        <button class="stage-nav" id="stage-prev" ${this.selStage <= 1 ? 'disabled' : ''}>◀</button>
        <div class="hero-mid">
          <div class="hero-stage">${d.stageLabel(this.selStage)}${isNew && stars === 0 ? `<span class="new-tag">${d.newBowlTag}</span>` : ''}</div>
          <div class="hero-name">${def.emoji} ${levelName(def)}</div>
          <div class="hero-desc">${d.stageDesc(def.count, def.time)}${tag ? ` · ${tag}` : ''}</div>
          ${mods.length > 0 ? `<div class="hero-mods">${mods.map((m) => `<span class="mod-chip" title="${d.modDescs[m]}">${MOD_EMOJI[m]} ${d.modNames[m]}</span>`).join('')}</div>` : ''}
          <div class="hero-stars">${[1, 2, 3].map((i) => `<span class="${i <= stars ? 'lit' : ''}">★</span>`).join('')}</div>
          <div class="hero-best">${best > 0 ? d.bestPrefix(best) : d.notTried}</div>
        </div>
        <button class="stage-nav" id="stage-next" ${this.selStage >= maxSel ? 'disabled' : ''}>▶</button>
      </div>
      <button class="btn gold hero-eat" id="hero-eat">${d.heroEat}</button>
    `;
    wrap.querySelector('#stage-prev')!.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.selStage > 1) {
        sfx.click();
        this.selStage--;
        this.renderHero();
      }
    });
    wrap.querySelector('#stage-next')!.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.selStage < maxSel) {
        sfx.click();
        this.selStage++;
        this.renderHero();
      }
    });
    wrap.querySelector('#hero-eat')!.addEventListener('click', (e) => {
      e.stopPropagation();
      this.cbs.onSelectStage(this.selStage);
    });
  }

  private renderSideCards() {
    const d = t();
    const save = this.save;
    const wrap = this.els['side-cards'];
    const endless = LEVELS.find((l) => l.endless)!;
    const endlessUnlocked = (save.stars['l1'] ?? 0) > 0 || save.stage >= 1;
    const endlessBest = save.best['endless'] ?? 0;
    const today = new Date();
    const dateLabel = `${today.getMonth() + 1}/${today.getDate()}`;
    const todayRec = last7Days(save)[6];
    wrap.innerHTML = `
      <button class="side-card" id="card-daily">
        <span class="sc-emoji">📅</span>
        <span class="sc-name">${d.dailyTitle}</span>
        <span class="sc-desc">${dateLabel}${todayRec.win ? ` · ${d.dailyDoneTag}` : ''}</span>
        <span class="sc-foot">${save.daily.streak > 0 ? d.dailyStreak(save.daily.streak) : d.dailySub}</span>
      </button>
      <button class="side-card ${endlessUnlocked ? '' : 'locked'}" id="card-endless">
        ${endlessUnlocked ? '' : '<span class="lv-lock">🔒</span>'}
        <span class="sc-emoji">♾️</span>
        <span class="sc-name">${d.levels['endless'].name}</span>
        <span class="sc-desc">${d.levels['endless'].desc.split('\n')[0]}</span>
        <span class="sc-foot">${endlessBest > 0 ? d.bestPrefix(endlessBest) : endlessUnlocked ? d.notTried : d.lockedHint}</span>
      </button>
    `;
    wrap.querySelector('#card-daily')!.addEventListener('click', (e) => {
      e.stopPropagation();
      sfx.click();
      this.openDaily();
    });
    if (endlessUnlocked) {
      wrap.querySelector('#card-endless')!.addEventListener('click', (e) => {
        e.stopPropagation();
        this.cbs.onSelectLevel('endless');
      });
    }
  }

  private renderMissions() {
    const d = t();
    const m = this.save.missions;
    const wrap = this.els['missions-card'];
    if (m.ids.length === 0) {
      wrap.innerHTML = '';
      return;
    }
    wrap.innerHTML = `
      <div class="mc-title">${d.missionsTitle}</div>
      ${m.ids
        .map((id, i) => {
          const def = MISSION_POOL.find((x) => x.id === id)!;
          const done = m.done[i];
          return `<div class="mc-row ${done ? 'done' : ''}">
            <span class="mc-check">${done ? '✅' : '⬜'}</span>
            <span class="mc-name">${d.missionNames[id] ?? id}</span>
            <span class="mc-prog">${done ? `+${def.reward}🎋` : `${m.progress[i]}/${def.target}`}</span>
          </div>`;
        })
        .join('')}
    `;
  }

  private renderMetaRow() {
    const d = t();
    const wrap = this.els['meta-row'];
    wrap.innerHTML = `
      <span class="coin-pill">🎋 ${this.save.coins}</span>
      <button class="meta-btn" id="btn-collection">📖 ${d.collectionTitle}</button>
      <button class="meta-btn" id="btn-shop">🛍️ ${d.shopTitle}</button>
    `;
    wrap.querySelector('#btn-collection')!.addEventListener('click', (e) => {
      e.stopPropagation();
      sfx.click();
      this.openCollection();
    });
    wrap.querySelector('#btn-shop')!.addEventListener('click', (e) => {
      e.stopPropagation();
      sfx.click();
      this.openShop();
    });
  }

  // ---------- HUD ----------
  setTimer(left: number, total: number) {
    (this.els['timer-fill'] as HTMLElement).style.width = `${Math.min(100, Math.max(0, (left / total) * 100))}%`;
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

  setMods(mods: ModId[]) {
    const d = t();
    this.els['mods-row'].innerHTML = mods
      .map((m) => `<span class="mod-chip hud-mod" title="${d.modDescs[m]}">${MOD_EMOJI[m]} ${d.modNames[m]}</span>`)
      .join('');
  }

  setFrenzy(on: boolean) {
    this.els['frenzy-pill'].classList.toggle('on', on);
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

  // ---------- Toast ----------
  toast(text: string) {
    const root = this.els['toast-root'];
    if (!root) return;
    while (root.children.length >= 3) root.firstElementChild?.remove();
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    root.appendChild(el);
    window.setTimeout(() => {
      el.classList.add('out');
      window.setTimeout(() => el.remove(), 400);
    }, 2400);
  }

  // ---------- 续命 ----------
  showRevive(opt: { remaining: number; free: boolean; price: number; canAfford: boolean; seconds: number }) {
    const d = t();
    const p = this.els['revive-panel'];
    p.innerHTML = `
      <div class="revive-count" id="revive-count">${Math.ceil(opt.seconds)}</div>
      <div class="result-title" style="font-size:44px">${d.reviveTitle}</div>
      <div class="result-sub">${d.reviveSub(opt.remaining)}</div>
      <div class="result-btns" style="margin-top:22px">
        <button class="btn gold" id="btn-revive-yes" ${opt.canAfford ? '' : 'disabled'}>
          ${opt.free ? `🥢 ${d.reviveFree}` : d.revivePaid(opt.price)}
        </button>
        <button class="btn ghost small" id="btn-revive-no">${d.reviveGiveUp}</button>
      </div>
    `;
    p.querySelector('#btn-revive-yes')!.addEventListener('click', () => this.cbs.onReviveAccept());
    p.querySelector('#btn-revive-no')!.addEventListener('click', () => this.cbs.onReviveDecline());
    this.show('revive');
  }

  setReviveCountdown(sec: number) {
    const el = document.getElementById('revive-count');
    if (el) el.textContent = `${Math.ceil(sec)}`;
  }

  // ---------- 结算 ----------
  showResult(info: ResultInfo) {
    const d = t();
    const p = this.els['result-panel'];
    const stars = info.endless
      ? ''
      : `<div class="result-stars">${[1, 2, 3].map((i) => `<span class="${i <= info.stars ? 'lit' : ''}">★</span>`).join('')}</div>`;
    const stamp = info.daily
      ? `📅 ${d.dailyTitle}`
      : info.endless
        ? `♾️ ${d.levels['endless'].name}`
        : info.stage
          ? d.stageLabel(info.stage)
          : '';
    const title = info.endless ? d.fullTitle : info.win ? d.winTitle : d.loseTitle;
    const sub = info.endless
      ? d.fullSub(info.picked)
      : info.win
        ? d.winSub(info.levelName, info.total)
        : info.nearMiss
          ? `<b class="nearmiss">${d.nearMiss(info.remaining)}</b>`
          : d.loseSub(info.remaining);

    // 下一碗预告卡
    const nextHtml = info.next
      ? `<div class="next-teaser">
          <div class="nt-label">${d.nextBowlTeaser('')}</div>
          <div class="nt-name">${info.next.emoji} ${d.stageLabel(info.next.stage)}「${info.next.name}」</div>
          ${info.next.teasers.length > 0 ? `<div class="nt-unlocks">${info.next.teasers.map((x) => `<span>🔓 ${x}</span>`).join('')}</div>` : ''}
        </div>`
      : '';

    // 每日打卡
    const streakHtml =
      info.daily && info.win
        ? `<div class="streak-line">${d.dailyStreak(info.streak)}${info.firstDailyWin ? ' +1' : ''}</div>`
        : '';

    // 任务进度
    const missionsHtml =
      info.missions.length > 0
        ? `<div class="result-missions">${info.missions
            .map(
              (m) =>
                `<div class="mc-row ${m.done ? 'done' : ''}"><span class="mc-check">${m.done ? '✅' : '⬜'}</span><span class="mc-name">${m.name}</span><span class="mc-prog">${m.done ? 'OK' : `${m.cur}/${m.target}`}</span></div>`,
            )
            .join('')}</div>`
        : '';

    // 按钮组
    let btns = '';
    if (info.daily) {
      btns = `
        <button class="btn gold" id="btn-share">📤 ${d.shareBtn}</button>
        <button class="btn small" id="btn-retry">${d.dailyRetry}</button>
        <button class="btn ghost small" id="btn-quit">${d.changeBowl}</button>`;
    } else if (info.endless) {
      btns = `
        <button class="btn gold" id="btn-retry">${d.oneMore}</button>
        <button class="btn small" id="btn-share">📤 ${d.shareBtn}</button>
        <button class="btn ghost small" id="btn-quit">${d.changeBowl}</button>`;
    } else if (info.win && info.next) {
      btns = `
        <button class="btn gold" id="btn-next">${d.oneMoreBowl}</button>
        <button class="btn small" id="btn-share">📤 ${d.shareBtn}</button>
        <button class="btn ghost small" id="btn-quit">${d.changeBowl}</button>`;
    } else {
      btns = `
        <button class="btn gold" id="btn-retry">${d.retryBowl}</button>
        <button class="btn small" id="btn-share">📤 ${d.shareBtn}</button>
        <button class="btn ghost small" id="btn-quit">${d.changeBowl}</button>`;
    }

    p.innerHTML = `
      ${stamp ? `<div class="result-stamp">${stamp}</div>` : ''}
      <div class="result-title">${title}</div>
      <div class="result-sub">${sub}</div>
      ${streakHtml}
      ${stars}
      <div class="result-rows">
        <div class="rrow"><div class="k">${d.rowPick}</div><div class="v">${d.pickVal(info.picked)}</div></div>
        <div class="rrow"><div class="k">${d.rowTime}</div><div class="v">${info.timeUsed.toFixed(0)}s</div></div>
        <div class="rrow"><div class="k">${d.rowCombo}</div><div class="v">×${info.bestCombo}</div></div>
        <div class="rrow"><div class="k">${d.rowBill}</div><div class="v">${d.billVal(info.picked)}</div></div>
      </div>
      <div class="result-score">${d.scoreLabel}${info.isNewBest ? d.newRecord : ''}<b>${info.score}</b>
        <span class="coins-earned">${d.coinsEarned(info.coinsEarned)}</span>
      </div>
      ${nextHtml}
      ${missionsHtml}
      <div class="result-btns">${btns}</div>
    `;
    p.querySelector('#btn-retry')?.addEventListener('click', () => this.cbs.onRetry());
    p.querySelector('#btn-quit')!.addEventListener('click', () => this.cbs.onQuitToLevels());
    p.querySelector('#btn-next')?.addEventListener('click', () => this.cbs.onNext());
    p.querySelector('#btn-share')?.addEventListener('click', () => this.cbs.onShare());
    this.show('result');
  }

  // ---------- 图鉴 / 战绩 ----------
  openCollection() {
    const d = t();
    const save = this.save;
    const title = titleFor(save.lifetime.pulls);
    const titleName = getLang() === 'zh' ? title.zh : title.en;
    const nextIn = title.next !== null ? title.next - save.lifetime.pulls : null;
    const prog =
      title.next !== null
        ? Math.min(
            100,
            ((save.lifetime.pulls - TITLES[title.idx][0]) / (title.next - TITLES[title.idx][0])) * 100,
          )
        : 100;
    const p = this.els['collection-panel'];
    p.innerHTML = `
      <div class="ov-head"><h3>${d.collectionTitle}</h3><button class="ov-close" id="cl-close">✕</button></div>
      <div class="title-block">
        <div class="tb-label">${d.titleLabel}</div>
        <div class="tb-name">${titleName}</div>
        <div class="tb-bar"><div class="tb-fill" style="width:${prog}%"></div></div>
        ${nextIn !== null ? `<div class="tb-next">${d.nextTitleIn(nextIn)}</div>` : ''}
      </div>
      <div class="stats-grid">
        <div class="sg"><b>${save.lifetime.pulls}</b><span>${d.statPulls}</span></div>
        <div class="sg"><b>${Math.max(save.stage, 0)}</b><span>${d.statStage}</span></div>
        <div class="sg"><b>${save.lifetime.bowls}</b><span>${d.statBowls}</span></div>
        <div class="sg"><b>×${save.lifetime.bestCombo}</b><span>${d.statBestCombo}</span></div>
        <div class="sg"><b>${save.lifetime.golden}</b><span>${d.statGolden}</span></div>
        <div class="sg"><b>${save.lifetime.specials}</b><span>${d.statSpecials}</span></div>
      </div>
      <div class="ov-subtitle">${d.tabFoods}</div>
      <div class="food-grid">
        ${FOOD_TYPES.map((f) => {
          const n = save.foodEaten[f.id] ?? 0;
          const unlockAt = foodUnlockStage(f.id);
          const locked = n === 0 && unlockAt > Math.max(1, save.stage + 1);
          return `<div class="food-cell ${n > 0 ? '' : 'dim'}">
            <span class="fc-emoji">${locked ? '🔒' : FOOD_EMOJI[f.id] ?? '🍢'}</span>
            <span class="fc-name">${locked ? d.lockedAchieve : d.foodNames[f.id] ?? f.name}</span>
            <span class="fc-count">${n > 0 ? d.eatenTimes(n) : locked ? `${d.stageLabel(unlockAt)}` : d.notEaten}</span>
          </div>`;
        }).join('')}
      </div>
      <div class="ov-subtitle">${d.tabAchieves}</div>
      <div class="ach-grid">
        ${ACHIEVEMENTS.map((a) => {
          const got = save.achievements.includes(a.id);
          return `<div class="ach-cell ${got ? 'got' : ''}" title="${got ? d.achieveNames[a.id] : '???'}">
            <span class="ac-emoji">${got ? a.emoji : '❓'}</span>
            <span class="ac-name">${got ? d.achieveNames[a.id] ?? a.id : d.lockedAchieve}</span>
          </div>`;
        }).join('')}
      </div>
    `;
    p.querySelector('#cl-close')!.addEventListener('click', () => this.closeOverlays());
    this.els['ov-collection'].classList.add('on');
  }

  // ---------- 小卖部 ----------
  openShop() {
    this.renderShop();
    this.els['ov-shop'].classList.add('on');
  }

  private renderShop() {
    const d = t();
    const save = this.save;
    const p = this.els['shop-panel'];
    const section = (slot: 'bowl' | 'broth') => {
      const items = SKINS.filter((s) => s.slot === slot);
      return `
        <div class="ov-subtitle">${slot === 'bowl' ? d.slotBowl : d.slotBroth}</div>
        <div class="skin-grid">
          ${items
            .map((s) => {
              const owned = ownsSkin(save, s.id);
              const active = save.activeSkins[slot] === s.id;
              let btn: string;
              if (active) btn = `<span class="skin-state on">${d.equipped}</span>`;
              else if (owned) btn = `<button class="skin-btn" data-equip="${s.id}">${d.equip}</button>`;
              else if (s.needStreak) btn = `<span class="skin-state">${d.streakGift(s.needStreak)}</span>`;
              else btn = `<button class="skin-btn buy" data-buy="${s.id}">🎋${s.price} ${d.buy}</button>`;
              return `<div class="skin-cell ${active ? 'active' : ''}">
                <span class="sk-emoji">${s.emoji}</span>
                <span class="sk-name">${d.skinNames[s.id] ?? s.id}</span>
                ${btn}
              </div>`;
            })
            .join('')}
        </div>`;
    };
    p.innerHTML = `
      <div class="ov-head"><h3>${d.shopTitle}</h3><span class="coin-pill">🎋 ${save.coins}</span><button class="ov-close" id="shop-close">✕</button></div>
      ${section('bowl')}
      ${section('broth')}
    `;
    p.querySelector('#shop-close')!.addEventListener('click', () => this.closeOverlays());
    p.querySelectorAll('[data-buy]').forEach((el) =>
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const ok = this.cbs.onBuySkin((el as HTMLElement).dataset.buy!);
        if (ok) this.renderShop();
      }),
    );
    p.querySelectorAll('[data-equip]').forEach((el) =>
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.cbs.onEquipSkin((el as HTMLElement).dataset.equip!);
        this.renderShop();
      }),
    );
  }

  // ---------- 每日一钵 ----------
  openDaily() {
    const d = t();
    const save = this.save;
    const days = last7Days(save);
    const today = days[6];
    const p = this.els['daily-panel'];
    p.innerHTML = `
      <div class="ov-head"><h3>📅 ${d.dailyTitle}</h3><button class="ov-close" id="daily-close">✕</button></div>
      <div class="daily-sub">${d.dailySub}</div>
      <div class="daily-rules">${d.dailyRules}</div>
      <div class="daily-streak">${save.daily.streak > 0 ? d.dailyStreak(save.daily.streak) : ''}</div>
      <div class="ov-subtitle">${d.dailyCalTitle}</div>
      <div class="cal-row">
        ${days
          .map(
            (day, i) =>
              `<div class="cal-cell ${day.win ? 'win' : day.played ? 'played' : ''} ${i === 6 ? 'today' : ''}">
                <span class="cc-day">${day.day}</span>
                <span class="cc-mark">${day.win ? '🍢' : day.played ? '·' : ''}</span>
              </div>`,
          )
          .join('')}
      </div>
      <div class="result-btns" style="margin-top:20px">
        <button class="btn gold" id="daily-start">${today.win ? d.dailyRetry : d.dailyStart}</button>
      </div>
      ${today.win ? `<div class="daily-done-tip">${d.dailyTodayDone}</div>` : ''}
    `;
    p.querySelector('#daily-close')!.addEventListener('click', () => this.closeOverlays());
    p.querySelector('#daily-start')!.addEventListener('click', () => {
      this.closeOverlays();
      this.cbs.onStartDaily();
    });
    this.els['ov-daily'].classList.add('on');
  }

  // ---------- 分享 ----------
  showShare(canvas: HTMLCanvasElement, text: string) {
    const d = t();
    this.shareText = text;
    const p = this.els['share-panel'];
    p.innerHTML = `
      <div class="ov-head"><h3>📤 ${d.shareBtn}</h3><button class="ov-close" id="share-close">✕</button></div>
      <img class="share-img" id="share-img" alt="share card"/>
      <div class="result-btns">
        <button class="btn gold small" id="share-save">${d.shareSave}</button>
        <button class="btn small" id="share-copy">${d.shareCopy}</button>
      </div>
    `;
    (p.querySelector('#share-img') as HTMLImageElement).src = canvas.toDataURL('image/png');
    p.querySelector('#share-close')!.addEventListener('click', () => this.closeOverlays());
    p.querySelector('#share-save')!.addEventListener('click', () => {
      void saveCardImage(canvas, `boboji-${Date.now()}.png`);
    });
    p.querySelector('#share-copy')!.addEventListener('click', () => {
      void copyShareText(this.shareText).then((ok) => {
        if (ok) this.toast(d.shareCopied);
      });
    });
    this.els['ov-share'].classList.add('on');
  }
}
