// 曲進行バー
export class ProgressBar {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.progress = 0; // 0~1
  }
  setProgress(p) {
    this.progress = Math.max(0, Math.min(1, p));
  }
  draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#444';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = '#4af';
    ctx.fillRect(this.x, this.y, this.width * this.progress, this.height);
    ctx.restore();
  }
}