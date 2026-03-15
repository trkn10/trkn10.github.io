// waveform.js
// 音声ファイルの波形データをcanvasに描画し、スクロール対応する

(function() {
  // 波形データ・状態をグローバル管理
  let waveformData = null;
  let audioBuffer = null;
  let duration = 30;
  let viewStart = 0; // 秒
  let viewWidth = 30; // 秒（表示範囲）
  let scrollValue = 0;
  let scrollMax = 1000;

  // 音声ファイル選択時に波形生成
  document.addEventListener('DOMContentLoaded', () => {
    const musicFile = document.getElementById('musicFile');
    if (!musicFile) return;
    musicFile.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(ev) {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtx.decodeAudioData(ev.target.result).then(buffer => {
          audioBuffer = buffer;
          duration = buffer.duration;
          waveformData = extractWaveform(buffer, 1200 * 3); // 3画面分
          if (window.timelineCanvasApi && window.timelineCanvasApi.renderTimeline) {
            window.timelineCanvasApi.renderTimeline();
          }
        });
      };
      reader.readAsArrayBuffer(file);
    });
  });

  // 波形データ抽出（サンプル数を指定して単純ダウンサンプリング）
  function extractWaveform(buffer, samples) {
    const channel = buffer.getChannelData(0);
    const blockSize = Math.floor(channel.length / samples);
    const data = [];
    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channel[i * blockSize + j] || 0);
      }
      data.push(sum / blockSize);
    }
    return data;
  }

  // 波形描画
  // タイムラインcanvasから呼び出される波形描画用データ取得API
  window.waveformApi = {
    getWaveformData: () => waveformData,
    getAudioBuffer: () => audioBuffer,
    getDuration: () => duration,
    getViewStart: () => viewStart,
    getViewWidth: () => viewWidth,
    setScrollValue: v => { scrollValue = v; },
    getScrollValue: () => scrollValue,
    getScrollMax: () => scrollMax,
    setViewStart: v => { viewStart = v; },
    setViewWidth: v => { viewWidth = v; },
    setScrollMax: v => { scrollMax = v; },
  };

  // 旧UI要素は生成しない
})();
