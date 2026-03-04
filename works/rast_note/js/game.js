import { navigate } from './main.js';


import { MUSIC_LIST, DIFFICULTIES } from './musicdb.js';
import { Player } from './player.js';
import { Bullet } from './bullet.js';
import { MoveArea } from './area.js';
import { SEManager } from './se.js';
import { ProgressBar } from './progressbar.js';

let pauseState = false;
let animationId = null;

// 設定値（SE有効/無効）
let seManager = new SEManager();
let seEnabled = true;
// 設定画面から連携する場合はlocalStorageやグローバル変数で管理
if (localStorage.getItem('seEnabled') !== null) {
  seEnabled = localStorage.getItem('seEnabled') === 'true';
  seManager.setEnabled(seEnabled);
}

export function startGame(app, { musicId, difficulty, mode = 'normal' }) {
  pauseState = false;
  if (animationId) cancelAnimationFrame(animationId);
  const music = MUSIC_LIST.find(m => m.id === musicId);
  const diffLabel = DIFFICULTIES.find(d => d.id === difficulty)?.label || '';
  app.innerHTML = `
    <div style="position:relative; width:640px; margin:0 auto;">
      <button id="pauseBtn" style="position:absolute; left:0; top:0; z-index:10;">⏸</button>
      <h2 style="margin:0;">${music?.title || ''} <span style="font-size:0.7em; color:#4af;">[${diffLabel}]</span> <span style="font-size:0.7em; color:${mode==='hard'?'#f44':'#fff'};">[${mode==='hard'?'Hard':'Normal'}]</span></h2>
      <canvas id="gameCanvas" width="640" height="480"></canvas>
      <div id="scoreInfo" style="position:absolute; right:16px; top:16px; color:#fff; font-size:1.2em; background:rgba(0,0,0,0.5); padding:4px 16px; border-radius:8px; z-index:12;">Score: 0</div>
      <div id="progressBarContainer" style="position:absolute; right:16px; top:56px; width:120px; height:8px; z-index:12;"></div>
      <div id="pauseOverlay" style="display:none; position:absolute; left:0; top:0; width:640px; height:480px; background:rgba(0,0,0,0.7); z-index:20; align-items:center; justify-content:center; flex-direction:column;">
        <div style="margin-top:120px;">
          <button id="retryBtn" style="font-size:1.2em; margin:12px 0;">リトライ</button><br>
          <button id="interruptBtn" style="font-size:1.2em;">中断する</button>
        </div>
      </div>
      <div id="hpGaugeContainer" style="position:absolute; left:0; top:60px; width:32px; height:360px; display:${mode==='hard'?'block':'none'};"></div>
    </div>
  `;

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const pauseBtn = document.getElementById('pauseBtn');
  const pauseOverlay = document.getElementById('pauseOverlay');

  // 移動範囲（今後拡張可）
  let area = new MoveArea(80, 80, 480, 320, 'rect');
  let player = new Player(area);
  let bullets = [];
  // 進捗バーは右上に小さく
  let progressBar = new ProgressBar(0, 0, 120, 8);

  // 弾幕パターン例（今後拡張・外部データ化可）
  const bulletPattern = [
    // {time: 秒, config: {...}}
    { time: 0.5, config: { x: 80, y: 80, angle: Math.PI/4, speed: 3, type: 'normal', color: '#f44' } },
    { time: 1.0, config: { x: 560, y: 80, angle: Math.PI*3/4, speed: 2.5, type: 'bounce', bounce: 2, color: '#4f4' } },
    { time: 1.5, config: { x: 320, y: 400, angle: -Math.PI/2, speed: 4, type: 'normal', color: '#ff0' } }
  ];
  let bulletIndex = 0;

  // 曲の長さ仮設定（秒）
  const musicDuration = 10;
  let startTime = null;
  let elapsed = 0;
  let hp = 3;
  const maxHp = 3;
  let score = 0;
  let damage = 0;

  // キー入力管理
  const keys = { w: false, a: false, s: false, d: false };
  window.onkeydown = e => {
    if (e.repeat) return;
    if (e.key === 'w') keys.w = true;
    if (e.key === 'a') keys.a = true;
    if (e.key === 's') keys.s = true;
    if (e.key === 'd') keys.d = true;
  };
  window.onkeyup = e => {
    if (e.key === 'w') keys.w = false;
    if (e.key === 'a') keys.a = false;
    if (e.key === 's') keys.s = false;
    if (e.key === 'd') keys.d = false;
  };

  // ポーズ処理
  pauseBtn.onclick = () => {
    pauseState = true;
    pauseOverlay.style.display = 'flex';
    cancelAnimationFrame(animationId);
    // 音楽・弾幕等の停止（後で詳細実装）
  };
  pauseOverlay.onclick = e => { e.stopPropagation(); };
  pauseOverlay.querySelector('#retryBtn').onclick = () => {
    startGame(app, { musicId, difficulty });
  };
  pauseOverlay.querySelector('#interruptBtn').onclick = () => {
    import('./main.js').then(mod => mod.navigate('select'));
  };

  // 被弾SE再生
  function playHitSE() {
    seManager.play('hit');
  }

  // HPゲージ描画
  function drawHpGauge() {
    if (mode !== 'hard') return;
    const gauge = document.getElementById('hpGaugeContainer');
    const percent = Math.max(0, Math.min(1, hp / maxHp));
    gauge.innerHTML = `
      <svg width="32" height="360">
        <rect x="8" y="8" width="16" height="344" rx="8" fill="#333" stroke="#fff" stroke-width="2"/>
        <rect x="8" y="8" width="16" height="${344 * percent}" rx="8" fill="#f44" style="transform: translateY(${344 * (1 - percent)}px);"/>
      </svg>
      <div style="color:#fff; font-size:1em; text-align:center;">HP</div>
    `;
  }

  // 進捗バー描画
  function drawProgressBar() {
    const container = document.getElementById('progressBarContainer');
    // canvasを使って描画
    if (!container.querySelector('canvas')) {
      const barCanvas = document.createElement('canvas');
      barCanvas.width = 120;
      barCanvas.height = 8;
      container.appendChild(barCanvas);
    }
    const barCanvas = container.querySelector('canvas');
    const barCtx = barCanvas.getContext('2d');
    barCtx.clearRect(0, 0, 120, 8);
    progressBar.draw(barCtx);
  }

  // ゲームループ
  function loop(ts) {
    if (!startTime) startTime = ts;
    if (pauseState) return;
    elapsed = (ts - startTime) / 1000;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 枠描画
    area.draw(ctx);
    // プレイヤー移動
    let dx = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    let dy = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      player.move(dx / (len || 1), dy / (len || 1));
    }
    player.draw(ctx);

    // 弾幕生成
    while (bulletIndex < bulletPattern.length && bulletPattern[bulletIndex].time <= elapsed) {
      bullets.push(new Bullet(bulletPattern[bulletIndex].config, area));
      bulletIndex++;
    }
    // 弾幕更新・描画
    for (const b of bullets) b.update();
    for (const b of bullets) b.draw(ctx);

    // 弾幕とプレイヤーの当たり判定
    for (const b of bullets) {
      if (!b.active) continue;
      const dist = Math.hypot(player.x - b.x, player.y - b.y);
      if (dist < player.radius + b.radius) {
        b.active = false;
        hp--;
        damage++;
        score = Math.max(0, score - 1); // 被弾時に1点減点、0未満にならない
        playHitSE();
        if (hp <= 0) {
          // ゲームオーバー
          import('./main.js').then(mod => mod.navigate('result', { score, damage, musicId }));
          return;
        }
      }
    }

    // スコア加算（生存時間ベース例）
    score += 1; // 毎フレーム1点加算例（必要に応じて調整）

    // 進行バー（右上のみで描画、canvasには描画しない）
    progressBar.setProgress(Math.min(elapsed / musicDuration, 1));

    // スコア表示
    document.getElementById('scoreInfo').textContent = `Score: ${score}`;
    drawHpGauge();
    drawProgressBar();

    // 曲終了
    if (elapsed >= musicDuration) {
      import('./main.js').then(mod => mod.navigate('result', { score, damage, musicId }));
      return;
    }

    animationId = requestAnimationFrame(loop);
  }
  animationId = requestAnimationFrame(loop);
}
