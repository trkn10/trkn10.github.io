// timeline-canvas.js
// タイムラインをcanvasで描画・操作するモジュール

// timeline-canvas.js
(function() {
  const timelineCanvas = document.getElementById('timelineCanvas');
  if (!timelineCanvas) return;
  const tctx = timelineCanvas.getContext('2d');
  // width/heightは常に実ピクセル値で取得
  function syncCanvasSize() {
    const rect = timelineCanvas.getBoundingClientRect();
    timelineCanvas.width = rect.width;
    timelineCanvas.height = rect.height;
    return { width: timelineCanvas.width, height: timelineCanvas.height };
  }
  let { width, height } = syncCanvasSize();

  // 外部変数参照
  let getTimelineData = () => [];
  let getTimelineCurrent = () => window.timelineCurrent || 0;
  let getAudio = () => null;
  let getSelectedIndex = () => null;
  let setTimelineCurrent = v => {};
  let setSelectedIndex = idx => {};
  let onUpdate = () => {};

  // 外部から参照・設定できるようにする
  window.timelineCanvasApi = {
    setAccessors({ getTimelineData, getTimelineCurrent, getAudio, getSelectedIndex, setTimelineCurrent, setSelectedIndex, onUpdate }) {
      if (getTimelineData) this.getTimelineData = getTimelineData;
      if (getTimelineCurrent) this.getTimelineCurrent = getTimelineCurrent;
      if (getAudio) this.getAudio = getAudio;
      if (getSelectedIndex) this.getSelectedIndex = getSelectedIndex;
      if (setTimelineCurrent) this.setTimelineCurrent = setTimelineCurrent;
      if (setSelectedIndex) this.setSelectedIndex = setSelectedIndex;
      if (onUpdate) this.onUpdate = onUpdate;
    },
    getTimelineData: () => getTimelineData(),
    getTimelineCurrent: () => getTimelineCurrent(),
    getAudio: () => getAudio(),
    getSelectedIndex: () => getSelectedIndex(),
    setTimelineCurrent: v => setTimelineCurrent(v),
    setSelectedIndex: idx => setSelectedIndex(idx),
    onUpdate: () => onUpdate(),
    renderTimeline
  };

  // タイムライン描画
  function renderTimeline() {
    // サイズを毎回同期
    ({ width, height } = syncCanvasSize());
    tctx.clearRect(0, 0, width, height);
    const timelineData = getTimelineData();
    const timelineCurrent = getTimelineCurrent();
    const audio = getAudio();
    const selectedIndex = getSelectedIndex();
    // durationはaudio.duration > audio.timelineMaxTime > 30 の順で決定。editor.jsと完全統一
    let duration = 30;
    if (audio && !isNaN(audio.duration) && audio.duration > 0) {
      duration = audio.duration;
    } else if (typeof audio?.timelineMaxTime === 'number' && audio.timelineMaxTime > 0) {
      duration = audio.timelineMaxTime;
    }
    // 軸
    tctx.save();
    tctx.fillStyle = '#222';
    tctx.fillRect(0, 0, width, height);
    tctx.strokeStyle = '#444';
    tctx.lineWidth = 2;
    tctx.beginPath();
    tctx.moveTo(0, height/2);
    tctx.lineTo(width, height/2);
    tctx.stroke();
    tctx.restore();
    // 弾幕ノード
    for (let i = 0; i < timelineData.length; ++i) {
      const b = timelineData[i];
      let x = 0;
      if (b.time <= 0) {
        x = 0;
      } else if (b.time >= duration) {
        x = width;
      } else {
        x = (b.time / duration) * width;
      }
      tctx.save();
      tctx.beginPath();
      tctx.arc(x, height/2, 16, 0, Math.PI*2);
      tctx.fillStyle = b.color || '#fff';
      tctx.globalAlpha = (selectedIndex === i) ? 1 : 0.7;
      tctx.fill();
      tctx.lineWidth = 3;
      tctx.strokeStyle = (selectedIndex === i) ? '#0ff' : '#444';
      tctx.stroke();
      tctx.restore();
    }
    // 現在位置バー
    // timelineCurrent=0 → x=0, timelineCurrent=duration → x=width
    let curX = 0;
    if (timelineCurrent <= 0) {
      curX = 0;
    } else if (timelineCurrent >= duration) {
      curX = width;
    } else {
      curX = (timelineCurrent / duration) * width;
    }
    tctx.save();
    tctx.beginPath();
    tctx.rect(curX-2, 0, 4, height);
    tctx.fillStyle = '#0ff';
    tctx.globalAlpha = 1;
    tctx.fill();
    tctx.restore();
  }

  // 常時再描画ループ
  function animate() {
    renderTimeline();
    requestAnimationFrame(animate);
  }
  animate();

  // マウス操作
  let isDraggingBar = false;
  let dragBarOffset = 0;
  let isDraggingNode = false;
  let dragNodeIndex = null;

  timelineCanvas.addEventListener('mousedown', e => {
    // サイズを毎回同期
    ({ width, height } = syncCanvasSize());
    const rect = timelineCanvas.getBoundingClientRect();
    // 実ピクセル座標に正規化
    const scaleX = timelineCanvas.width / rect.width;
    const scaleY = timelineCanvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const timelineData = getTimelineData();
    const timelineCurrent = getTimelineCurrent();
    const audio = getAudio();
    let duration = 30;
    if (audio && !isNaN(audio.duration) && audio.duration > 0) {
      duration = audio.duration;
    } else if (typeof audio?.timelineMaxTime === 'number' && audio.timelineMaxTime > 0) {
      duration = audio.timelineMaxTime;
    }
    // ノード判定
    for (let i = timelineData.length-1; i >= 0; --i) {
      const b = timelineData[i];
      let bx = 0;
      if (b.time <= 0) {
        bx = 0;
      } else if (b.time >= duration) {
        bx = width;
      } else {
        bx = (b.time / duration) * width;
      }
      if (Math.abs(x-bx) <= 16 && Math.abs(y-height/2) <= 16) {
        // ノード選択
        window.timelineCanvasApi.setSelectedIndex(i);
        window.timelineCanvasApi.onUpdate();
        isDraggingNode = true;
        dragNodeIndex = i;
        dragBarOffset = x - bx;
        return;
      }
    }
    // バー判定
    let curX = 0;
    if (timelineCurrent <= 0) {
      curX = 0;
    } else if (timelineCurrent >= duration) {
      curX = width;
    } else {
      curX = (timelineCurrent / duration) * width;
    }
    if (Math.abs(x-curX) <= 8) {
      isDraggingBar = true;
      dragBarOffset = x - curX;
      return;
    }
    // 軸クリックでバー移動
    let ratio = x / width;
    let t = 0;
    if (ratio <= 0) {
      t = 0;
    } else if (ratio >= 1) {
      t = duration;
    } else {
      t = +(ratio * duration).toFixed(4);
    }
    window.timelineCanvasApi.setTimelineCurrent(t);
    window.timelineCanvasApi.onUpdate();
    isDraggingBar = true;
    dragBarOffset = 0;
  });

  window.addEventListener('mousemove', e => {
    if (!isDraggingBar && !isDraggingNode) return;
    ({ width, height } = syncCanvasSize());
    const rect = timelineCanvas.getBoundingClientRect();
    const scaleX = timelineCanvas.width / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    const timelineData = getTimelineData();
    const audio = getAudio();
    let duration = 30;
    if (audio && !isNaN(audio.duration) && audio.duration > 0) {
      duration = audio.duration;
    } else if (typeof audio?.timelineMaxTime === 'number' && audio.timelineMaxTime > 0) {
      duration = audio.timelineMaxTime;
    }
    if (isDraggingBar) {
      let ratio = (x-dragBarOffset)/width;
      let t = 0;
      if (ratio <= 0) {
        t = 0;
      } else if (ratio >= 1) {
        t = duration;
      } else {
        t = +(ratio * duration).toFixed(4);
      }
      window.timelineCanvasApi.setTimelineCurrent(t);
      window.timelineCanvasApi.onUpdate();
    }
    if (isDraggingNode && dragNodeIndex != null) {
      let ratio = (x-dragBarOffset)/width;
      let t = 0;
      if (ratio <= 0) {
        t = 0;
      } else if (ratio >= 1) {
        t = duration;
      } else {
        t = +(ratio * duration).toFixed(4);
      }
      const data = timelineData[dragNodeIndex];
      data.time = t;
      window.timelineCanvasApi.setSelectedIndex(dragNodeIndex);
      window.timelineCanvasApi.onUpdate();
    }
  });
  window.addEventListener('mouseup', e => {
    isDraggingBar = false;
    isDraggingNode = false;
    dragNodeIndex = null;
  });

  // ダブルクリックで弾幕追加
  timelineCanvas.addEventListener('dblclick', e => {
    ({ width, height } = syncCanvasSize());
    const rect = timelineCanvas.getBoundingClientRect();
    const scaleX = timelineCanvas.width / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    const audio = getAudio();
    let duration = 30;
    if (audio && !isNaN(audio.duration) && audio.duration > 0) {
      duration = audio.duration;
    } else if (typeof audio?.timelineMaxTime === 'number' && audio.timelineMaxTime > 0) {
      duration = audio.timelineMaxTime;
    }
    let ratio = x / width;
    let t = 0;
    if (ratio <= 0) {
      t = 0;
    } else if (ratio >= 1) {
      t = duration;
    } else {
      t = +(ratio * duration).toFixed(4);
    }
    // 外部で追加処理
    if (window.timelineCanvasApi && window.timelineCanvasApi.onAddBullet) {
      window.timelineCanvasApi.onAddBullet(t);
    }
  });

  // リサイズ対応
  window.addEventListener('resize', () => {
    // 親の幅に合わせてcanvas幅を調整
    syncCanvasSize();
    renderTimeline();
  });
})();
