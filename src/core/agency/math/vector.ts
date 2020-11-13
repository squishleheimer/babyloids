import { rand, randInRange } from './random';

export default class Vector {

  static get ZERO(): Vector { return new Vector(0, 0); }

  static get UNIT_X(): Vector { return new Vector(1, 0); }
  static get UNIT_Y(): Vector { return new Vector(0, 1); }

  constructor(public x: number, public y: number) {
  }

  static from(v: any): Vector {
    return new Vector(v.x, v.y);
  }

  static randomUnit(): Vector {
    const r = new Vector(
      rand(),
      rand()).unit();
    return r;
  }

  static randInRect(rect: Vector, radius?: number): Vector {
    const x = randInRange(radius ? radius : 0, radius ? rect.x - radius : rect.x);
    const y = randInRange(radius ? radius : 0, radius ? rect.y - radius : rect.y);
    return new Vector(x, y);
  }

  set(v: Vector): void {
    this.x = v.x;
    this.y = v.y;
  }

  zero(): void {
    this.x = 0;
    this.y = 0;
  }

  negate(): void {
    this.x = -this.x;
    this.y = -this.y;
  }

  neg(): Vector {
    return new Vector(-this.x, -this.y);
  }

  toString(): string {
    return `${this.x}, ${this.y}, ${this.length}`;
  }

  add(v: Vector) {
    return new Vector(
      this.x + v.x,
      this.y + v.y);
  }

  addTo(v: Vector) {
    this.x += v.x;
    this.y += v.y;
  }

  sub(v: Vector) {
    return new Vector(
      this.x - v.x,
      this.y - v.y);
  }

  subFrom(v: Vector) {
    this.x -= v.x;
    this.y -= v.y;
  }

  mult(n: number) {
    return new Vector(this.x * n, this.y * n);
  }

  div(n: number) {
    return new Vector(this.x / n, this.y / n);
  }

  setAngle(angle: number) {
    const length = this.length;
    this.x = Math.cos(angle) * length;
    this.y = Math.sin(angle) * length;
  }

  setLength(length: number) {
    const angle = this.angle;
    this.x = Math.cos(angle) * length;
    this.y = Math.sin(angle) * length;
    return this;
  }

  truncate(max: number) {
    if (this.length > max) {
      this.normalize();
      this.multiply(max);
    }
  }

  perp(): Vector {
    return new Vector(-this.y, this.x);
  }

  dot(v: Vector): number {
    return this.x * v.x + this.y * v.y;
  }

  get angle() {
    return Math.atan2(this.y, this.x);
  }

  get length() {
    return Math.sqrt(this.getLengthSq());
  }

  getLengthSq() {
    return this.x * this.x + this.y * this.y;
  }

  distanceTo(v: Vector) {
    return this.sub(v).length;
  }

  divide(n: number) {
    this.x /= n;
    this.y /= n;
    return this;
  }

  multiply(n: number) {
    this.x *= n;
    this.y *= n;
    return this;
  }

  normalize() {
    const d = this.length;
    if (d < 1.0) {
      this.setLength(1.0);
    } else {
      this.divide(d);
    }
    return this;
  }

  unit() {
    return this.clone().normalize();
  }

  clone() {
    return new Vector(this.x, this.y);
  }
}
