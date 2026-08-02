import { getLang, t } from './i18n';

export interface ShareInfo {
  daily: boolean;
  dateStr: string; // YYYY-MM-DD
  stage?: number;
  bowlName: string;
  win: boolean;
  picked: number;
  total: number;
  score: number;
  bestCombo: number;
  stars: number;
  streak: number;
  title: string; // 称号
  maxStage: number;
}

const URL_TXT = 'bellabao1111.github.io/boboji';
const W = 540;
const H = 864;

const FONT = "'ZCOOL KuaiLe','PingFang SC','Microsoft YaHei',sans-serif";
const FONT_TITLE = "'Ma Shan Zheng','STKaiti','PingFang SC',serif";

function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** 手绘一只俯视小碗（分享卡主视觉，延续零素材传统） */
function drawBowl(g: CanvasRenderingContext2D, cx: number, cy: number, R: number, picked: number, total: number) {
  // 碗外圈
  g.fillStyle = '#f5ead2';
  g.beginPath();
  g.arc(cx, cy, R, 0, 7);
  g.fill();
  g.lineWidth = 6;
  g.strokeStyle = '#2f56a0';
  g.stroke();
  // 红汤
  const broth = g.createRadialGradient(cx - R * 0.2, cy - R * 0.2, R * 0.1, cx, cy, R * 0.82);
  broth.addColorStop(0, '#a8321a');
  broth.addColorStop(1, '#7a1408');
  g.fillStyle = broth;
  g.beginPath();
  g.arc(cx, cy, R * 0.82, 0, 7);
  g.fill();
  // 油花
  g.fillStyle = 'rgba(255,140,60,0.5)';
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.4;
    const rr2 = R * (0.2 + ((i * 37) % 50) / 100);
    g.beginPath();
    g.arc(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2, 3 + ((i * 13) % 6), 0, 7);
    g.fill();
  }
  // 签签：拔掉的画成空位，剩下的画成签
  const n = Math.min(24, total || 24);
  const done = total > 0 ? Math.round((picked / total) * n) : n;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.2 + ((i * 29) % 10) / 18;
    const r1 = R * (0.12 + ((i * 53) % 40) / 100);
    const x1 = cx + Math.cos(a) * r1;
    const y1 = cy + Math.sin(a) * r1;
    const len = R * (0.5 + ((i * 17) % 30) / 100);
    const x2 = cx + Math.cos(a + 2.6) * len * 0.4 + Math.cos(a) * r1;
    const y2 = cy + Math.sin(a + 2.6) * len * 0.4 + Math.sin(a) * r1;
    if (i < done) {
      // 已拔：淡淡的涟漪圈
      g.strokeStyle = 'rgba(255,200,150,0.16)';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(x1, y1, 7, 0, 7);
      g.stroke();
    } else {
      g.strokeStyle = ['#d8b06c', '#5b9bd5', '#6db33f', '#d4568a', '#e6c33c'][i % 5];
      g.lineWidth = 5;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.stroke();
      g.fillStyle = '#c14a20';
      g.beginPath();
      g.arc(x1, y1, 6, 0, 7);
      g.fill();
    }
  }
}

