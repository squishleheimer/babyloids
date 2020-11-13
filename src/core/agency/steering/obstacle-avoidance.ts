import { SteeringBehaviour, BehaviourType } from './steering';
import Agent from '../agent';
import Vector from '../math/vector';
import { pointToLocalSpace, vectorToWorldSpace } from '../math/geometry';
import Entity from './entity';

export default class ObstacleAvoidance extends SteeringBehaviour {
  owner: Agent;

  detectionBoxLength: number;
  minDetectionBoxLength: number;

  intersection: Vector = Vector.ZERO;

  constructor(owner: Agent) {
    super(1, 10.0, 1.0);

    this.owner = owner;

    this.reset();
  }

  reset(): void {
    this.minDetectionBoxLength = this.owner.radius * 6.0;
    this.detectionBoxLength = this.minDetectionBoxLength;
  }

  get behaviourType(): BehaviourType {
    return BehaviourType.ObstacleAvoidance;
  }

  force(): Vector {
    return this.calculateForce(this.owner.face.obstacles);
  }

  private calculateForce(obstacles: Entity[]): Vector {

    const speed = this.owner.velocity.length;

    this.detectionBoxLength =
      this.minDetectionBoxLength +
      this.minDetectionBoxLength *
      (speed / this.owner.maxSpeed);

    this.owner.face.tagObstaclesWithinViewRange(
      this.owner,
      this.detectionBoxLength);

    let closestIntersectingOb: Entity;

    let distToCIB = Number.MAX_VALUE;

    let localPosOfClosest: Vector = Vector.ZERO;

    obstacles.forEach((o) => {
      if (o.isTagged()) {

        const localPos = pointToLocalSpace(
          o.position,
          this.owner.heading,
          this.owner.side,
          this.owner.position
        );

        if (localPos.x >= 0) {
          const expandedRadius = o.radius + this.owner.radius;

          if (Math.abs(localPos.y) < expandedRadius) {
            const cX = localPos.x;
            const cY = localPos.y;
            const sqrtPart = Math.sqrt(expandedRadius * expandedRadius - cX * cY);
            let ip = cX - sqrtPart;
            if (ip <= 0.0) {
              ip = cX + sqrtPart;
            }
            if (ip < distToCIB) {
              distToCIB = ip;
              closestIntersectingOb = o;
              localPosOfClosest = localPos.clone();
            }
          }
        }
      }
    });

    const steeringForce: Vector = Vector.ZERO;

    if (closestIntersectingOb) {

      const multiplier = 1.0 + (this.detectionBoxLength - localPosOfClosest.x) / this.detectionBoxLength;

      steeringForce.y = (closestIntersectingOb.radius - localPosOfClosest.y) * multiplier;

      const brakingWeight = 0.2;

      steeringForce.x = (closestIntersectingOb.radius - localPosOfClosest.x) * brakingWeight;
    }

    return vectorToWorldSpace(
      steeringForce,
      this.owner.heading,
      this.owner.side);
  }
}
