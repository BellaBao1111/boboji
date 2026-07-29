import './style.css';
import { Env } from './environment';
import { Physics } from './physics';
import { Game } from './game';

async function boot() {
  const app = document.getElementById('app')!;
  const uiRoot = document.getElementById('ui')!;
  const bootEl = document.getElementById('boot')!;

  try {
    const env = new Env(app);
    const phys = await Physics.create();
    const game = new Game(env, phys, uiRoot);

    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      game.update(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    bootEl.classList.add('hide');
    setTimeout(() => bootEl.remove(), 600);
  } catch (err) {
    console.error(err);
    bootEl.innerHTML = `<div style="color:#ffe9c7;font-size:18px;text-align:center;padding:0 24px;line-height:1.8">
      哎呀，红油打翻了……<br>游戏加载失败，请刷新重试<br>
      <span style="font-size:12px;opacity:.6">${String(err)}</span></div>`;
  }
}

void boot();
