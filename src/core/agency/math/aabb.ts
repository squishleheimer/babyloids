import Vector from './vector';

export class AABB {

  private bottomLeft: Vector;
  private topRight: Vector;
  private center: Vector;

  constructor(
    tl: Vector,
    br: Vector) {
    this.bottomLeft = tl;
    this.topRight = br;
    this.center = tl.add(br).div(2.0);
  }

  hypotenuseLength(): number {
    return this.BottomLeft().distanceTo(this.TopRight());
  }

  // returns true if the bbox described by
  // other intersects with this one.
  isOverlappedWith(other: AABB): boolean {
    return !(
      other.Top() < this.Bottom() ||
      other.Bottom() > this.Top() ||
      other.Left() > this.Right() ||
      other.Right() < this.Left()
    );
  }

  BottomLeft(): Vector { return this.bottomLeft; }
  TopRight(): Vector { return this.topRight; }
  Center(): Vector { return this.center; }

  Top(): number { return this.topRight.y; }
  Left(): number { return this.bottomLeft.x; }
  Bottom(): number { return this.bottomLeft.y; }
  Right(): number { return this.topRight.x; }
}

export class AABBInverted {

// tslint:disable-next-line: variable-name
  private _topLeft: Vector;
// tslint:disable-next-line: variable-name
  private _bottomRight: Vector;
// tslint:disable-next-line: variable-name
  private _centre: Vector;

  constructor(
    topLeft: Vector,
    bottomRight: Vector) {
    this._topLeft = topLeft;
    this._bottomRight = bottomRight;
    this._centre = topLeft.add(bottomRight).div(2.0);
  }

  hypotenuseLength(): number {
    return this.bottomLeft.distanceTo(this.topRight);
  }

  // returns true if the bbox described by
  // other intersects with this one.
  isOverlappedWith(other: AABBInverted): boolean {
    return !(
      other.top > this.bottom ||
      other.bottom < this.top ||
      other.left > this.right ||
      other.right < this.left
    );
  }

  get bottomLeft(): Vector { return this._topLeft; }
  get topRight(): Vector { return this._bottomRight; }
  get centre(): Vector { return this._centre; }

  get top(): number { return this._topLeft.y; }
  get left(): number { return this._topLeft.x; }
  get bottom(): number { return this._bottomRight.y; }
  get right(): number { return this._bottomRight.x; }

  get width(): number { return (this.right - this.left) * 0.5; }
  get height(): number { return (this.top - this.bottom) * 0.5; }

  get corners(): Vector[] {
    return [
      new Vector(this.left, this.top),
      new Vector(this.right, this.top),
      new Vector(this.right, this.bottom),
      new Vector(this.left, this.bottom),
    ]
  };
}
