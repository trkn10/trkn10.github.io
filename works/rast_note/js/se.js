// SE管理
export class SEManager {
  constructor() {
    this.enabled = true;
    this.volume = localStorage.getItem('seVolume') !== null ? Number(localStorage.getItem('seVolume')) : 0.8;
    this.sounds = {
      hit: new Audio('se/hit.mp3') // 必要に応じてパス調整
    };
    for (const key in this.sounds) {
      this.sounds[key].volume = this.volume;
    }
  }
  play(name) {
    if (this.enabled && this.sounds[name]) {
      this.sounds[name].currentTime = 0;
      this.sounds[name].volume = this.volume;
      this.sounds[name].play();
    }
  }
  setEnabled(flag) {
    this.enabled = flag;
  }
  setVolume(vol) {
    this.volume = vol;
    for (const key in this.sounds) {
      this.sounds[key].volume = vol;
    }
  }
}