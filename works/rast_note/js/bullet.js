// 弾幕管理・拡張性重視
export class Bullet {
  constructor(config, area) {
    this.x = config.x;
    this.y = config.y;
    this.radius = config.radius || 10;
    this.speed = config.speed || 2;
    this.angle = config.angle || 0;
    this.type = config.type || 'normal';
    this.color = config.color || '#f44';
    this.area = area;
    this.bounce = config.bounce || 0;
    this.bounced = 0;
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    this.active = true;
    this.extra = config.extra || {};
  }
  update() {
    if (!this.active) return;
    this.x += this.vx;
    this.y += this.vy;
    // 拡張: 跳ね返り特性
    if (this.type === 'bounce') {
      let bounced = false;
      if (this.x - this.radius < this.area.x || this.x + this.radius > this.area.x + this.area.width) {
        this.vx *= -1;
        bounced = true;
      }
      if (this.y - this.radius < this.area.y || this.y + this.radius > this.area.y + this.area.height) {
        this.vy *= -1;
        bounced = true;
      }
      if (bounced) this.bounced++;
      if (this.bounced > this.bounce) this.active = false;
    } else {
      // 枠外に出たら消す
      if (
        this.x + this.radius < this.area.x ||
        this.x - this.radius > this.area.x + this.area.width ||
        this.y + this.radius < this.area.y ||
        this.y - this.radius > this.area.y + this.area.height
      ) {
        this.active = false;
      }
    }
  }
  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.restore();
  }
}