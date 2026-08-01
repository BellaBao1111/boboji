// ============ DOM UI：酒架 / 操作栏 / 结果卡 / 图鉴 / 引导 ============

import { INGREDIENTS, RECIPES, DISASTERS, type Ing, type Recipe } from './data';
import type { Mode } from './scene';
import type { IceType } from './engine';
import type { Dict, Lang } from './i18n';
import type { SaveData } from './store';

export type ActionId = 'ice' | 'muddle' | 'stir' | 'shake' | 'serve' | 'dump';

export interface UIHooks {
  onPourStart(ing: Ing): void;
  onPourEnd(): void;
  onTapUnit(ing: Ing): void;
  onAction(a: ActionId): void;
  onCancelMode(): void;
  onMotionRequest(): void;
  onLangToggle(): void;
  onMuteToggle(): void;
  onMeasureToggle(): void;
  onOpenBook(): void;
  /** 结果页主按钮（再调一杯 / 下一位客人 / 打烊结算） */
  onAgain(): void;
  onHome(): void;
  onStartNight(): void;
  onFreePlay(): void;
}

export type GarnishKind = 'none' | 'mint' | 'citrus' | 'cherry' | 'olive';

export interface ResultView {
  badge: string;
  badgeKind: 'new' | 'known' | 'creation' | 'disaster';
  name: string;
  stars?: number;
  emoji?: string;
  glass: Recipe['glass'];
  color: string;
  foam: boolean;
  garnish: GarnishKind;
  attrs: [number, number, number, number, number];
  abvText: string;
  lines: string[];
  footNote: string;
  /** 营业模式：客人反应区 */
  reaction?: {
    emoji: string;
    name: string;
    line: string;
    tipText: string;
    tier: 'great' | 'ok' | 'bad';
    secretTag?: string;
  };
  /** 结果页主按钮文案（默认"再调一杯"） */
  primaryLabel?: string;
}

export interface CustomerView {
  emoji: string;
  name: string;
  progress: string;
  dialogue: string;
  hint?: string;
  chips: string[];
}

export interface SummaryRow { emoji: string; name: string; tip: number }

const $ = <T extends HTMLElement = HTMLElement>(sel: string): T => document.querySelector(sel) as T;

