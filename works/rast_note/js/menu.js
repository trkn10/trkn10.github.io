import { navigate } from './main.js';

export function showMenu(app) {
  app.innerHTML = `
    <h1>RAST NOTE</h1>
    <button id="musicPlayBtn">MusicPlay</button>
    <button id="settingsBtn">Settings</button>
  `;
  document.getElementById('musicPlayBtn').onclick = () => navigate('select');
  document.getElementById('settingsBtn').onclick = () => navigate('settings');
}
