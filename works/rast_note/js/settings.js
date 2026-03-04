import { navigate } from './main.js';

export function showSettings(app) {
  const seEnabled = localStorage.getItem('seEnabled') !== 'false';
  const volume = localStorage.getItem('volume') !== null ? Number(localStorage.getItem('volume')) : 0.8;
  app.innerHTML = `
    <h2>設定</h2>
    <div style="margin-bottom:8px;">
      <div style="font-size:1.1em; text-align:center; margin-bottom:2px;" id="volumeValue">${Math.round(volume * 100)}</div>
      <input type="range" min="0" max="1" step="0.01" id="volumeSlider" value="${volume}">
    </div>
    <label><input type="checkbox" id="seCheckbox" ${seEnabled ? 'checked' : ''}> SE（効果音）ON</label><br>
    <button id="backBtn">戻る</button>
    <style>#seCheckbox { transform: scale(1.3); margin-right: 0.5em; }</style>
    <style>#volumeSlider { width: 200px; }</style>
  `;
  document.getElementById('backBtn').onclick = () => navigate('menu');
  document.getElementById('seCheckbox').onchange = e => {
    localStorage.setItem('seEnabled', e.target.checked);
  };
  const slider = document.getElementById('volumeSlider');
  const valueLabel = document.getElementById('volumeValue');
  slider.oninput = e => {
    const v = Number(e.target.value);
    valueLabel.textContent = Math.round(v * 100);
    localStorage.setItem('volume', v);
  };
}
