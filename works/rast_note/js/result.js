import { navigate } from './main.js';

export function showResult(app, { score = 0, damage = 0, musicId }) {
  app.innerHTML = `
    <h2>リザルト</h2>
    <p>Score: ${score}</p>
    <p>Damage: ${damage}</p>
    <button id="retryBtn">リトライ</button>
    <button id="selectBtn">楽曲選択へ</button>
  `;
  document.getElementById('retryBtn').onclick = () => navigate('game', { musicId });
  document.getElementById('selectBtn').onclick = () => navigate('select');
}
