import Vector from '../math/vector';
import { createCircleVertices } from '../math/geometry';

export default class Wall {
  A: Vector;
  B: Vector;
  N: Vector;

  constructor(
    A: Vector,
    B: Vector) {
    this.set(A, B);
  }

  set(
    A: Vector,
    B: Vector): void {
    this.A = A;
    this.B = B;
    this.calculateNormal();
  }

  from(): Vector { return this.A.clone(); }
  setFrom(v: Vector): void {
    this.A = v;
    this.calculateNormal();
  }

  to(): Vector { return this.B.clone(); }
  setTo(v: Vector): void {
    this.B = v;
    this.calculateNormal();
  }

  normal(): Vector {
    return this.N.clone();
  }

  centre(): Vector {
    return this.A.add(this.B).div(2.0);
  }

  calculateNormal(): void {
    this.N = this.B.sub(this.A).unit().perp();
  }
}

export function createInwardcircularWall(
  radius: number,
  centre: Vector) {
  return createCircleVertices(
    radius,
    centre)
      .reverse()
      .map((p, i, arr) => {
        const q = i < arr.length - 1 ? arr[i + 1] : arr[0];
        return new Wall(p, q);
  });
}

export function createInwardRectWalls(rect: Vector, offset: Vector): Wall[] {
  const halfRect = rect.mult(0.5);
  return [
    new Wall(offset.clone(), new Vector(rect.x, offset.y)),
    new Wall(new Vector(rect.x, offset.y), rect.clone()),
    new Wall(rect.clone(), new Vector(offset.x, rect.y)),
    new Wall(new Vector(offset.x, rect.y), offset.clone())
  ];
}
