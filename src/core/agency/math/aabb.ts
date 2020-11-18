import Vector from './vector';

export class AABB {

  private _bottomLeft: Vector;
  private _topRight: Vector;
  private _centre: Vector;

  constructor(  
    tl: Vector,
    br: Vector) {
    this._bottomLeft = tl;
    this._topRight = br;
    this._centre = tl.add(br).div(2.0);
  }

  hypotenuseLength(): number {
    return this.bottomLeft.distanceTo(this.topRight);
  }

  // returns true if the bbox described by
  // other intersects with this one.
  isOverlappedWith(other: AABB): boolean {
    return !(
      other.top < this.bottom ||
      other.bottom > this.top ||
      other.left > this.right ||
      other.right < this.left
    );
  }

  get bottomLeft(): Vector { return this._bottomLeft; }
  get topRight(): Vector { return this._topRight; }
  get centre(): Vector { return this._centre; }

  get top(): number { return this._topRight.y; }
  get left(): number { return this._bottomLeft.x; }
  get bottom(): number { return this._bottomLeft.y; }
  get right(): number { return this._topRight.x; }

  get width(): number { return Math.abs(this.right - this.left); }
  get height(): number { return Math.abs(this.top - this.bottom); }

  get corners(): Vector[] {
    return [
      new Vector(this.left, this.top),
      new Vector(this.right, this.top),
      new Vector(this.right, this.bottom),
      new Vector(this.left, this.bottom),
    ]
  };
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

  get width(): number { return Math.abs(this.right - this.left); }
  get height(): number { return Math.abs(this.top - this.bottom); }

  get corners(): Vector[] {
    return [
      new Vector(this.left, this.top),
      new Vector(this.right, this.top),
      new Vector(this.right, this.bottom),
      new Vector(this.left, this.bottom),
    ]
  };
}
