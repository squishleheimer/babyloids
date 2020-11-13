import { SteeringBehaviour, BehaviourType } from './steering';
import Vector from '../math/vector';
import Agent from '../agent';
import Entity from './entity';
import Arrive, { Deceleration } from './arrive';
import Evade from './evade';

export default class Hide extends SteeringBehaviour {

  constructor(
    private owner: Agent,
    // tslint:disable-next-line: variable-name
    private _other: Entity) {
    super(3, 1.0, 1.0);
  }

  private static getHidingPosition(
    a: Agent,
    posOb: Vector,
    radiusOb: number,
    posHunter: Vector): Vector {

      // calculate how far away the agent is to be from the chosen obstacle's
      // bounding radius
      const distanceFromBoundary = 3 * Math.min(a.radius, radiusOb);
      const distAway = radiusOb + distanceFromBoundary;

      // calculate the heading toward the object from the hunter
      const toOb: Vector = posOb.sub(posHunter).unit();

      // scale it to size and add to the obstacles position to get
      // the hiding spot.
      return toOb.mult(distAway).add(posOb);
  }

  static calculateForce(
    a: Agent,
    hunter: Entity,
    ...obstacles: Entity[]): Vector {

      let distToClosest = Number.MAX_VALUE;
      let bestHidingSpot: Vector;

      obstacles.forEach(o => {
        // calculate the position of the hiding spot for this obstacle
        const hidingSpot = Hide.getHidingPosition(a, o.position, o.radius, hunter.position);

        // work in distance-squared space to find the closest hiding
        // spot to the agent
        const dist = a.position.sub(hidingSpot).getLengthSq();

        if (dist < distToClosest) {
          distToClosest = dist;
          bestHidingSpot = hidingSpot;
        }
      });

      // if no suitable obstacles found then Evade the hunter
      if (distToClosest === Number.MAX_VALUE) {
        return Evade.calculateForce(a, hunter);
      }

      return Arrive.calculateForce(a, bestHidingSpot, Deceleration.Fast);
  }

  get behaviourType(): BehaviourType { return BehaviourType.Hide; }

  force(): Vector {
    if (this._other) {
      return Hide.calculateForce(
        this.owner,
        this._other,
        ...this.owner.face.obstacles);
    }
    return Vector.ZERO;
  }

  get other() { return this._other; }
  setOther(other: Entity): void { this._other = other; }
}
