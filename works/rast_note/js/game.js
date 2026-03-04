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
if (localStorage.getItem('seVolume') !== null) {
  seManager.setVolume(Number(localStorage.getItem('seVolume')));
}

export function startGame(app, { musicId, difficulty, mode = 'normal' }) {
    // フルスコア演出用
    let fullScoreShown = false;
    let fullScoreTimer = 0;
  pauseState = false;
  if (animationId) cancelAnimationFrame(animationId);
  const music = MUSIC_LIST.find(m => m.id === musicId);
  const diffLabel = DIFFICULTIES.find(d => d.id === difficulty)?.label || '';
  // BGM再生
  let bgmAudio = null;
  let bgmPausedAt = 0;
  const bgmVolume = localStorage.getItem('bgmVolume') !== null ? Number(localStorage.getItem('bgmVolume')) : 0.8;
  if (music && music.file) {
    bgmAudio = new Audio('music/' + music.file);
    bgmAudio.loop = false;
    bgmAudio.volume = bgmVolume;
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
    <div id="gameRoot" style="position:fixed; left:0; top:0; width:100vw; height:100vh; background:#181818; border-radius:0; box-shadow:none; overflow:hidden; z-index:100;">
      <div id="gameArea" style="position:absolute; left:0; top:0; width:100vw; height:100vh; max-width:100vw; max-height:100vh;">
        <canvas id="gameCanvas" width="860" height="600" style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); background:#111; border-radius:18px; z-index:1;"></canvas>
        <button id="pauseBtn" style="position:absolute; left:124px; top:18px; z-index:10; font-size:1.5em; padding:4px 16px; border-radius:0;">⏸</button>
        <div id="gameInfoBox" style="position:fixed; right:0; top:0; width:320px; min-height:180px; max-height:none; height:auto; z-index:200; display:flex; flex-direction:column; align-items:flex-end; padding:18px 12px 14px 14px; background:rgba(0,0,0,0.45); border-radius:0; box-shadow:0 0 18px #0008;">
        <span style="font-size:0.9em; color:#aaa; letter-spacing:0.1em; margin-bottom:4px; text-align:left; display:block; width:100%;">SCORE</span>
        <span id="scoreInfo" style="font-size:3.2em; color:#fff; font-weight:bold; letter-spacing:0.18em; margin-bottom:10px; text-shadow:0 0 12px #000,0 0 2px #000; font-family:'Share Tech Mono', 'Consolas', monospace;">00000000</span>
        <div id="progressBarContainer" style="width:320px; height:16px; margin-bottom:14px;"></div>
        <span id="levelInfo" style="font-size:1.1em; color:#ffb347; margin-bottom:4px;">Level: -</span>
        <span id="musicTitleInfo" style="font-size:1.2em; color:#fff; margin-bottom:2px; text-align:right; width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${music?.title || ''}</span>
        <span id="artistInfo" style="font-size:1em; color:#aaa; text-align:right; width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${music?.artist || ''}</span>
      </div>
      <div id="pauseOverlay" style="display:none; position:fixed; left:0; top:0; width:100vw; height:100vh; background:rgba(0,0,0,0.7); z-index:1000; align-items:center; justify-content:center; flex-direction:column;">
        <div style="margin-top:40px; display:flex; flex-direction:column; align-items:center;">
          <button id="resumeBtn" style="font-size:1.2em; margin-bottom:24px; border-radius:0;">再開する</button>
          <div id="countdown" style="font-size:2.5em; color:#fff; margin-bottom:16px;"></div>
          <button id="retryBtn" style="font-size:1.2em; margin:12px 0; border-radius:0;">リトライ</button><br>
          <button id="interruptBtn" style="font-size:1.2em; border-radius:0;">中断する</button>
        </div>
      </div>
      <div id="hpGaugeContainer" style="position:absolute; left:145px; top:118px; width:32px; height:440px; z-index:11; display:${mode==='hard'?'block':'none'};"></div>
    </div>
  `;

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const pauseBtn = document.getElementById('pauseBtn');
  const pauseOverlay = document.getElementById('pauseOverlay');

  // 操作範囲をcanvas中央に配置
  // canvasサイズ: 860x600, 操作範囲: 幅680, 高さ400
  // 中央配置のため x=(860-680)/2, y=(600-400)/2
  let area = new MoveArea(90, 100, 680, 400, 'rect');
  let player = new Player(area);
  let bullets = [];
  // 進捗バーをgameInfoBox幅-60pxに調整
  let progressBar = new ProgressBar(0, 0, 320, 16);

  // 選択曲・難易度の弾幕パターンを使用
  const bulletPattern = (music?.patterns?.[difficulty]) ?? [];
  let bulletIndex = 0;

  // 曲の長さ（秒）
  const musicDuration = music && music.duration ? music.duration : 10;
  let startTime = null;
  let elapsed = 0;
  let hp = 3;
  const maxHp = 3;
  let score = 0.0;
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
    const gauge = document.getElementById('hpGaugeContainer');
    if (mode === 'hard') {
      gauge.style.display = 'block';
      const percent = Math.max(0, Math.min(1, hp / maxHp));
      gauge.innerHTML = `
        <svg width="32" height="520">
          <rect x="8" y="8" width="16" height="504" rx="0" ry="0" fill="#333" stroke="#fff" stroke-width="2"/>
          <rect x="8" y="8" width="16" height="${504 * percent}" rx="0" ry="0" fill="#f44" style="transform: translateY(${504 * (1 - percent)}px);"/>
        </svg>
        <div style="color:#fff; font-size:1em; text-align:center;">HP</div>
      `;
    } else {
      gauge.style.display = 'none';
      gauge.innerHTML = '';
    }
  }

  // 進捗バー描画
  function drawProgressBar() {
    const container = document.getElementById('progressBarContainer');
    // canvasを使って描画
    if (!container.querySelector('canvas')) {
      const barCanvas = document.createElement('canvas');
      barCanvas.width = 320;
      barCanvas.height = 16;
      container.appendChild(barCanvas);
    }
    const barCanvas = container.querySelector('canvas');
    // サイズが違う場合は修正
    if (barCanvas.width !== 320 || barCanvas.height !== 16) {
      barCanvas.width = 320;
      barCanvas.height = 16;
    }
    const barCtx = barCanvas.getContext('2d');
    barCtx.clearRect(0, 0, 320, 16);
    progressBar.draw(barCtx);
  }

  // ゲームループ
  let prevTs = null;
  function loop(ts) {
    if (!startTime) startTime = ts;
    if (pauseState) return;
    elapsed = (ts - startTime) / 1000;
    // 前フレームとの差分計算
    let frameSec = 0;
    if (prevTs !== null) {
      frameSec = (ts - prevTs) / 1000;
    }
    prevTs = ts;
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
    // 移動範囲の各起点座標
    const areaPoints = {
      center: { x: area.x + area.width / 2, y: area.y + area.height / 2 },
      left:   { x: area.x, y: area.y + area.height / 2 },
      right:  { x: area.x + area.width, y: area.y + area.height / 2 },
      top:    { x: area.x + area.width / 2, y: area.y },
      bottom: { x: area.x + area.width / 2, y: area.y + area.height },
    };
    while (bulletIndex < bulletPattern.length && bulletPattern[bulletIndex].time <= elapsed) {
      const pattern = bulletPattern[bulletIndex];
      const cfg = { ...pattern.config };
      const origin = cfg.origin || "center";
      const base = areaPoints[origin] || areaPoints.center;
      cfg.x = base.x + (cfg.x ?? 0);
      cfg.y = base.y + (cfg.y ?? 0);
      bullets.push(new Bullet(cfg, area));
      bulletIndex++;
    }
    // 弾幕更新・描画
    for (const b of bullets) b.update();
    for (const b of bullets) b.draw(ctx);

    // スコア自動加算・減点分離
    // フルスコア値
    const fullScore = 10000000;
    const scorePerSec = fullScore / musicDuration;
    // 自動加算（floatで累積、表示時のみ整数化）
    if (frameSec > 0) {
      score += scorePerSec * frameSec;
    }
    // 弾幕とプレイヤーの当たり判定
    let overlapping = 0;
    let hitDetected = false;
    for (const b of bullets) {
      if (!b.active) continue;
      const dist = Math.hypot(player.x - b.x, player.y - b.y);
      if (dist < player.radius + b.radius) {
        overlapping++;
        hitDetected = true;
      }
    }
    // 被弾時に点滅・SE
    if (hitDetected) {
      if (player.hitEffect === 0) {
        player.hitEffect = 16; // 16フレーム点滅（約0.25秒）
        playHitSE();
      }
    }
    // 重なっている弾の数だけスコアを減点（0.01秒ごとに1点）
    if (overlapping > 0) {
      const minus = Math.floor(overlapping * frameSec / 0.01);
      if (minus > 0) score = Math.max(0, score - minus);
    }
    // 上限制限
    if (score > fullScore) score = fullScore;

    // フルスコア演出
    const fullScoreDivId = 'fullScoreEffect';
    if (score === fullScore && !fullScoreShown) {
      fullScoreShown = true;
      fullScoreTimer = 2.0; // 2秒表示
      let fsDiv = document.getElementById(fullScoreDivId);
      if (!fsDiv) {
        fsDiv = document.createElement('div');
        fsDiv.id = fullScoreDivId;
        fsDiv.style.position = 'fixed';
        fsDiv.style.left = '50%';
        fsDiv.style.top = '50%';
        fsDiv.style.transform = 'translate(-50%,-50%)';
        fsDiv.style.fontSize = '4em';
        fsDiv.style.color = '#0ff';
        fsDiv.style.fontWeight = 'bold';
        fsDiv.style.textShadow = '0 0 24px #fff, 0 0 48px #0ff';
        fsDiv.style.zIndex = '9999';
        fsDiv.style.pointerEvents = 'auto';
        fsDiv.textContent = 'FULLSCORE';
        // クリックで消す
        fsDiv.addEventListener('click', () => {
          fsDiv.style.display = 'none';
          fullScoreShown = false;
        });
        document.body.appendChild(fsDiv);
      } else {
        fsDiv.style.display = 'block';
      }
    }
    if (fullScoreShown && fullScoreTimer > 0) {
      fullScoreTimer -= frameSec;
      if (fullScoreTimer <= 0) {
        const fsDiv = document.getElementById(fullScoreDivId);
        if (fsDiv) fsDiv.style.display = 'none';
        fullScoreShown = false;
      }
    }

    // 進行バー（BGMのcurrentTime基準で正確に描画）
    let progress = 0;
    if (bgmAudio && bgmAudio.duration > 0) {
      progress = Math.min(bgmAudio.currentTime / bgmAudio.duration, 1);
    } else {
      progress = Math.min(elapsed / musicDuration, 1);
    }
    progressBar.setProgress(progress);

    // スコア・情報表示
    // 8桁ゼロ埋め＆等幅表示（表示時のみ整数化）
    document.getElementById('scoreInfo').textContent = String(Math.floor(score)).padStart(8, '0');
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