// 手绘线性图标（统一 1.7 描边，取代 emoji 的"高级感"关键）
const svg = (inner: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

export const ICONS: Record<string, string> = {
  ice: svg('<path d="M12 3.5v17M4.6 7.75l14.8 8.5M19.4 7.75L4.6 16.25"/><path d="M12 3.5l-1.8 1.8M12 3.5l1.8 1.8M12 20.5l-1.8-1.8M12 20.5l1.8-1.8"/>'),
  muddle: svg('<path d="M16.5 3.5l4 4"/><path d="M18.5 5.5L9.5 14.5"/><circle cx="7" cy="17" r="3.6" fill="currentColor" stroke="none" opacity="0.85"/><path d="M3.5 21h9"/>'),
  stir: svg('<path d="M13 3c-2 1.6-2 3.4 0 5s2 3.4 0 5"/><path d="M13 13v5"/><ellipse cx="13" cy="19.6" rx="2.6" ry="1.8"/>'),
  shake: svg('<path d="M9.5 3.5h5l.8 2.5H8.7z"/><path d="M8.7 6h6.6l1.4 12.2a1.8 1.8 0 01-1.8 1.8h-5.8a1.8 1.8 0 01-1.8-1.8z"/><path d="M4.5 9L3 8M19.5 9l1.5-1M4 13.5H2.5M20 13.5h1.5"/>'),
  dump: svg('<g transform="rotate(-30 11 10)"><path d="M7 4.5h9l-1.4 10H8.4z"/></g><path d="M15.5 16.5v2.2M18.3 18.2l.01.01M13 19.8l.01.01"/>'),
  serve: svg('<path d="M12 5a7 7 0 017 7v2.5H5V12a7 7 0 017-7z"/><path d="M3.5 17.5h17"/><path d="M12 5V3.5"/>'),
  home: svg('<path d="M4.5 11L12 4.5 19.5 11"/><path d="M6.5 9.5V19a.9.9 0 00.9.9h9.2a.9.9 0 00.9-.9V9.5"/>'),
  book: svg('<path d="M5 19.2A2.2 2.2 0 017.2 17H19V3.5H7.2A2.2 2.2 0 005 5.7z"/><path d="M5 19.2V20a.8.8 0 00.8.8H19V17"/>'),
  sound: svg('<path d="M10.5 5.5L6.5 9H4v6h2.5l4 3.5z"/><path d="M14.5 9.5a3.6 3.6 0 010 5M17 7.5a6.5 6.5 0 010 9"/>'),
  soundOff: svg('<path d="M10.5 5.5L6.5 9H4v6h2.5l4 3.5z"/><path d="M15 10l5 4.5M20 10l-5 4.5"/>'),
  jigger: svg('<path d="M7.5 3.5h9L13.8 10h-3.6z"/><path d="M7.5 20.5h9L13.8 14h-3.6z"/>'),
  martini: svg('<path d="M4.5 5h15L12 13.5z"/><path d="M12 13.5V19"/><path d="M8.5 20.5h7"/><circle cx="14.6" cy="7.6" r="1.5"/>'),
  moon: svg('<path d="M19.5 13.5A7.8 7.8 0 1110.5 4a6.2 6.2 0 009 9.5z"/>'),
  flask: svg('<path d="M10 3.5v5.6l-4.6 8.4A1.9 1.9 0 007.1 20h9.8a1.9 1.9 0 001.7-2.5L14 9.1V3.5"/><path d="M8.5 3.5h7M8.5 14.5h7"/>'),
};

export class UI {
  private dict: Dict;
  private hooks: UIHooks;
  private toastTimer = 0;
  bookTab: 'classic' | 'creation' | 'dark' = 'classic';
  /** 图鉴里经典配方的酒液颜色 */
  recipeColor: (r: Recipe) => string = () => 'rgba(200,200,220,0.5)';

  constructor(dict: Dict, hooks: UIHooks) {
    this.dict = dict;
    this.hooks = hooks;
    this.build();
  }

  private build() {
    const app = $('#app');
    app.innerHTML = `
      <canvas id="stage"></canvas>
      <div id="topbar">
        <div class="tb-left">
          <button id="btn-home" class="chip btn hidden">🏠</button>
          <div id="made" class="chip"></div>
        </div>
        <div class="tb-btns">
          <button id="btn-measure" class="chip btn" title="jigger"></button>
          <button id="btn-mute" class="chip btn"></button>
          <button id="btn-lang" class="chip btn"></button>
          <button id="btn-book" class="chip btn btn-book"></button>
        </div>
      </div>
      <div id="customer" class="hidden"></div>
      <div id="mode-hint" class="hidden">
        <span id="mode-hint-text"></span>
        <button id="btn-motion" class="mini-btn hidden"></button>
        <button id="btn-cancel" class="mini-btn"></button>
      </div>
      <div id="pour-readout" class="hidden"></div>
      <div id="toast" class="hidden"></div>
      <div id="float-layer"></div>
      <div id="bottom">
        <div id="actions"></div>
        <div id="shelf"></div>
      </div>
      <div id="modal-result" class="modal hidden"><div class="card" id="result-card"></div></div>
      <div id="modal-book" class="modal hidden"><div class="card book-card" id="book-card"></div></div>
      <div id="modal-summary" class="modal hidden"><div class="card summary-card" id="summary-card"></div></div>
      <div id="title" class="modal title-modal hidden"><div class="title-card" id="title-card"></div></div>
      <div id="intro" class="modal hidden"><div class="card intro-card" id="intro-card"></div></div>
    `;
    $('#btn-home').addEventListener('click', () => this.hooks.onHome());
    $('#btn-lang').addEventListener('click', () => this.hooks.onLangToggle());
    $('#btn-mute').addEventListener('click', () => this.hooks.onMuteToggle());
    $('#btn-measure').addEventListener('click', () => this.hooks.onMeasureToggle());
    $('#btn-book').addEventListener('click', () => this.hooks.onOpenBook());
    $('#btn-cancel').addEventListener('click', () => this.hooks.onCancelMode());
    $('#btn-motion').addEventListener('click', () => this.hooks.onMotionRequest());
    this.buildShelf();
    this.buildActions();
  }

  get stage(): HTMLCanvasElement { return $('#stage') as HTMLCanvasElement; }

  setDict(dict: Dict) {
    this.dict = dict;
    this.refreshLabels();
    this.buildShelf();
    this.buildActions();
  }

  // ---------------- 酒架 ----------------
  private buildShelf() {
    const shelf = $('#shelf');
    shelf.innerHTML = '';
    const groups: [string, Ing[]][] = [
      [this.dict.catSpirit, INGREDIENTS.filter((i) => i.cat === 'spirit')],
      [this.dict.catLiqueur, INGREDIENTS.filter((i) => i.cat === 'liqueur')],
      [this.dict.catMixer, INGREDIENTS.filter((i) => i.cat === 'mixer')],
      [this.dict.catOther, INGREDIENTS.filter((i) => i.cat === 'other')],
    ];
    for (const [label, ings] of groups) {
      const g = document.createElement('div');
      g.className = 'shelf-group';
      const lab = document.createElement('div');
      lab.className = 'shelf-label';
      lab.textContent = label;
      g.appendChild(lab);
      const row = document.createElement('div');
      row.className = 'shelf-row';
      for (const ing of ings) {
        row.appendChild(this.makeBottle(ing));
      }
      g.appendChild(row);
      shelf.appendChild(g);
    }
  }

  private makeBottle(ing: Ing): HTMLElement {
    const b = document.createElement('button');
    b.className = 'bottle';
    b.dataset.id = ing.id;
    const glyph = document.createElement('span');
    glyph.className = 'bottle-glyph';
    if (ing.unit === 'leaf') {
      glyph.classList.add('glyph-leaf');
      glyph.textContent = '🌿';
    } else if (ing.unit === 'dash') {
      glyph.classList.add('glyph-dash');
      glyph.style.setProperty('--c', ing.color);
    } else {
      glyph.style.setProperty('--c', ing.color);
      if (ing.cat === 'mixer') glyph.classList.add('glyph-tall');
    }
    const name = document.createElement('span');
    name.className = 'bottle-name';
    name.textContent = this.ingName(ing);
    const amt = document.createElement('span');
    amt.className = 'bottle-amt';
    amt.dataset.amtFor = ing.id;
    b.append(glyph, name, amt);

    if (ing.unit === 'ml') {
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        b.setPointerCapture(e.pointerId);
        this.hooks.onPourStart(ing);
      });
      const end = () => this.hooks.onPourEnd();
      b.addEventListener('pointerup', end);
      b.addEventListener('pointercancel', end);
      b.addEventListener('lostpointercapture', end);
    } else {
      b.addEventListener('click', () => this.hooks.onTapUnit(ing));
    }
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    return b;
  }

  ingName(ing: Ing): string { return this.isZh() ? ing.zh : ing.en; }
  recipeName(r: Recipe): string { return this.isZh() ? r.zh : r.en; }
  private isZh(): boolean { return this.dict.langBtn === 'EN'; }

  /** 更新每个瓶子上的已倒量角标 */
  updateAmounts(map: Map<string, number>) {
    document.querySelectorAll<HTMLElement>('[data-amt-for]').forEach((el) => {
      const id = el.dataset.amtFor!;
      const ing = INGREDIENTS.find((i) => i.id === id)!;
      const v = map.get(id) ?? 0;
      if (v <= 0) { el.textContent = ''; el.classList.remove('has'); return; }
      el.classList.add('has');
      el.textContent = ing.unit === 'ml' ? this.dict.mlSuffix(Math.round(v))
        : ing.unit === 'dash' ? this.dict.dashSuffix(v) : this.dict.leafSuffix(v);
    });
  }

  setShelfEnabled(on: boolean) {
    $('#shelf').classList.toggle('disabled', !on);
  }

  // ---------------- 操作栏 ----------------
  private buildActions() {
    const bar = $('#actions');
    bar.innerHTML = '';
    const defs: [ActionId, string][] = [
      ['ice', this.dict.actIceNone],
      ['muddle', this.dict.actMuddle],
      ['stir', this.dict.actStir],
      ['shake', this.dict.actShake],
      ['dump', this.dict.actDump],
      ['serve', this.dict.actServe],
    ];
    for (const [id, label] of defs) {
      const b = document.createElement('button');
      b.className = `act act-${id}`;
      b.dataset.act = id;
      b.innerHTML = `<span class="act-icon">${ICONS[id]}</span><span class="act-label" data-actlabel="${id}">${label}</span>`;
      b.addEventListener('click', () => this.hooks.onAction(id));
      bar.appendChild(b);
    }
  }

  setIceLabel(ice: IceType) {
    const el = document.querySelector<HTMLElement>('[data-actlabel="ice"]');
    if (el) el.textContent = ice === 'none' ? this.dict.actIceNone : ice === 'cube' ? this.dict.actIceCube : this.dict.actIceCrushed;
    const btn = document.querySelector<HTMLElement>('.act-ice');
    btn?.classList.toggle('active', ice !== 'none');
  }

  setActionsEnabled(on: boolean) {
    $('#actions').classList.toggle('disabled', !on);
  }

  // ---------------- 顶栏 ----------------
  refreshLabels(muted?: boolean, measure?: boolean) {
    document.title = this.dict.pageTitle;
    $('#btn-lang').textContent = this.dict.langBtn;
    $('#btn-book').innerHTML = `${ICONS.book}<span>${this.dict.book}</span>`;
    $('#btn-home').innerHTML = ICONS.home;
    if (muted !== undefined) this.setMuted(muted);
    if (measure !== undefined) this.setMeasure(measure);
  }

  setMuted(m: boolean) { $('#btn-mute').innerHTML = m ? ICONS.soundOff : ICONS.sound; }
  setMeasure(on: boolean) {
    $('#btn-measure').innerHTML = ICONS.jigger;
    $('#btn-measure').classList.toggle('off', !on);
    $('#btn-measure').title = on ? this.dict.measureOn : this.dict.measureOff;
  }
  setMade(n: number) { $('#made').textContent = this.dict.statMade(n); }
  setBookBadge(on: boolean) { $('#btn-book').classList.toggle('badged', on); }

  // ---------------- 模式提示 ----------------
  showModeHint(mode: Mode, motionAvailable: boolean) {
    const hint = $('#mode-hint');
    const text = $('#mode-hint-text');
    hint.classList.remove('hidden');
    $('#customer').classList.add('dim');
    text.textContent = mode === 'stir' ? this.dict.stirHint : mode === 'shake' ? this.dict.shakeHint : this.dict.muddleHint;
    const mb = $('#btn-motion');
    mb.textContent = this.dict.shakeMotionBtn;
    mb.classList.toggle('hidden', !(mode === 'shake' && motionAvailable));
    $('#btn-cancel').textContent = this.dict.cancel;
  }
  hideModeHint() {
    $('#mode-hint').classList.add('hidden');
    $('#customer').classList.remove('dim');
  }
  hideMotionBtn() { $('#btn-motion').classList.add('hidden'); }

  // ---------------- 倒酒读数 / 提示 ----------------
  setPourReadout(text: string | null) {
    const el = $('#pour-readout');
    if (text === null) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    el.textContent = text;
  }

  toast(text: string) {
    const el = $('#toast');
    el.textContent = text;
    el.classList.remove('hidden');
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => el.classList.add('hidden'), 2600);
  }

  floatText(text: string, big = false) {
    const layer = $('#float-layer');
    const span = document.createElement('span');
    span.className = `float-text${big ? ' big' : ''}`;
    span.textContent = text;
    span.style.left = `${44 + Math.random() * 12}%`;
    span.style.top = '38%';
    layer.appendChild(span);
    window.setTimeout(() => span.remove(), 2200);
  }

  // ---------------- 结果卡片 ----------------
  showResult(v: ResultView) {
    const card = $('#result-card');
    const starsHtml = v.stars
      ? `<div class="stars">${'★'.repeat(v.stars)}${'<span class="dim">☆</span>'.repeat(3 - v.stars)}</div>`
      : '';
    const attrsHtml = v.attrs
      .map((a, i) => `
        <div class="attr-row">
          <span class="attr-name">${this.dict.attrNames[i]}</span>
          <span class="attr-bar"><i style="width:${Math.round(a * 10)}%"></i></span>
        </div>`)
      .join('');
    const reactionHtml = v.reaction ? `
      <div class="reaction reaction-${v.reaction.tier}">
        <div class="reaction-head"><span class="reaction-emoji">${v.reaction.emoji}</span>
          <span class="reaction-name">${escapeHtml(v.reaction.name)}</span>
          <span class="reaction-tip">${escapeHtml(v.reaction.tipText)}</span></div>
        <div class="reaction-line">"${escapeHtml(v.reaction.line)}"</div>
        ${v.reaction.secretTag ? `<div class="reaction-secret">${escapeHtml(v.reaction.secretTag)}</div>` : ''}
      </div>` : '';
    card.innerHTML = `
      <div class="badge badge-${v.badgeKind}">${v.badge}</div>
      <h2 class="drink-name serif">${v.emoji ?? ''} ${escapeHtml(v.name)}</h2>
      ${starsHtml}
      <div class="result-body">
        <canvas id="drink-cv" width="150" height="200"></canvas>
        <div class="attrs">
          ${attrsHtml}
          <div class="abv-label">${escapeHtml(v.abvText)}</div>
        </div>
      </div>
      <div class="result-lines">${v.lines.map((l) => `<p>${escapeHtml(l)}</p>`).join('')}</div>
      ${reactionHtml}
      <div class="footnote">${escapeHtml(v.footNote)}</div>
      <div class="btn-row">
        <button id="btn-again" class="primary">${escapeHtml(v.primaryLabel ?? this.dict.again)}</button>
        <button id="btn-result-book">${this.dict.openBook}</button>
      </div>
    `;
    drawMiniDrink($('#drink-cv') as HTMLCanvasElement, v.glass, v.color, v.foam, v.garnish, false);
    $('#btn-again').addEventListener('click', () => this.hooks.onAgain());
    $('#btn-result-book').addEventListener('click', () => this.hooks.onOpenBook());
    $('#modal-result').classList.remove('hidden');
  }

  hideResult() { $('#modal-result').classList.add('hidden'); }

  // ---------------- 图鉴 ----------------
  showBook(save: SaveData) {
    const card = $('#book-card');
    const discovered = Object.keys(save.classics).length;
    const tabs: ['classic' | 'creation' | 'dark', string][] = [
      ['classic', this.dict.tabClassic],
      ['creation', this.dict.tabCreation],
      ['dark', this.dict.tabDark],
    ];
    card.innerHTML = `
      <div class="book-head">
        <h2 class="serif"><span class="bh-icon">${ICONS.book}</span>${this.dict.bookTitle}</h2>
        <span class="progress">${this.dict.progress(discovered, RECIPES.length)}</span>
        <button id="btn-book-close" class="mini-btn">✕ ${this.dict.close}</button>
      </div>
      <div class="book-tabs">
        ${tabs.map(([id, label]) => `<button class="book-tab${this.bookTab === id ? ' on' : ''}" data-tab="${id}">${label}</button>`).join('')}
      </div>
      <div class="book-body" id="book-body"></div>
    `;
    $('#btn-book-close').addEventListener('click', () => this.hideBook());
    card.querySelectorAll<HTMLElement>('.book-tab').forEach((t) =>
      t.addEventListener('click', () => {
        this.bookTab = t.dataset.tab as typeof this.bookTab;
        this.showBook(save);
      }),
    );
    const body = $('#book-body');
    if (this.bookTab === 'classic') this.renderClassicTab(body, save);
    else if (this.bookTab === 'creation') this.renderCreationTab(body, save);
    else this.renderDarkTab(body, save);
    $('#modal-book').classList.remove('hidden');
    this.setBookBadge(false);
  }

  hideBook() { $('#modal-book').classList.add('hidden'); }

  private renderClassicTab(body: HTMLElement, save: SaveData) {
    body.innerHTML = '';
    for (const r of RECIPES) {
      const got = save.classics[r.id];
      const row = document.createElement('div');
      row.className = `book-row${got ? '' : ' locked'}`;
      const cv = document.createElement('canvas');
      cv.width = 56; cv.height = 76;
      cv.className = 'book-glass';
      drawMiniDrink(cv, r.glass, got ? this.recipeColor(r) : 'rgba(30,26,42,0.9)', false, 'none', !got);
      const info = document.createElement('div');
      info.className = 'book-info';
      if (got) {
        const items = r.items
          .map((it) => {
            const ing = INGREDIENTS.find((i) => i.id === it.id)!;
            const amt = ing.unit === 'ml' ? this.dict.mlSuffix(it.amount) : ing.unit === 'dash' ? this.dict.dashSuffix(it.amount) : this.dict.leafSuffix(it.amount);
            return `${this.ingName(ing)} ${amt}`;
          })
          .join(' · ');
        const tech = r.tech.map((t) => this.dict.techLabel[t]).join('/') + (r.muddle ? ` · ${this.dict.muddleMark}` : '');
        info.innerHTML = `
          <div class="book-name serif">${escapeHtml(this.recipeName(r))}
            <span class="book-stars">${'★'.repeat(got.stars)}${'<span class="dim">☆</span>'.repeat(Math.max(0, 3 - got.stars))}</span>
          </div>
          <div class="book-recipe">${escapeHtml(this.dict.recipeOf)}: ${escapeHtml(items)} 〔${escapeHtml(tech)}〕</div>
          <div class="book-lore">${escapeHtml(this.isZh() ? r.loreZh : r.loreEn)}</div>
        `;
      } else {
        info.innerHTML = `
          <div class="book-name">${this.dict.lockedName}</div>
          <div class="book-lore">${escapeHtml(this.isZh() ? r.hintZh : r.hintEn)}</div>
        `;
      }
      row.append(cv, info);
      body.appendChild(row);
    }
  }

  private renderCreationTab(body: HTMLElement, save: SaveData) {
    body.innerHTML = '';
    if (save.creations.length === 0) {
      body.innerHTML = `<div class="book-empty">${escapeHtml(this.dict.creationEmpty).replace('\n', '<br>')}</div>`;
      return;
    }
    for (const c of save.creations) {
      const row = document.createElement('div');
      row.className = 'book-row';
      const cv = document.createElement('canvas');
      cv.width = 56; cv.height = 76;
      cv.className = 'book-glass';
      drawMiniDrink(cv, 'rocks', c.color, false, 'none', false);
      const info = document.createElement('div');
      info.className = 'book-info';
      const bars = c.attrs
        .map((a, i) => `<span class="mini-attr">${this.dict.attrNames[i]}<span class="mini-track"><i style="width:${Math.round(a * 10)}%"></i></span></span>`)
        .join('');
      info.innerHTML = `
        <div class="book-name">${escapeHtml(this.isZh() ? c.zh : c.en)}</div>
        <div class="mini-attrs">${bars}</div>
        <div class="book-lore">${this.dict.madeTimes(c.count)}</div>
      `;
      row.append(cv, info);
      body.appendChild(row);
    }
  }

  private renderDarkTab(body: HTMLElement, save: SaveData) {
    body.innerHTML = '';
    let any = false;
    for (const d of DISASTERS) {
      const got = save.disasters[d.id];
      if (got) any = true;
      const row = document.createElement('div');
      row.className = `book-row${got ? ' dark-row' : ' locked'}`;
      row.innerHTML = `
        <div class="dark-emoji">${got ? d.emoji : '❓'}</div>
        <div class="book-info">
          <div class="book-name">${got ? escapeHtml(this.isZh() ? d.zh : d.en) : this.dict.lockedName}</div>
          <div class="book-lore">${got ? escapeHtml(this.isZh() ? d.descZh : d.descEn) : '……'}</div>
        </div>
      `;
      body.appendChild(row);
    }
    if (!any) {
      const tip = document.createElement('div');
      tip.className = 'book-empty';
      tip.innerHTML = escapeHtml(this.dict.darkEmpty).replace('\n', '<br>');
      body.prepend(tip);
    }
  }

  // ---------------- 首页 ----------------

  showTitle(stats: { money: number; nights: number; discovered: number; total: number }) {
    const card = $('#title-card');
    card.innerHTML = `
      <div class="title-mark">${ICONS.martini}</div>
      <h1 class="title-logo serif">${escapeHtml(this.dict.barName)}</h1>
      <div class="title-sub">THE TIPSY SHAKER</div>
      <div class="title-rule"><i></i><b>◆</b><i></i></div>
      <p class="title-tagline">${escapeHtml(this.dict.tagline)}</p>
      <div class="title-stats">
        <span>${escapeHtml(this.dict.totalTips(stats.money))}</span>
        <span class="ts-dot">·</span>
        <span>${escapeHtml(this.dict.nightsPlayed(stats.nights))}</span>
        <span class="ts-dot">·</span>
        <span>${escapeHtml(this.dict.discoveredShort(stats.discovered, stats.total))}</span>
      </div>
      <div class="title-btns">
        <button id="btn-night" class="primary title-btn">${ICONS.moon}<span>${escapeHtml(this.dict.startNight)}</span></button>
        <button id="btn-free" class="title-btn">${ICONS.flask}<span>${escapeHtml(this.dict.freePlay)}</span></button>
      </div>
      <div class="title-small">
        <button id="btn-title-book" class="mini-btn icon-btn">${ICONS.book}<span>${escapeHtml(this.dict.book)}</span></button>
        <button id="btn-title-lang" class="mini-btn">${escapeHtml(this.dict.langBtn)}</button>
      </div>
      <div class="title-howto">${this.dict.introLines.map((l) => `<p><b>◆</b>${escapeHtml(l)}</p>`).join('')}</div>
    `;
    $('#btn-night').addEventListener('click', () => this.hooks.onStartNight());
    $('#btn-free').addEventListener('click', () => this.hooks.onFreePlay());
    $('#btn-title-book').addEventListener('click', () => this.hooks.onOpenBook());
    $('#btn-title-lang').addEventListener('click', () => this.hooks.onLangToggle());
    $('#title').classList.remove('hidden');
  }
  hideTitle() { $('#title').classList.add('hidden'); }
  titleVisible(): boolean { return !$('#title').classList.contains('hidden'); }

  setHomeVisible(on: boolean) { $('#btn-home').classList.toggle('hidden', !on); }
  setStatus(text: string) { $('#made').textContent = text; }

  // ---------------- 客人点单卡 ----------------

  showCustomer(v: CustomerView) {
    const el = $('#customer');
    el.classList.remove('hidden');
    el.innerHTML = `
      <div class="cust-head">
        <span class="cust-emoji">${v.emoji}</span>
        <span class="cust-name serif">${escapeHtml(v.name)}</span>
        <span class="cust-progress">${escapeHtml(v.progress)}</span>
      </div>
      <div class="cust-bubble">${escapeHtml(v.dialogue)}</div>
      ${v.hint ? `<div class="cust-hint">${escapeHtml(v.hint)}</div>` : ''}
      ${v.chips.length ? `<div class="cust-chips">${v.chips.map((c) => `<span class="cust-chip">${escapeHtml(c)}</span>`).join('')}</div>` : ''}
    `;
    el.classList.remove('pop-in');
    void el.offsetWidth;
    el.classList.add('pop-in');
  }
  hideCustomer() { $('#customer').classList.add('hidden'); }

  // ---------------- 打烊结算 ----------------

  showSummary(rows: SummaryRow[], data: { total: number; grade: string; isRecord: boolean }, onAgainNight: () => void, onHome: () => void) {
    const card = $('#summary-card');
    card.innerHTML = `
      <h2 class="summary-title serif">${escapeHtml(this.dict.nightTitle)}</h2>
      <div class="summary-grade serif grade-${data.grade}"><span>${data.grade}</span></div>
      <div class="summary-income">${escapeHtml(this.dict.nightIncome(data.total))}</div>
      ${data.isRecord ? `<div class="summary-record">${escapeHtml(this.dict.newNightRecord)}</div>` : ''}
      <div class="summary-rows">
        ${rows.map((r) => `
          <div class="summary-row">
            <span class="sr-emoji">${r.emoji}</span>
            <span class="sr-name">${escapeHtml(r.name)}</span>
            <span class="sr-tip${r.tip > 0 ? ' good' : ''}">${r.tip > 0 ? '+' + r.tip : '0'}</span>
          </div>`).join('')}
      </div>
      <div class="btn-row">
        <button id="btn-night-again" class="primary">${escapeHtml(this.dict.nightAgain)}</button>
        <button id="btn-summary-home">${escapeHtml(this.dict.backHome)}</button>
      </div>
    `;
    $('#btn-night-again').addEventListener('click', onAgainNight);
    $('#btn-summary-home').addEventListener('click', onHome);
    $('#modal-summary').classList.remove('hidden');
  }
  hideSummary() { $('#modal-summary').classList.add('hidden'); }

  // ---------------- 引导 ----------------
  showIntro(onStart: () => void) {
    const card = $('#intro-card');
    card.innerHTML = `
      <div class="intro-neon">🍸</div>
      <h1>${escapeHtml(this.dict.introTitle)}</h1>
      ${this.dict.introLines.map((l) => `<p class="intro-line">${escapeHtml(l)}</p>`).join('')}
      <div class="btn-row">
        <button id="btn-intro-lang">${this.dict.langBtn}</button>
        <button id="btn-intro-start" class="primary">${this.dict.introStart}</button>
      </div>
    `;
    $('#btn-intro-start').addEventListener('click', onStart);
    $('#btn-intro-lang').addEventListener('click', () => this.hooks.onLangToggle());
    $('#intro').classList.remove('hidden');
  }
  hideIntro() { $('#intro').classList.add('hidden'); }
  introVisible(): boolean { return !$('#intro').classList.contains('hidden'); }

  bottomHeight(): number { return $('#bottom').offsetHeight; }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

