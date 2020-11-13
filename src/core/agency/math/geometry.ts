import Vector from './vector';
import { clamp } from './random';
import { Matrix } from './matrix';

// -------------------- LineIntersection2D-------------------------
//
// 	Given 2 lines in 2D space AB, CD this returns true if an
// 	intersection occurs and sets dist to the distance the intersection
//  occurs along AB. Also sets the 2d vector point to the point of
//  intersection
// -----------------------------------------------------------------
export function lineIntersection2D(
  A: Vector,
  B: Vector,
  C: Vector,
  D: Vector,
  intersection: {
    distance: number,
    point: Vector
  }): boolean {

  const rTop: number = (A.y - C.y) * (D.x - C.x) - (A.x - C.x) * (D.y - C.y);
  const rBot: number = (B.x - A.x) * (D.y - C.y) - (B.y - A.y) * (D.x - C.x);

  const sTop: number = (A.y - C.y) * (B.x - A.x) - (A.x - C.x) * (B.y - A.y);
  const sBot: number = (B.x - A.x) * (D.y - C.y) - (B.y - A.y) * (D.x - C.x);

  if (rBot === 0 || sBot === 0) {
    // lines are parallel
    return false;
  }

  const r: number = rTop / rBot;
  const s: number = sTop / sBot;

  if ((r > 0) && (r < 1) && (s > 0) && (s < 1)) {
    const AB: Vector = B.sub(A);
    intersection.distance = AB.length * r;
    intersection.point = A.add(AB.mult(r));
    return true;
  } else {
    intersection.distance = 0;
    return false;
  }
}

// ----------------------------- twoCirclesOverlapped ---------------------
//
// Returns true if the two circles overlap
// ------------------------------------------------------------------------
export function twoCirclesOverlapped(
  c1: Vector, r1: number,
  c2: Vector, r2: number): boolean {
  return (r1 + r2) * (r1 + r2) > ((c1.x - c2.x) * (c1.x - c2.x) + (c1.y - c2.y) * (c1.y - c2.y));
}

// ----------------------------- getClosestPoint --------------------------
//
// Returns the point along the line AB that is closest to point P.
// segmentClamp - set to true if result is restricted to non-infinite AB;
// to false to indicate otherwise.
// ------------------------------------------------------------------------
export function getClosestPoint(
  A: Vector,
  B: Vector,
  P: Vector,
  segmentClamp: boolean = true): Vector {

  const AP: Vector = P.sub(A);
  const AB: Vector = B.sub(A);
  const ab2: number = AB.x * AB.x + AB.y * AB.y;
  // tslint:disable-next-line:variable-name
  const ap_ab: number = AP.x * AB.x + AP.y * AB.y;

  let t: number = ap_ab / ab2;

  if (segmentClamp) {
    t = clamp(t);
  }

  return A.add(AB.mult(t));
}

export function randomPointOnCircumference(radius: number) {
  const theta: number = Math.random() * 2.0 * Math.PI;
  return new Vector(
    radius * Math.cos(theta),
    radius * Math.sin(theta));
}

// -------------------------- Vec2DRotateAroundOrigin --------------------------
//
//  rotates a vector ang rads around the origin
// -----------------------------------------------------------------------------
export function vecRotateAroundOrigin(v: Vector, ang: number): Vector {
  // create a transformation matrix
  const mat: Matrix = new Matrix();
  // rotate
  mat.rotate(ang);
  // now transform the vector
  return mat.transformVector(v);
}

// --------------------- pointToWorldSpace --------------------------------
//
//  Transforms a point from the agent's local space into world space
// ------------------------------------------------------------------------
export function pointToWorldSpace(
  point: Vector,
  heading: Vector,
  side: Vector,
  position: Vector): Vector {
  // create a transformation matrix
  const m: Matrix = new Matrix();
  m.rotateFrom(heading, side);
  m.translate(position.x, position.y);
  // now transform the vertices
  return m.transformVector(point.clone());
}

// --------------------- VectorToWorldSpace --------------------------------
//
//  Transforms a vector from the agent's local space into world space
// ------------------------------------------------------------------------
export function vectorToWorldSpace(
  vec: Vector,
  agentHeading: Vector,
  agentSide: Vector): Vector {

  // create a transformation matrix
  const matTransform: Matrix = new Matrix();

  // rotate
  matTransform.rotateFrom(agentHeading, agentSide);

  // now transform the vertices
  return matTransform.transformVector(vec.clone());
}


// --------------------- PointToLocalSpace --------------------------------
//
// ------------------------------------------------------------------------
export function pointToLocalSpace(
  point: Vector,
  agentHeading: Vector,
  agentSide: Vector,
  agentPosition: Vector): Vector {

  // create a transformation matrix
  const matTransform: Matrix = new Matrix();

  const Tx = -agentPosition.dot(agentHeading);
  const Ty = -agentPosition.dot(agentSide);

  // create the transformation matrix
  matTransform._11 = agentHeading.x; matTransform._12 = agentSide.x;
  matTransform._21 = agentHeading.y; matTransform._22 = agentSide.y;
  matTransform._31 = Tx; matTransform._32 = Ty;

  // now transform the vertices
  return matTransform.transformVector(point.clone());
}

// --------------------- VectorToLocalSpace --------------------------------
//
// ------------------------------------------------------------------------
export function vectorToLocalSpace(
  vec: Vector,
  AgentHeading: Vector,
  AgentSide: Vector): Vector {

  // create a transformation matrix
  const matTransform: Matrix = new Matrix();

  // create the transformation matrix
  matTransform._11 = AgentHeading.x; matTransform._12 = AgentSide.x;
  matTransform._21 = AgentHeading.y; matTransform._22 = AgentSide.y;

  // now transform the vertices
  return matTransform.transformVector(vec.clone());
}

// Apex of triangle points east. Empty xRatio param results in equilateral triangle.
export function isoscelesInscribedInCircle(
  radius: number,
  xRatio: number = Math.abs(radius * Math.cos(Math.PI / 3)) / radius): Vector[] {

  xRatio = clamp(xRatio, 0, 1 - Number.EPSILON);

  const x = xRatio * radius;
  const h = x + radius;
  const b = Math.sqrt(2 * h * radius - (h * h));

  return [
    new Vector(radius, 0),
    new Vector(-x,  b),
    new Vector(-x, -b)
  ];
}

export function createCircleVertices(
  radius: number,
  centre: Vector,
  interval: number = Math.PI / 18): Vector[] {
  const points = [];
  interval = clamp(interval, Math.PI / 180, Math.PI / 3);
  for (let i = 0; i < 2 * Math.PI; i += interval) {
    points.push(new Vector(
      radius * Math.sin(i),
      radius * Math.cos(i)).add(centre));
  }
  return points;
}
