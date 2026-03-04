console.log("main.js loaded");
import { showMenu } from './menu.js';
import { showSelect } from './select.js';
import { startGame } from './game.js';
import { showResult } from './result.js';
import { showSettings } from './settings.js';

const app = document.getElementById('app');

export function navigate(screen, params = {}) {
  app.innerHTML = '';
  switch (screen) {
    case 'menu': showMenu(app); break;
    case 'select': showSelect(app); break;
    case 'game': startGame(app, params); break;
    case 'result': showResult(app, params); break;
    case 'settings': showSettings(app); break;
  }
}

// 初期画面
navigate('menu');