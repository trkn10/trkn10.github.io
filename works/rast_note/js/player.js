// プレイヤー管理
export class Player {
  constructor(area, color = '#4af') {
    this.x = area.x + area.width / 2;
    this.y = area.y + area.height / 2;
    this.radius = 12;
    this.speed = 3;
    this.area = area;
    this.alive = true;
    this.hitEffect = 0; // 被弾点滅フレーム数
    this.baseColor = color;
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
    // 被弾点滅中は赤色、それ以外はbaseColor
    if (this.hitEffect > 0 && Math.floor(this.hitEffect / 2) % 2 === 0) {
      ctx.fillStyle = '#f44';
    } else {
      ctx.fillStyle = this.baseColor;
    }
    ctx.fill();
    ctx.restore();
    if (this.hitEffect > 0) this.hitEffect--;
  }
}