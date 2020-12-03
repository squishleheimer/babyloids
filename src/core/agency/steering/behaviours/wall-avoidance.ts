import { SteeringBehaviour, BehaviourType } from './../steering';
import Agent from '../../agent';
import Vector from '../../math/vector';
import { vecRotateAroundOrigin, lineIntersection2D } from '../../math/geometry';
import Wall from './../wall';

export default class WallAvoidance extends SteeringBehaviour {
  owner: Agent;
  feelers: Array<Vector> = [];

  detectionFeelerLength: number;

  intersection: Vector = Vector.ZERO;

  constructor(owner: Agent) {
    super(1, 10.0, 1.0);

    this.owner = owner;
    this.detectionFeelerLength = this.owner.radius;

    for (let index = 0; index < 3; ++index) {
      this.feelers.push(Vector.ZERO);
    }

    this.reset();
  }

  reset(): void {
    this.detectionFeelerLength = this.owner.radius;
    this.feelers.forEach(f => {
      f.set(this.owner.position.add(this.owner.heading));
    });
  }

  get behaviourType(): BehaviourType {
    return BehaviourType.WallAvoidance;
  }

  force(): Vector {
    return this.calculateForce(this.owner.face.walls);
  }

  private calculateForce(walls: Wall[]): Vector {

    const factor = 1.0;

    this.detectionFeelerLength =
      this.owner.maxSpeed * factor * 0.5;

    this.updateFeelers();

    let distToClosestIP: number = Number.MAX_VALUE;
    let closestWall = -1;
    let steeringForce: Vector = Vector.ZERO;
    let closestPoint: Vector = Vector.ZERO;  // holds the closest intersection point

    // examine each feeler in turn
    this.feelers.forEach(f => {
      // run through each wall checking for any intersection points
      walls.forEach((w, i) => {
        const intersection = {
          distance: 0,
          point: Vector.ZERO
        };
        if (lineIntersection2D(
          this.owner.position.clone(),
          f.clone(),
          w.from(),
          w.to(),
          intersection)) {
          // is this the closest found so far? If so keep a record
          if (intersection.distance < distToClosestIP) {
            distToClosestIP = intersection.distance;
            closestWall = i;
            closestPoint = intersection.point;
          }
        }
      });

      // if an intersection point has been detected, calculate a force
      // that will direct the agent away
      if (closestWall >= 0) {
        // calculate by what distance the projected position of the agent
        // will overshoot the wall
        const overshoot: Vector = f.sub(closestPoint);

        // this.intersection = closestPoint.copy();
        this.intersection.x = closestPoint.x;
        this.intersection.y = closestPoint.y;

        // create a force in the direction of the wall normal, with a
        // magnitude of the overshoot
        steeringForce = walls[closestWall].normal().mult(overshoot.length);
      }
    });

    return steeringForce;
  }

  updateFeelers(): void {
    const radius: number = this.owner.radius;
    const heading: Vector = this.owner.heading.clone();
    const pos: Vector = this.owner.position.clone();

    const speedFactor: number =
      this.owner.velocity.length * 0.04;

    this.detectionFeelerLength =
      this.detectionFeelerLength < radius ?
        radius : (radius * speedFactor);

    // feeler pointing straight in front
    this.feelers[0] = pos.add(
      heading.mult(this.detectionFeelerLength * 1.5));
    this.feelers[1] = pos.add( // feeler to left
      vecRotateAroundOrigin(heading, Math.PI / -8.0).mult(
        this.detectionFeelerLength));
    this.feelers[2] = pos.add( // feeler to right
      vecRotateAroundOrigin(heading, Math.PI / 8.0).mult(
        this.detectionFeelerLength));
  }
}