export function drawShareCard(info: ShareInfo): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const d = t();

  // 背景
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#6e150c');
  bg.addColorStop(0.5, '#43100a');
  bg.addColorStop(1, '#260805');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  // 金边
  g.strokeStyle = '#d99a2b';
  g.lineWidth = 4;
  rr(g, 14, 14, W - 28, H - 28, 22);
  g.stroke();
  g.strokeStyle = 'rgba(245,196,81,0.35)';
  g.lineWidth = 1.5;
  rr(g, 24, 24, W - 48, H - 48, 16);
  g.stroke();

  // 标题
  g.textAlign = 'center';
  g.fillStyle = '#fff3e0';
  g.font = `64px ${FONT_TITLE}`;
  g.fillText(getLang() === 'zh' ? '钵 钵 鸡' : 'BoBoJi', W / 2, 108);
  g.font = `17px ${FONT}`;
  g.fillStyle = 'rgba(255,233,199,0.75)';
  g.fillText(d.badge, W / 2, 140);

  // 日期 / 模式徽章
  const badge = info.daily ? `📅 ${d.shareDaily} · ${info.dateStr}` : info.dateStr;
  g.font = `18px ${FONT}`;
  g.fillStyle = '#f5c451';
  g.fillText(badge, W / 2, 178);

  // 碗
  drawBowl(g, W / 2, 330, 118, info.picked, info.total);

  // 主行：第 N 碗「名字」 or 每日
  g.font = `30px ${FONT}`;
  g.fillStyle = '#ffe9c7';
  const mainLine = info.daily
    ? `${info.win ? '✅' : '🥢'} ${info.picked}/${info.total}`
    : d.shareStageLine(info.stage ?? 1, info.bowlName);
  g.fillText(mainLine, W / 2, 505);

  // 结果行
  g.font = `24px ${FONT}`;
  g.fillStyle = info.win ? '#8fd672' : '#ff9c82';
  g.fillText(info.win ? d.winTitle : d.loseTitle, W / 2, 545);

  // 星星
  if (info.stars > 0) {
    g.font = '34px sans-serif';
    let stars = '';
    for (let i = 0; i < 3; i++) stars += i < info.stars ? '★' : '☆';
    g.fillStyle = '#f5c451';
    g.fillText(stars, W / 2, 590);
  }

  // 数据栏
  const rows: [string, string][] = [
    [d.rowPick, `${info.picked}/${info.total}`],
    [d.scoreLabel, `${info.score}`],
    [d.rowCombo, `×${info.bestCombo}`],
  ];
  if (info.streak > 0) rows.push([getLang() === 'zh' ? '连吃' : 'Streak', `🔥${info.streak}`]);
  const bw = (W - 80) / rows.length;
  rows.forEach(([k, v], i) => {
    const x = 40 + bw * i + bw / 2;
    g.fillStyle = 'rgba(255,243,224,0.12)';
    rr(g, 44 + bw * i, 618, bw - 8, 74, 12);
    g.fill();
    g.font = `15px ${FONT}`;
    g.fillStyle = 'rgba(255,233,199,0.7)';
    g.fillText(k, x, 645);
    g.font = `26px ${FONT}`;
    g.fillStyle = '#fff3e0';
    g.fillText(v, x, 678);
  });

  // 称号 + 进度
  g.font = `20px ${FONT}`;
  g.fillStyle = '#f5c451';
  const titleLine =
    getLang() === 'zh' ? `「${info.title}」 · 已吃到第 ${Math.max(info.maxStage, info.stage ?? 0)} 碗` : `"${info.title}" · Bowl ${Math.max(info.maxStage, info.stage ?? 0)} reached`;
  g.fillText(titleLine, W / 2, 738);

  // 邀战 + 链接
  g.font = `22px ${FONT}`;
  g.fillStyle = '#ffe9c7';
  g.fillText(d.shareInvite, W / 2, 782);
  g.font = `16px ${FONT}`;
  g.fillStyle = 'rgba(255,233,199,0.6)';
  g.fillText(`🍢 ${URL_TXT}`, W / 2, 820);

  return c;
}

/** emoji 战绩文案（复制进群） */
export function buildShareText(info: ShareInfo): string {
  const d = t();
  const zh = getLang() === 'zh';
  const skewerBar = (() => {
    const n = 10;
    const k = info.total > 0 ? Math.round((info.picked / info.total) * n) : n;
    return '🍢'.repeat(Math.max(0, Math.min(n, k))) + '⬜'.repeat(Math.max(0, n - k));
  })();
  const lines: string[] = [];
  lines.push(zh ? `🍢 钵钵鸡 · ${info.daily ? '每日一钵 ' : ''}${info.dateStr}` : `🍢 BoBoJi · ${info.daily ? 'Daily Bowl ' : ''}${info.dateStr}`);
  if (!info.daily) lines.push(d.shareStageLine(info.stage ?? 1, info.bowlName));
  lines.push(`${skewerBar} ${info.picked}/${info.total}${info.win ? (zh ? ' 光盘!' : ' CLEAR!') : ''}`);
  const bits: string[] = [`🏆 ${info.score}`, `🔥×${info.bestCombo}`];
  if (info.stars > 0) bits.push('★'.repeat(info.stars));
  if (info.streak > 1) bits.push(zh ? `连吃${info.streak}天` : `${info.streak}-day streak`);
  lines.push(bits.join(' · '));
  lines.push(zh ? `我已吃到第 ${Math.max(info.maxStage, info.stage ?? 0)} 碗，${d.shareInvite}` : `Bowl ${Math.max(info.maxStage, info.stage ?? 0)} reached. ${d.shareInvite}`);
  lines.push(`👉 https://${URL_TXT}`);
  return lines.join('\n');
}

/** 保存/分享图片：优先系统分享（手机），回退下载 */
export async function saveCardImage(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  if (!blob) return;
  const file = new File([blob], filename, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d?: ShareData) => boolean };
  if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file] });
      return;
    } catch {
      /* 用户取消 → 落到下载 */
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function copyShareText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 旧浏览器回退
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
