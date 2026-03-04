

import { navigate } from './main.js';
import { MUSIC_LIST, DIFFICULTIES } from './musicdb.js';

let selectedDifficulty = DIFFICULTIES[0].id;
let selectedMode = 'normal'; // 'normal' or 'hard'

export function showSelect(app) {
  app.innerHTML = `
    <div style="position: relative;">
      <button id="settingsBtn" title="設定" style="position: absolute; top: 0; right: 0; background: none; border: none; font-size: 2em; color: #aaa; cursor: pointer; z-index: 1001; padding: 8px 12px;">
        <span style="font-family: 'Segoe UI Symbol', 'Arial', sans-serif;">&#9881;</span>
      </button>
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <h2>楽曲選択</h2>
        <div>
          <div id="modeBtns" style="display: flex; gap: 8px; margin-bottom: 4px;">
            <button class="modeBtn${selectedMode === 'normal' ? ' selected' : ''}" data-mode="normal">Normal</button>
            <button class="modeBtn${selectedMode === 'hard' ? ' selected' : ''}" data-mode="hard">Hard</button>
          </div>
          <div id="difficultyBtns" style="display: flex; gap: 8px;">
            ${DIFFICULTIES.map(d => `<button class="difficultyBtn${selectedDifficulty === d.id ? ' selected' : ''}" data-id="${d.id}">${d.label}</button>`).join('')}
          </div>
        </div>
      </div>
      <ul id="musicList">
        ${MUSIC_LIST.map(m => {
          const level = m.levels[selectedDifficulty] ?? '-';
          return `<li><span class="level">Lv.${level}</span> <button class="musicBtn" data-id="${m.id}">${m.title}</button><br><span class="artist-label">${m.artist ?? ''}</span></li>`;
        }).join('')}
      </ul>
      <button id="backBtn">戻る</button>
      <style>
        .difficultyBtn.selected { background: #4af; color: #fff; font-weight: bold; }
        .modeBtn.selected { background: #f44; color: #fff; font-weight: bold; }
        .level { display: inline-block; min-width: 3em; text-align: right; margin-right: 0.5em; color: #ffb347; }
        .artist-label { display: block; font-size: 0.85em; color: #aaa; margin-left: 4.5em; margin-top: 0.1em; }
      </style>
    </div>
  `;

  document.querySelectorAll('.modeBtn').forEach(btn => {
    btn.onclick = () => {
      selectedMode = btn.dataset.mode;
      showSelect(app);
    };
  });
  document.querySelectorAll('.difficultyBtn').forEach(btn => {
    btn.onclick = () => {
      selectedDifficulty = btn.dataset.id;
      showSelect(app); // 再描画
    };
  });
  document.querySelectorAll('.musicBtn').forEach(btn => {
    btn.onclick = () => navigate('game', { musicId: btn.dataset.id, difficulty: selectedDifficulty, mode: selectedMode });
  });
  document.getElementById('backBtn').onclick = () => navigate('menu');
  document.getElementById('settingsBtn').onclick = () => navigate('settings');
}