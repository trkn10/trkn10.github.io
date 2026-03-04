import { navigate } from './main.js';

export function showSettings(app) {
  const seEnabled = localStorage.getItem('seEnabled') !== 'false';
  app.innerHTML = `
    <h2>設定</h2>
    <label>音量: <input type="range" min="0" max="1" step="0.01" id="volumeSlider"></label><br>
    <label><input type="checkbox" id="seCheckbox" ${seEnabled ? 'checked' : ''}> SE（効果音）ON</label><br>
    <button id="backBtn">戻る</button>
    <style>#seCheckbox { transform: scale(1.3); margin-right: 0.5em; }</style>
  `;
  document.getElementById('backBtn').onclick = () => navigate('menu');
  // 音量設定の保存・反映はaudio.jsで管理
  document.getElementById('seCheckbox').onchange = e => {
    localStorage.setItem('seEnabled', e.target.checked);
  };
}
