import { SteeringBehaviour, BehaviourType } from './steering';
import Arrive, { Deceleration } from './arrive';
import Vector from '../math/vector';
import Agent from '../agent';
import Entity from './entity';
import { pointToWorldSpace } from '../math/geometry';

export default class Interpose extends SteeringBehaviour {

  constructor(
    private owner: Agent,
    // tslint:disable-next-line: variable-name
    private _otherA: Entity,
    // tslint:disable-next-line: variable-name
    private _otherB: Entity) {
    super(3, 1.0, 1.0);
  }

  static calculateForce(
    a: Agent,
    otherA: Entity,
    otherB: Entity): Vector {

    // first we need to figure out where the two agents are going to be at
    // time T in the future. This is approximated by determining the time
    // taken to reach the mid way point at the current time at at max speed.
    let midPoint = otherA.position.add(otherB.position).div(2.0);

    const timeToReachMidPoint = (midPoint.sub(a.position)).length / a.maxSpeed;

    // now we have T, we assume that agent A and agent B will continue on a
    // straight trajectory and extrapolate to get their future positions
    const aPos = otherA.position.add(otherA.velocity.mult(timeToReachMidPoint));
    const bPos = otherB.position.add(otherB.velocity.mult(timeToReachMidPoint));

    // calculate the mid point of these predicted positions
    midPoint = aPos.add(bPos).div(2.0);

    // then steer to Arrive at it
    return Arrive.calculateForce(a, midPoint, Deceleration.Fast);
  }

  get behaviourType(): BehaviourType { return BehaviourType.Interpose; }

  force(): Vector {
    if (this._otherA && this._otherB) {
      return Interpose.calculateForce(
        this.owner,
        this._otherA,
        this._otherB);
    }
    return Vector.ZERO;
  }

  get otherA(): Entity { return this._otherA; }
  setOtherA(other: Entity): void { this._otherA = other; }

  get otherB(): Entity { return this._otherB; }
  setOtherB(other: Entity): void { this._otherB = other; }
}
