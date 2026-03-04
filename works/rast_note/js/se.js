// SE管理
export class SEManager {
  constructor() {
    this.enabled = true;
    this.sounds = {
      hit: new Audio('se/hit.mp3') // 必要に応じてパス調整
    };
  }
  play(name) {
    if (this.enabled && this.sounds[name]) {
      this.sounds[name].currentTime = 0;
      this.sounds[name].play();
    }
  }
  setEnabled(flag) {
    this.enabled = flag;
  }
}