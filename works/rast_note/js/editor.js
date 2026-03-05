// editor.js

let timelineData = [];
let selectedIndex = null;
let audio = null;


let isPlaying = false;
let timelineCurrent = 0;
window.timelineCurrent = 0;
let previewAnimId = null;
let timelineAnimId = null;
let lastPreviewTime = null;
// 曲の再生中に最大currentTimeを記録
let timelineMaxTime = 0;


const previewCanvas = document.getElementById('previewCanvas');
const ctx = previewCanvas.getContext('2d');
const playBtn = document.getElementById('playBtn');
const musicFile = document.getElementById('musicFile');
const timelineCanvas = document.getElementById('timelineCanvas');
const timelineTime = document.getElementById('timelineTime');
const audioVolume = document.getElementById('audioVolume');
const jsonText = document.getElementById('jsonText');
const copyJson = document.getElementById('copyJson');

// Inspector
const inspTime = document.getElementById('inspTime');
const inspType = document.getElementById('inspType');
const inspOrigin = document.getElementById('inspOrigin');
const inspX = document.getElementById('inspX');
const inspY = document.getElementById('inspY');
const inspAngle = document.getElementById('inspAngle');
const inspSpeed = document.getElementById('inspSpeed');
const inspColor = document.getElementById('inspColor');
const inspApply = document.getElementById('inspApply');
const inspDelete = document.getElementById('inspDelete');

// 削除ボタン処理
inspDelete.onclick = () => {
  if (selectedIndex == null) return;
  timelineData.splice(selectedIndex, 1);
  selectedIndex = null;
  renderPreview(timelineCurrent);
  renderTimeline();
  updateJson();
  // インスペクター初期化
  inspTime.value = '';
  inspType.value = 'normal';
  inspOrigin.value = 'center';
  inspX.value = '';
  inspY.value = '';
  inspAngle.value = '';
  inspSpeed.value = '';
  inspColor.value = '#ffffff';
};

// deleteキーで選択中の弾幕削除 & スペースキーで再生/一時停止
document.addEventListener('keydown', e => {
  // input/textareaにフォーカス中はスペース・矢印操作を無効化
  const isInput = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');
  if (e.key === 'Delete' && selectedIndex != null) {
    inspDelete.onclick();
    if (isInput) e.preventDefault();
  }
  if ((e.key === ' ' || e.code === 'Space') && !isInput) {
    playBtn.click();
    e.preventDefault();
  }
  // 矢印キーで現在位置バー微調整
  if (!isInput && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    // duration決定ロジックをcanvas側と統一
    let duration = 30;
    if (audio && !isNaN(audio.duration) && audio.duration > 0) {
      duration = audio.duration;
    } else if (typeof audio?.timelineMaxTime === 'number' && audio.timelineMaxTime > 0) {
      duration = audio.timelineMaxTime;
    }
    let step = 1/60; // デフォルト1フレーム(約0.0167秒)
    if (e.ctrlKey) step = 1/240; // Ctrlでさらに細かく
    if (e.shiftKey) step = 1/10; // Shiftで大きく
    if (e.key === 'ArrowLeft') timelineCurrent = Math.max(0, +(timelineCurrent - step).toFixed(4));
    if (e.key === 'ArrowRight') timelineCurrent = Math.min(duration, +(timelineCurrent + step).toFixed(4));
    if (audio) audio.currentTime = timelineCurrent;
    renderPreview(timelineCurrent);
    renderTimeline();
    e.preventDefault();
  }
});


function renderPreview(time) {
  ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  // 枠
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(0, 0, previewCanvas.width, previewCanvas.height);
  // 弾幕（発射後は進行位置を計算して描画）
  for (let i = 0; i < timelineData.length; ++i) {
    const b = timelineData[i];
    if (b.time > time) continue;
    // 経過時間
    const t = time - b.time;
    // 起点
    let ox = previewCanvas.width/2, oy = previewCanvas.height/2;
    if (b.origin === 'left')   { ox = 0; oy = previewCanvas.height/2; }
    if (b.origin === 'right')  { ox = previewCanvas.width; oy = previewCanvas.height/2; }
    if (b.origin === 'top')    { ox = previewCanvas.width/2; oy = 0; }
    if (b.origin === 'bottom') { ox = previewCanvas.width/2; oy = previewCanvas.height; }
    // 初期位置
    let x = ox + (b.x||0);
    let y = oy + (b.y||0);
    // 進行（速度・角度）
    if (b.speed && b.angle != null) {
      const rad = (b.angle || 0) * Math.PI / 180;
      x += Math.cos(rad) * b.speed * t * 30; // 速度は1で30px/s基準
      y += Math.sin(rad) * b.speed * t * 30;
    }
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI*2);
    ctx.fillStyle = b.color || '#fff';
    ctx.globalAlpha = (selectedIndex === i) ? 1 : 0.7;
    ctx.fill();
    ctx.restore();
  }
}

