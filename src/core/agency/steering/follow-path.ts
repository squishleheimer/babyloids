import { SteeringBehaviour, BehaviourType } from './steering';
import Vector from '../math/vector';
import Agent from '../agent';
import Path from './path';
import Seek from './seek';
import Arrive, { Deceleration } from './arrive';

export default class FollowPath extends SteeringBehaviour {

  constructor(
    public owner: Agent,
    // tslint:disable-next-line: variable-name
    private _seekDistance: number
    ) {
    super(5, 1.0, 1.0);
  }

  get behaviourType(): BehaviourType {
    return BehaviourType.FollowPath;
  }

  get seekDistance(): number {
    return Math.max(
      this.owner.steering.path.greatestDeviation,
      this._seekDistance
    );
  }

  static calculateForce(
    a: Agent,
    path: Path,
    seekDistance: number,
    out: { done: boolean } = { done: false }): Vector {

    // move to next target if close enough to current target
    // (working in distance squared space).
    if (path.current.sub(a.position).getLengthSq() < seekDistance ** 2) {
      path.progress();
    }

    if ((!path.finished || path.looped) && !out.done) {
      return Seek.calculateForce(a, path.current);
    } else {
      if (!out.done && Arrive.isAtTarget(a, path.current, a.radius)) {
        out.done = true;
      }
      if (!out.done) {
        return Arrive.calculateForce(a, path.current, Deceleration.Slow);
      }
    }

    return Vector.ZERO;
  }

  force(): Vector {
    const out = { done: false };
    if (
      !out.done &&
      this.owner &&
      this.owner.steering.path &&
      this.owner.steering.path.points.length > 0) {
      const force = FollowPath.calculateForce(
        this.owner,
        this.owner.steering.path,
        this.seekDistance,
        out);
      if (out.done) {
        this.owner.velocity.set(Vector.ZERO);
      }
      return force;
    }
    return Vector.ZERO;
  }
}
