import Vector from '../math/vector';
import { clamp } from '../math/random';
import { getClosestPoint } from '../math/geometry';

export default class Path {

  // tslint:disable-next-line: variable-name
  private _position = 0;
  // tslint:disable-next-line: variable-name
  private _greatestDeviation = null;

  public get greatestDeviation(): number {
    // if (this._greatestDeviation === null) {
    //   this._greatestDeviation =
    //     this.calculateGreatestDeviationFromStartToFinishLine(
    //       this._position
    //     );
    // }
    return this._greatestDeviation || 0;
  }

  constructor(
    // tslint:disable-next-line: variable-name
    private _points = new Array<Vector>(),
    public looped = false
  ) {
  }

  static createRandomPath(
    pointCount: number,
    rect: Vector): Vector[] {
    const points = [];
    for (let i = 0; i < pointCount; ++i) {
      points.push(Vector.randInRect(rect));
    }
    return points;
  }

  public add(p: Vector): void {
    this._points.push(p);
    this._position = 0;
    this._greatestDeviation = null;
  }

  public clear(): void {
    this._points = [];
    this._position = 0;
    this._greatestDeviation = null;
  }

  public get points(): Vector[] {
    return this._points;
  }

  public get finished(): boolean {
    return this._position === this._points.length - 1;
  }

  public get current(): Vector {
    return this._points[this._position];
  }

  public progress(): void {
    this._position = clamp(
      this._position + 1,
      0,
      this._points.length - 1,
      this.looped);
    this._greatestDeviation =
      this.calculateGreatestDeviationFromStartToFinishLine();
  }

  public calculateGreatestDeviationFromStartToFinishLine(
    lookAhead: number = 4): number {

    if (this.points.length > 2) {
      // tslint:disable-next-line: max-line-length
      const points = this.points.filter((_, i) =>
        i >= Math.max(0, this._position - 1) &&
        i <= Math.min(this._position + lookAhead, this.points.length - 1));

      const { 0 : A, [points.length - 1] : B } = points;

      let dSqMax = 0;

      points.forEach(p => {
        const cp = getClosestPoint(A, B, p);
        const dSq = p.sub(cp).getLengthSq();
        if (dSq > dSqMax) {
          dSqMax = dSq;
        }
      });

      return Math.sqrt(dSqMax);
    }

    return 0;
  }
}