function startPreviewLoop() {
  if (previewAnimId) cancelAnimationFrame(previewAnimId);
  if (timelineAnimId) cancelAnimationFrame(timelineAnimId);
  function loop() {
    let shouldContinue = false;
    if (isPlaying && audio) {
      timelineCurrent = audio.currentTime;
      // 再生中は最大値を記録
      if (timelineCurrent > timelineMaxTime) timelineMaxTime = timelineCurrent;
      window.timelineCurrent = timelineCurrent;
      shouldContinue = true;
    }
    if (!isPlaying && isDraggingTimeline) {
      window.timelineCurrent = timelineCurrent;
      shouldContinue = true;
    }
    window.timelineCurrent = timelineCurrent;
    renderPreview(Math.round(timelineCurrent * 100) / 100);
    renderTimeline();
    if (shouldContinue) {
      previewAnimId = requestAnimationFrame(loop);
    } else {
      previewAnimId = null;
    }
  }
  previewAnimId = requestAnimationFrame(loop);
}

function renderTimeline() {
  if (timelineTime) timelineTime.textContent = timelineCurrent.toFixed(2);
  if (window.timelineCanvasApi) {
    // timelineMaxTimeもaudioに必ず付与して返す
    window.timelineCanvasApi.setAccessors({
      getTimelineData: () => timelineData,
      getTimelineCurrent: () => timelineCurrent,
      getAudio: () => {
        if (!audio) return { timelineMaxTime };
        // timelineMaxTimeを常に付与（enumerableでない場合も明示的に）
        if (typeof audio.timelineMaxTime !== 'number' || audio.timelineMaxTime !== timelineMaxTime) {
          Object.defineProperty(audio, 'timelineMaxTime', {
            value: timelineMaxTime,
            writable: true,
            configurable: true,
            enumerable: true
          });
        }
        return audio;
      },
      getSelectedIndex: () => selectedIndex,
      setTimelineCurrent: v => {
        timelineCurrent = v;
        window.timelineCurrent = v;
        if (audio && isPlaying) audio.currentTime = v;
        renderPreview(timelineCurrent);
        renderTimeline();
      },
      setSelectedIndex: idx => { selectedIndex = idx; },
      onUpdate: () => { renderPreview(timelineCurrent); renderTimeline(); updateJson(); },
    });
    window.timelineCanvasApi.renderTimeline();
  }
}

function updateJson() {
  jsonText.value = JSON.stringify(timelineData, null, 2);
}

function selectBullet(idx) {
  selectedIndex = idx;
  const b = timelineData[idx];
  inspTime.value = b.time;
  inspType.value = b.type;
  inspOrigin.value = b.origin;
  inspX.value = b.x;
  inspY.value = b.y;
  inspAngle.value = b.angle;
  inspSpeed.value = b.speed;
  inspColor.value = b.color || '#ffffff';
  renderPreview(timelineCurrent);
  renderTimeline();
}

inspApply.onclick = () => {
  if (selectedIndex == null) return;
  const b = timelineData[selectedIndex];
  b.time = parseFloat(inspTime.value);
  b.type = inspType.value;
  b.origin = inspOrigin.value;
  b.x = parseFloat(inspX.value);
  b.y = parseFloat(inspY.value);
  b.angle = parseFloat(inspAngle.value);
  b.speed = parseFloat(inspSpeed.value);
  b.color = inspColor.value;
  renderPreview(timelineCurrent);
  renderTimeline();
  updateJson();
};

copyJson.onclick = () => {
  jsonText.select();
  document.execCommand('copy');
};


playBtn.onclick = () => {
  if (!audio) return;
  if (isPlaying) {
    audio.pause();
    playBtn.textContent = '▶';
    isPlaying = false;
    if (previewAnimId) cancelAnimationFrame(previewAnimId);
    previewAnimId = null;
  } else {
    audio.currentTime = timelineCurrent;
    audio.play();
    playBtn.textContent = '⏸';
    isPlaying = true;
    startPreviewLoop();
  }
};

musicFile.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  if (audio) audio.pause();
  timelineMaxTime = 0; // 曲切り替え時に必ず初期化
  audio = new Audio(URL.createObjectURL(file));
  audio.volume = parseFloat(audioVolume.value);
  audio.onloadedmetadata = () => {
    renderTimeline();
  };
  audio.ontimeupdate = () => {
    timelineCurrent = audio.currentTime;
    if (timelineCurrent > timelineMaxTime) timelineMaxTime = timelineCurrent;
    renderTimeline();
    if (timelineTime) timelineTime.textContent = timelineCurrent.toFixed(2);
    // プレビューはrequestAnimationFrameで滑らかに描画
  };
  audio.onpause = () => {
    playBtn.textContent = '▶';
    isPlaying = false;
  };
  audio.onended = () => {
    playBtn.textContent = '▶';
    isPlaying = false;
    timelineCurrent = 0;
    renderPreview(timelineCurrent);
    renderTimeline();
  };
};

