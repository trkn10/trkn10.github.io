// 移動範囲管理・拡張性重視
export class MoveArea {
  constructor(x, y, width, height, shape = 'rect') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.shape = shape; // 今後多角形等も拡張可
  }
  draw(ctx) {
    ctx.save();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    if (this.shape === 'rect') {
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
    // 他shape拡張可
    ctx.restore();
  }
}