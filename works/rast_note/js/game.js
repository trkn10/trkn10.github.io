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
  // BGM再生
  let bgmAudio = null;
  let bgmPausedAt = 0;
  const volume = localStorage.getItem('volume') !== null ? Number(localStorage.getItem('volume')) : 0.8;
  if (music && music.file) {
    bgmAudio = new Audio('music/' + music.file);
    bgmAudio.loop = false;
    bgmAudio.volume = volume;
    bgmAudio.play();
  }
  function stopBgm() {
    if (bgmAudio) {
      bgmAudio.pause();
      bgmAudio.currentTime = 0;
    }
  }
  function pauseBgm() {
    if (bgmAudio) {
      bgmAudio.pause();
      bgmPausedAt = bgmAudio.currentTime;
    }
  }
  function resumeBgm() {
    if (bgmAudio) {
      bgmAudio.currentTime = bgmPausedAt;
      bgmAudio.play();
    }
  }
  app.innerHTML = `
    <div style="position:relative; width:1280px; height:720px; margin:0 auto; background:#111; border-radius:18px; overflow:hidden;">
      <button id="pauseBtn" style="position:absolute; left:0; top:0; z-index:10;">⏸</button>
      <canvas id="gameCanvas" width="960" height="720" style="position:absolute; left:320px; top:0; background:#111;"></canvas>
      <div id="gameInfoBox" style="position:absolute; left:0; top:0; width:320px; height:100%; z-index:12; display:flex; flex-direction:column; align-items:flex-end; padding:32px 18px 18px 24px; background:rgba(0,0,0,0.45); border-radius:0 24px 24px 0; box-shadow:0 0 16px #0008;">
        <span style="font-size:0.9em; color:#aaa; letter-spacing:0.1em; margin-bottom:4px;">SCORE</span>
        <span id="scoreInfo" style="font-size:3.2em; color:#fff; font-weight:bold; letter-spacing:0.05em; margin-bottom:10px; text-shadow:0 0 12px #000,0 0 2px #000;">0</span>
        <div id="progressBarContainer" style="width:256px; height:14px; margin-bottom:10px;"></div>
        <span id="levelInfo" style="font-size:1.1em; color:#ffb347; margin-bottom:4px;">Level: -</span>
        <span id="musicTitleInfo" style="font-size:1.2em; color:#fff; margin-bottom:2px; text-align:right; width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${music?.title || ''}</span>
        <span id="artistInfo" style="font-size:1em; color:#aaa; text-align:right; width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${music?.artist || ''}</span>
      </div>
      <div id="pauseOverlay" style="display:none; position:absolute; left:0; top:0; width:1280px; height:720px; background:rgba(0,0,0,0.7); z-index:20; align-items:center; justify-content:center; flex-direction:column;">
        <div style="margin-top:40px; display:flex; flex-direction:column; align-items:center;">
          <button id="resumeBtn" style="font-size:1.2em; margin-bottom:24px;">再開する</button>
          <div id="countdown" style="font-size:2.5em; color:#fff; margin-bottom:16px;"></div>
          <button id="retryBtn" style="font-size:1.2em; margin:12px 0;">リトライ</button><br>
          <button id="interruptBtn" style="font-size:1.2em;">中断する</button>
        </div>
      </div>
      <div id="hpGaugeContainer" style="position:absolute; left:0; top:160px; width:32px; height:400px; display:${mode==='hard'?'block':'none'};"></div>
    </div>
  `;

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const pauseBtn = document.getElementById('pauseBtn');
  const pauseOverlay = document.getElementById('pauseOverlay');

  // 移動範囲（今後拡張可）
  let area = new MoveArea(380, 160, 560, 400, 'rect');
  let player = new Player(area);
  let bullets = [];
  // 進捗バーをgameInfoBox幅-64pxに調整
  let progressBar = new ProgressBar(0, 0, 256, 14);

  // 弾幕パターン例（今後拡張・外部データ化可）
  const bulletPattern = [
    // {time: 秒, config: {...}}
    { time: 0.5, config: { x: 80, y: 80, angle: Math.PI/4, speed: 3, type: 'normal', color: '#f44' } },
    { time: 1.0, config: { x: 560, y: 80, angle: Math.PI*3/4, speed: 2.5, type: 'bounce', bounce: 2, color: '#4f4' } },
    { time: 1.5, config: { x: 320, y: 400, angle: -Math.PI/2, speed: 4, type: 'normal', color: '#ff0' } }
  ];
  let bulletIndex = 0;

  // 曲の長さ（秒）
  const musicDuration = music && music.duration ? music.duration : 10;
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
    pauseBgm();
  };
  pauseOverlay.onclick = e => { e.stopPropagation(); };
  // 再開ボタンでカウントダウン再開
  const resumeBtn = pauseOverlay.querySelector('#resumeBtn');
  const countdownDiv = pauseOverlay.querySelector('#countdown');
  resumeBtn.onclick = () => {
    // ボタン類を非表示
    resumeBtn.style.display = 'none';
    const retryBtn = pauseOverlay.querySelector('#retryBtn');
    const interruptBtn = pauseOverlay.querySelector('#interruptBtn');
    retryBtn.style.display = 'none';
    interruptBtn.style.display = 'none';
    countdownDiv.textContent = '';
    countdownDiv.style.display = 'block';
    countdownDiv.style.textAlign = 'center';
    let count = 3;
    countdownDiv.textContent = count;
    // カウントダウン中は他ボタン無効
    let countdownActive = true;
    const disableAll = e => { if (countdownActive) e.stopPropagation(); };
    pauseOverlay.addEventListener('click', disableAll, true);
    retryBtn.addEventListener('click', disableAll, true);
    interruptBtn.addEventListener('click', disableAll, true);
    const countdown = setInterval(() => {
      count--;
      if (count > 0) {
        countdownDiv.textContent = count;
      } else {
        clearInterval(countdown);
        countdownDiv.textContent = '';
        countdownDiv.style.display = 'none';
        pauseState = false;
        pauseOverlay.style.display = 'none';
        resumeBgm();
        animationId = requestAnimationFrame(loop);
        // ボタン類を再表示
        resumeBtn.style.display = '';
        retryBtn.style.display = '';
        interruptBtn.style.display = '';
        countdownActive = false;
        pauseOverlay.removeEventListener('click', disableAll, true);
        retryBtn.removeEventListener('click', disableAll, true);
        interruptBtn.removeEventListener('click', disableAll, true);
      }
    }, 700);
  };
  pauseOverlay.querySelector('#retryBtn').onclick = () => {
    stopBgm();
    startGame(app, { musicId, difficulty, mode });
  };
  pauseOverlay.querySelector('#interruptBtn').onclick = () => {
    stopBgm();
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
          stopBgm();
          import('./main.js').then(mod => mod.navigate('result', { score, damage, musicId }));
          return;
        }
      }
    }

    // スコア加算（生存時間ベース例）
    score += 1; // 毎フレーム1点加算例（必要に応じて調整）

    // 進行バー（BGMのcurrentTime基準で正確に描画）
    let progress = 0;
    if (bgmAudio && bgmAudio.duration > 0) {
      progress = Math.min(bgmAudio.currentTime / bgmAudio.duration, 1);
    } else {
      progress = Math.min(elapsed / musicDuration, 1);
    }
    progressBar.setProgress(progress);

    // スコア・情報表示
    document.getElementById('scoreInfo').textContent = score;
    // Level表示
    const level = music?.levels?.[difficulty] ?? '-';
    document.getElementById('levelInfo').textContent = `Level: ${level}`;
    drawHpGauge();
    drawProgressBar();

    // 曲終了
    if (elapsed >= musicDuration) {
      stopBgm();
      import('./main.js').then(mod => mod.navigate('result', { score, damage, musicId }));
      return;
    }

    animationId = requestAnimationFrame(loop);
  }
  animationId = requestAnimationFrame(loop);
}
