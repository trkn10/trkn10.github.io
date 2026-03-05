// editor.js

let timelineData = [];
let selectedIndex = null;
let audio = null;
let isPlaying = false;
let timelineCurrent = 0;

const previewCanvas = document.getElementById('previewCanvas');
const ctx = previewCanvas.getContext('2d');
const playBtn = document.getElementById('playBtn');
const musicFile = document.getElementById('musicFile');
const timeline = document.getElementById('timeline');
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

// deleteキーで選択中の弾幕削除
document.addEventListener('keydown', e => {
  if (e.key === 'Delete' && selectedIndex != null) {
    inspDelete.onclick();
    // フォーカスがinput等の場合はデフォルト動作を防ぐ
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
      e.preventDefault();
    }
  }
});

function renderPreview(time) {
  ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  // 枠
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(0, 0, previewCanvas.width, previewCanvas.height);
  // 弾幕
  for (let i = 0; i < timelineData.length; ++i) {
    const b = timelineData[i];
    if (b.time > time) continue;
    ctx.save();
    ctx.beginPath();
    // 起点計算
    let ox = previewCanvas.width/2, oy = previewCanvas.height/2;
    if (b.origin === 'left')   { ox = 0; oy = previewCanvas.height/2; }
    if (b.origin === 'right')  { ox = previewCanvas.width; oy = previewCanvas.height/2; }
    if (b.origin === 'top')    { ox = previewCanvas.width/2; oy = 0; }
    if (b.origin === 'bottom') { ox = previewCanvas.width/2; oy = previewCanvas.height; }
    const x = ox + (b.x||0);
    const y = oy + (b.y||0);
    ctx.arc(x, y, 12, 0, Math.PI*2);
    ctx.fillStyle = b.color || '#fff';
    ctx.globalAlpha = (selectedIndex === i) ? 1 : 0.7;
    ctx.fill();
    ctx.restore();
  }
}

let isDraggingTimeline = false;
function renderTimeline() {
  timeline.innerHTML = '';
  const width = timeline.offsetWidth || 600;
  const duration = audio && audio.duration ? audio.duration : 30;
  // 軸
  const axis = document.createElement('div');
  axis.style.position = 'relative';
  axis.style.height = '80px';
  axis.style.background = '#222';
  axis.style.borderRadius = '16px';
  axis.style.margin = '8px 0';
  axis.style.width = '100%';
  timeline.appendChild(axis);
  // 弾幕ノード
  for (let i = 0; i < timelineData.length; ++i) {
    const b = timelineData[i];
    const left = Math.max(0, Math.min(1, b.time/duration)) * width;
    const node = document.createElement('div');
    node.style.position = 'absolute';
    node.style.left = `${left-16}px`;
    node.style.top = '20px';
    node.style.width = '32px';
    node.style.height = '32px';
    node.style.borderRadius = '50%';
    node.style.background = b.color || '#fff';
    node.style.border = (selectedIndex === i) ? '3px solid #0ff' : '3px solid #444';
    node.style.cursor = 'pointer';
    node.title = `t=${b.time}`;
    node.onclick = () => selectBullet(i);
    axis.appendChild(node);
  }
  // 現在位置バー
  const cur = document.createElement('div');
  cur.style.position = 'absolute';
  cur.style.left = `${Math.max(0, Math.min(1, timelineCurrent/duration)) * width}px`;
  cur.style.top = '0';
  cur.style.width = '4px';
  cur.style.height = '100%';
  cur.style.background = '#0ff';
  cur.style.cursor = 'ew-resize';
  cur.onmousedown = e => {
    isDraggingTimeline = true;
    document.body.style.userSelect = 'none';
    e.stopPropagation();
  };
  axis.appendChild(cur);
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
  } else {
    audio.currentTime = timelineCurrent;
    audio.play();
    playBtn.textContent = '⏸';
    isPlaying = true;
  }
};

musicFile.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  if (audio) audio.pause();
  audio = new Audio(URL.createObjectURL(file));
  audio.volume = parseFloat(audioVolume.value);
  audio.onloadedmetadata = () => {
    renderTimeline();
  };
  audio.ontimeupdate = () => {
    timelineCurrent = audio.currentTime;
    renderPreview(timelineCurrent);
    renderTimeline();
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
  // ノードは32x32, border-radius:50% で生成されている
  if (target !== timeline) {
    // ノードか現在位置バー以外は無視
    if (target.style && (target.style.width === '32px' && target.style.height === '32px')) {
      // 弾幕ノード上なら何もしない（selectBulletはnode.onclickで処理済み）
      return;
    }
  }
  isDraggingTimeline = true;
  document.body.style.userSelect = 'none';
  const rect = timeline.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const width = timeline.offsetWidth || 600;
  const duration = audio && audio.duration ? audio.duration : 30;
  timelineCurrent = Math.max(0, Math.min(1, x / width)) * duration;
  if (audio) audio.currentTime = timelineCurrent;
  renderPreview(timelineCurrent);
  renderTimeline();
};

document.addEventListener('mousemove', e => {
  if (!isDraggingTimeline) return;
  const rect = timeline.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const width = timeline.offsetWidth || 600;
  const duration = audio && audio.duration ? audio.duration : 30;
  timelineCurrent = Math.max(0, Math.min(1, x / width)) * duration;
  if (audio) audio.currentTime = timelineCurrent;
  renderPreview(timelineCurrent);
  renderTimeline();
});
document.addEventListener('mouseup', e => {
  if (isDraggingTimeline) {
    isDraggingTimeline = false;
    document.body.style.userSelect = '';
  }
});

// 弾幕追加（タイムライン上ダブルクリックで追加）
timeline.ondblclick = e => {
  const rect = timeline.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const width = timeline.offsetWidth || 600;
  const duration = audio && audio.duration ? audio.duration : 30;
  const t = (x / width) * duration;
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

// 初期化
window.onload = () => {
  renderPreview(0);
  renderTimeline();
  updateJson();
};
