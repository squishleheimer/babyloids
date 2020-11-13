import { SteeringBehaviour, BehaviourType } from './steering';
import Arrive, { Deceleration } from './arrive';
import Vector from '../math/vector';
import Agent from '../agent';
import Entity from './entity';
import { pointToWorldSpace } from '../math/geometry';

export default class OffsetPursuit extends SteeringBehaviour {

  constructor(
    private owner: Agent,
    // tslint:disable-next-line: variable-name
    private _other: Entity,
    // tslint:disable-next-line: variable-name
    private _offset: Vector = Vector.ZERO) {
    super(3, 1.0, 1.0);
  }

  static calculateForce(
    a: Agent,
    evader: Entity,
    offset: Vector): Vector {

    // calculate the offset's position in world space
    const worldOffsetPos = pointToWorldSpace(
      offset,
      evader.heading,
      evader.side,
      evader.position);

    const to = worldOffsetPos.sub(a.position);

    // the lookahead time is propotional to the distance between the leader
    // and the pursuer; and is inversely proportional to the sum of both
    // agent's velocities
    const lookAheadTime = to.length / (a.maxSpeed + evader.speed);

    // now Arrive at the predicted future position of the offset
    return Arrive.calculateForce(a,
      worldOffsetPos.add(evader.velocity.mult(lookAheadTime)),
      Deceleration.Slow);
  }

  get behaviourType(): BehaviourType { return BehaviourType.OffsetPursuit; }

  force(): Vector {
    if (this._other && this.other !== this.owner) {
      return OffsetPursuit.calculateForce(
        this.owner,
        this._other,
        this._offset);
    }
    return Vector.ZERO;
  }

  get other(): Entity { return this._other; }
  setOther(other: Entity): void { this._other = other; }

  get offset(): Vector { return this._offset; }
  setOffset(offset: Vector): void { this._offset = offset; }
}
