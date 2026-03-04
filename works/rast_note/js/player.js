// プレイヤー管理
export class Player {
  constructor(area) {
    this.x = area.x + area.width / 2;
    this.y = area.y + area.height / 2;
    this.radius = 12;
    this.speed = 3;
    this.area = area;
    this.alive = true;
  }
  move(dx, dy) {
    const nx = this.x + dx * this.speed;
    const ny = this.y + dy * this.speed;
    // 枠内制限
    this.x = Math.max(this.area.x, Math.min(this.area.x + this.area.width, nx));
    this.y = Math.max(this.area.y, Math.min(this.area.y + this.area.height, ny));
  }
  draw(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#4af';
    ctx.fill();
    ctx.restore();
  }
}