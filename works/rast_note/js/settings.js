import { navigate } from './main.js';

export function showSettings(app) {
  const seVolume = localStorage.getItem('seVolume') !== null ? Number(localStorage.getItem('seVolume')) : 0.8;
  const bgmVolume = localStorage.getItem('bgmVolume') !== null ? Number(localStorage.getItem('bgmVolume')) : 0.8;
  app.innerHTML = `
    <h2>設定</h2>
    <div style="margin-bottom:8px;">
      <div style="font-size:1.1em; text-align:center; margin-bottom:2px;">BGM音量 <span id="bgmVolumeValue">${Math.round(bgmVolume * 100)}</span></div>
      <input type="range" min="0" max="1" step="0.01" id="bgmVolumeSlider" value="${bgmVolume}">
    </div>
    <div style="margin-bottom:8px;">
      <div style="font-size:1.1em; text-align:center; margin-bottom:2px;">SE音量 <span id="seVolumeValue">${Math.round(seVolume * 100)}</span></div>
      <input type="range" min="0" max="1" step="0.01" id="seVolumeSlider" value="${seVolume}">
    </div>
    <button id="backBtn">戻る</button>
    <style>#seVolumeSlider, #bgmVolumeSlider { width: 200px; }</style>
  `;
  document.getElementById('backBtn').onclick = () => navigate('select');
  const seSlider = document.getElementById('seVolumeSlider');
  const seValueLabel = document.getElementById('seVolumeValue');
  seSlider.oninput = e => {
    const v = Number(e.target.value);
    seValueLabel.textContent = Math.round(v * 100);
    localStorage.setItem('seVolume', v);
  };
  const bgmSlider = document.getElementById('bgmVolumeSlider');
  const bgmValueLabel = document.getElementById('bgmVolumeValue');
  bgmSlider.oninput = e => {
    const v = Number(e.target.value);
    bgmValueLabel.textContent = Math.round(v * 100);
    localStorage.setItem('bgmVolume', v);
  };
}
