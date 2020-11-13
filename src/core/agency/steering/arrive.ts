import { SteeringBehaviour, BehaviourType } from './steering';
import Vector from '../math/vector';
import Agent from '../agent';

export enum Deceleration {
  Slow = 1,
  Normal = 2,
  Fast = 3
}

export default class Arrive extends SteeringBehaviour {

  constructor(
    private owner: Agent,
    // tslint:disable-next-line: variable-name
    private _target: Vector,
    private deceleration: Deceleration = Deceleration.Fast) {
    super(3, 1.0, 1.0);
  }

  get behaviourType(): BehaviourType { return BehaviourType.Arrive; }

  get target(): Vector { return this._target; }

  static calculateForce(
    a: Agent,
    target: Vector,
    deceleration: Deceleration): Vector {
    // calculate the distance to the target
    const to = target.sub(a.position);
    const d: number = to.length;

    if (d > 0) {
      // because Deceleration is enumerated as an int, this value is required
      // to provide fine tweaking of the deceleration..
      const decelerationTweaker = 0.3;

      // calculate the speed required to reach the target given the desired
      // deceleration.
      // make sure the velocity does not exceed the max.
      const speed = Math.min(
        d / (deceleration as number * decelerationTweaker),
        a.maxSpeed);

      // from here proceed just like Seek except we don't need to normalize
      // the _to_ vector because we have already gone to the trouble
      // of calculating its length: _d_.
      return to.mult(speed / d).sub(a.velocity);
    }

    return Vector.ZERO;
  }

  static isAtTarget(
    a: Agent,
    target: Vector,
    offset: number = Number.EPSILON): boolean {
    const r: number = a.radius + offset;
    if (r ** 2 > target.sub(a.position).getLengthSq()) {
      return true;
    }
    return false;
  }

  force(): Vector {
    if (this.target) {
      return Arrive.calculateForce(
        this.owner,
        this.target,
        this.deceleration);
    }
    return Vector.ZERO;
  }

  setDeceleration(deceleration: Deceleration): void {
    this.deceleration = deceleration;
  }

  setTarget(target: Vector): void {
    this._target = target.clone();
  }
}