// ---------------- 迷你酒杯渲染（结果卡 & 图鉴共用） ----------------

export function drawMiniDrink(
  cv: HTMLCanvasElement,
  glass: Recipe['glass'],
  color: string,
  foam: boolean,
  garnish: GarnishKind,
  locked: boolean,
) {
  const ctx = cv.getContext('2d')!;
  const w = cv.width, h = cv.height;
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const stroke = locked ? 'rgba(120,110,150,0.5)' : 'rgba(235,245,255,0.65)';
  const liquid = color;
  ctx.lineWidth = Math.max(1.4, w * 0.018);
  ctx.strokeStyle = stroke;

  const fillClip = (path: () => void, liquidTopFrac: number) => {
    ctx.save();
    path();
    ctx.clip();
    if (!locked) {
      ctx.fillStyle = liquid;
      ctx.fillRect(0, h * liquidTopFrac, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(0, h * liquidTopFrac, w, h * 0.02 + 2);
      if (foam) {
        ctx.fillStyle = 'rgba(250,246,235,0.9)';
        ctx.fillRect(0, h * liquidTopFrac - 4, w, 6);
      }
    } else {
      ctx.fillStyle = 'rgba(26,22,40,0.92)';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
    path();
    ctx.stroke();
  };

  if (glass === 'martini') {
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.4, h * 0.14);
      ctx.lineTo(cx + w * 0.4, h * 0.14);
      ctx.lineTo(cx, h * 0.52);
      ctx.closePath();
    };
    fillClip(path, 0.2);
    ctx.beginPath();
    ctx.moveTo(cx, h * 0.52); ctx.lineTo(cx, h * 0.82);
    ctx.moveTo(cx - w * 0.22, h * 0.85); ctx.lineTo(cx + w * 0.22, h * 0.85);
    ctx.stroke();
  } else if (glass === 'rocks') {
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.32, h * 0.3);
      ctx.lineTo(cx - w * 0.3, h * 0.8);
      ctx.quadraticCurveTo(cx, h * 0.86, cx + w * 0.3, h * 0.8);
      ctx.lineTo(cx + w * 0.32, h * 0.3);
    };
    fillClip(path, 0.42);
  } else if (glass === 'flute') {
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.16, h * 0.1);
      ctx.quadraticCurveTo(cx - w * 0.2, h * 0.45, cx, h * 0.58);
      ctx.quadraticCurveTo(cx + w * 0.2, h * 0.45, cx + w * 0.16, h * 0.1);
    };
    fillClip(path, 0.16);
    ctx.beginPath();
    ctx.moveTo(cx, h * 0.58); ctx.lineTo(cx, h * 0.84);
    ctx.moveTo(cx - w * 0.18, h * 0.87); ctx.lineTo(cx + w * 0.18, h * 0.87);
    ctx.stroke();
  } else {
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.26, h * 0.12);
      ctx.lineTo(cx - w * 0.24, h * 0.84);
      ctx.quadraticCurveTo(cx, h * 0.89, cx + w * 0.24, h * 0.84);
      ctx.lineTo(cx + w * 0.26, h * 0.12);
    };
    fillClip(path, 0.24);
  }

  if (locked) {
    ctx.fillStyle = 'rgba(150,140,185,0.8)';
    ctx.font = `${w * 0.3}px system-ui`;
    ctx.textAlign = 'center';
    ctx.fillText('?', cx, h * 0.5);
    return;
  }

  // 装饰
  if (garnish === 'mint') {
    ctx.fillStyle = '#4aa96a';
    for (const [dx, dy, rot] of [[-4, -4, -0.5], [4, -6, 0.4], [0, -10, 0]] as const) {
      ctx.save();
      ctx.translate(cx + dx, h * (glass === 'martini' ? 0.16 : 0.2) + dy);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (garnish === 'citrus') {
    const gy = h * (glass === 'martini' ? 0.13 : 0.18);
    ctx.fillStyle = '#f5a623';
    ctx.beginPath();
    ctx.arc(cx + w * 0.3, gy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff0d0';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + w * 0.3, gy);
      ctx.lineTo(cx + w * 0.3 + Math.cos((i / 5) * Math.PI * 2) * 6, gy + Math.sin((i / 5) * Math.PI * 2) * 6);
      ctx.stroke();
    }
  } else if (garnish === 'cherry') {
    const gy = h * (glass === 'martini' ? 0.15 : 0.2);
    ctx.strokeStyle = '#c9a66a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.18, gy - 12);
    ctx.quadraticCurveTo(cx + w * 0.24, gy - 4, cx + w * 0.2, gy);
    ctx.stroke();
    ctx.fillStyle = '#d0243c';
    ctx.beginPath();
    ctx.arc(cx + w * 0.2, gy + 3, 4.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (garnish === 'olive') {
    const gy = h * 0.2;
    ctx.strokeStyle = '#cfc9dd';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - 12, gy - 14);
    ctx.lineTo(cx + 10, gy + 2);
    ctx.stroke();
    ctx.fillStyle = '#7a9e4f';
    ctx.beginPath();
    ctx.ellipse(cx + 6, gy, 5, 3.6, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}
