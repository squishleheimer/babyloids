import Vector from './vector';

export class Matrix {
  _11: number; _12: number; _13: number;
  _21: number; _22: number; _23: number;
  _31: number; _32: number; _33: number;

  constructor() {
    this.identity();
  }

  matrixMultiply(mIn: Matrix): void {
    // first row
    this._11 = (this._11 * mIn._11) + (this._12 * mIn._21) + (this._13 * mIn._31);
    this._12 = (this._11 * mIn._12) + (this._12 * mIn._22) + (this._13 * mIn._32);
    this._13 = (this._11 * mIn._13) + (this._12 * mIn._23) + (this._13 * mIn._33);

    // second
    this._21 = (this._21 * mIn._11) + (this._22 * mIn._21) + (this._23 * mIn._31);
    this._22 = (this._21 * mIn._12) + (this._22 * mIn._22) + (this._23 * mIn._32);
    this._23 = (this._21 * mIn._13) + (this._22 * mIn._23) + (this._23 * mIn._33);

    // third
    this._31 = (this._31 * mIn._11) + (this._32 * mIn._21) + (this._33 * mIn._31);
    this._32 = (this._31 * mIn._12) + (this._32 * mIn._22) + (this._33 * mIn._32);
    this._33 = (this._31 * mIn._13) + (this._32 * mIn._23) + (this._33 * mIn._33);
  }

  // create an identity matrix
  identity(): void {
    this._11 = 1; this._12 = 0; this._13 = 0;
    this._21 = 0; this._22 = 1; this._23 = 0;
    this._31 = 0; this._32 = 0; this._33 = 1;
  }

  zero(): void {
    this._11 = 0.0; this._12 = 0.0; this._13 = 0.0;
    this._21 = 0.0; this._22 = 0.0; this._23 = 0.0;
    this._31 = 0.0; this._32 = 0.0; this._33 = 0.0;
  }

  // create a transformation matrix
  translate(x: number, y: number): void {
    const mat: Matrix = new Matrix();
    mat._11 = 1; mat._12 = 0; mat._13 = 0;
    mat._21 = 0; mat._22 = 1; mat._23 = 0;
    mat._31 = x; mat._32 = y; mat._33 = 1;
    // and multiply
    this.matrixMultiply(mat);
  }

  // create a scale matrix
  scale(xScale: number, yScale: number): void {
    const mat: Matrix = new Matrix();
    mat._11 = xScale; mat._12 = 0; mat._13 = 0;
    mat._21 = 0; mat._22 = yScale; mat._23 = 0;
    mat._31 = 0; mat._32 = 0; mat._33 = 1;
    // and multiply
    this.matrixMultiply(mat);
  }

  // create a rotation matrix
  rotate(rot: number): void {
    const mat: Matrix = new Matrix();
    const sin: number = Math.sin(rot);
    const cos: number = Math.cos(rot);
    mat._11 = cos; mat._12 = sin; mat._13 = 0;
    mat._21 = -sin; mat._22 = cos; mat._23 = 0;
    mat._31 = 0; mat._32 = 0; mat._33 = 1;
    // and multiply
    this.matrixMultiply(mat);
  }

  // create a rotation matrix from a 2D vector
  rotateFrom(fwd: Vector, side: Vector): void {
    const mat: Matrix = new Matrix();
    mat._11 = fwd.x; mat._12 = fwd.y; mat._13 = 0;
    mat._21 = side.x; mat._22 = side.y; mat._23 = 0;
    mat._31 = 0; mat._32 = 0; mat._33 = 1;
    // and multiply
    this.matrixMultiply(mat);
  }

  // applies a 2D transformation matrix to a std::vector of Vector2Ds
  transformVectors(points: Array<Vector>): Array<Vector> {
    return points.map(v => {
      return this.transformVector(v);
    });
  }

  // applies a 2D transformation matrix to a single Vector2
  transformVector(v: Vector): Vector {
    return new Vector(
      (this._11 * v.x) + (this._21 * v.y) + (this._31),
      (this._12 * v.x) + (this._22 * v.y) + (this._32)
    );
  }
}