audioVolume.oninput = e => {
  if (audio) audio.volume = parseFloat(audioVolume.value);
};



timeline.onmousedown = e => {
  // 左クリックのみ
  if (e.button !== 0) return;
  // 弾幕ノード上かどうか判定
  let target = e.target;
  if (target !== timeline) {
    if (target.style && (target.style.width === '32px' && target.style.height === '32px')) {
      return;
    }
  }
  isDraggingTimeline = true;
  document.body.style.userSelect = 'none';
  const rect = timeline.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const width = timeline.offsetWidth || 600;
  // duration決定ロジックをcanvas側と統一
  let duration = 30;
  if (audio && !isNaN(audio.duration) && audio.duration > 0) {
    duration = audio.duration;
  } else if (typeof audio?.timelineMaxTime === 'number' && audio.timelineMaxTime > 0) {
    duration = audio.timelineMaxTime;
  }
  // x=0→timelineCurrent=0, x=width→timelineCurrent=duration
  let ratio = x / width;
  if (ratio <= 0) {
    timelineCurrent = 0;
  } else if (ratio >= 1) {
    timelineCurrent = duration;
  } else {
    timelineCurrent = +(ratio * duration).toFixed(4);
  }
  if (audio) audio.currentTime = timelineCurrent;
  renderTimeline();
  startPreviewLoop();
};

document.addEventListener('mousemove', e => {
  if (!isDraggingTimeline) return;
  const rect = timeline.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const width = timeline.offsetWidth || 600;
  // duration決定ロジックをcanvas側と統一
  let duration = 30;
  if (audio && !isNaN(audio.duration) && audio.duration > 0) {
    duration = audio.duration;
  } else if (typeof audio?.timelineMaxTime === 'number' && audio.timelineMaxTime > 0) {
    duration = audio.timelineMaxTime;
  }
  let ratio = x / width;
  if (ratio <= 0) {
    timelineCurrent = 0;
  } else if (ratio >= 1) {
    timelineCurrent = duration;
  } else {
    timelineCurrent = +(ratio * duration).toFixed(4);
  }
  if (audio) audio.currentTime = timelineCurrent;
  renderTimeline();
  startPreviewLoop();
});
document.addEventListener('mouseup', e => {
  if (isDraggingTimeline) {
    isDraggingTimeline = false;
    document.body.style.userSelect = '';
    renderPreview(timelineCurrent);
    if (previewAnimId) cancelAnimationFrame(previewAnimId);
    previewAnimId = null;
  }
});

// タイムラインcanvasから弾幕追加
if (window.timelineCanvasApi) {
  window.timelineCanvasApi.onAddBullet = t => {
    const newBullet = {
      time: t,
      type: 'normal',
      origin: 'center',
      x: 0, y: 0,
      angle: 0,
      speed: 2,
      color: '#ffffff'
    };
    timelineData.push(newBullet);
    selectedIndex = timelineData.length - 1;
    renderPreview(timelineCurrent);
    renderTimeline();
    updateJson();
    selectBullet(selectedIndex);
  };
}

// 初期化
window.onload = () => {
  // timeline-canvas.js連携
  if (window.timelineCanvasApi) {
    window.timelineCanvasApi.setAccessors({
      getTimelineData: () => timelineData,
      getTimelineCurrent: () => timelineCurrent,
      getAudio: () => audio,
      getSelectedIndex: () => selectedIndex,
      setTimelineCurrent: v => {
        timelineCurrent = v;
        window.timelineCurrent = v;
        if (audio && isPlaying) audio.currentTime = v;
        renderPreview(timelineCurrent);
        renderTimeline();
      },
      setSelectedIndex: idx => { selectedIndex = idx; },
      onUpdate: () => { renderPreview(timelineCurrent); renderTimeline(); updateJson(); },
    });
    window.timelineCanvasApi.onAddBullet = t => {
      const newBullet = {
        time: t,
        type: 'normal',
        origin: 'center',
        x: 0, y: 0,
        angle: 0,
        speed: 2,
        color: '#ffffff'
      };
      timelineData.push(newBullet);
      selectedIndex = timelineData.length - 1;
      renderPreview(timelineCurrent);
      renderTimeline();
      updateJson();
      selectBullet(selectedIndex);
    };
  }
  renderPreview(0);
  renderTimeline();
  updateJson();
  if (timelineTime) timelineTime.textContent = '0.00';
  // 再生停止中も常時バーを動かす
  function idleLoop() {
    window.timelineCurrent = timelineCurrent;
    renderTimeline();
    requestAnimationFrame(idleLoop);
  }
  idleLoop();
};
