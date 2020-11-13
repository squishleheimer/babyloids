import { SteeringBehaviour, BehaviourType } from './steering';
import Arrive, { Deceleration } from './arrive';
import Seek from './seek';
import Vector from '../math/vector';
import Agent from '../agent';
import Entity from './entity';

export enum PursuitMethod {
  Arrive,
  Seek
}

export default class Pursuit extends SteeringBehaviour {

  constructor(
    private owner: Agent,
    // tslint:disable-next-line: variable-name
    private _other: Entity,
    public method = PursuitMethod.Arrive) {
    super(3, 1.0, 1.0);
  }

  static calculateForce(
    a: Agent,
    evader: Entity,
    method: PursuitMethod): Vector {

    const to = evader.position.sub(a.position);
    const relativeHeading: number = a.heading.dot(evader.heading);

    // if the evader is ahead and facing the agent then we can just seek
    // for the evader's current position.
    if (to.dot(a.heading) > 0 && relativeHeading < -0.95) { // acos(0.95)=18 degs
      return Seek.calculateForce(a, evader.position);
    }

    // Not considered ahead so we predict where the evader will be.
    // the lookahead time is proportional to the distance between the evader
    // and the pursuer; and is inversely proportional to the sum of the
    // agent's velocities
    const lookAheadTime: number =
      to.length / (a.maxSpeed + evader.speed) +
      SteeringBehaviour.turnAroundTime(a, evader.position);

    const position = evader.position.add(
      evader.velocity.mult(lookAheadTime));

    // now seek to the predicted future position of the evader
    // NB arrive with slow delec produces better results IMO
    switch (method) {
      case PursuitMethod.Arrive:
        return Arrive.calculateForce(a, position, Deceleration.Slow);
      case PursuitMethod.Seek:
        return Seek.calculateForce(a, position);
      default:
        throw new Error(`Pursuit - invalid method: ${method}`);
    }
  }

  get behaviourType(): BehaviourType { return BehaviourType.Pursuit; }

  force(): Vector {
    if (this._other && this.other !== this.owner) {
      return Pursuit.calculateForce(
        this.owner,
        this._other,
        this.method);
    }
    return Vector.ZERO;
  }

  get other() { return this._other; }
  setOther(other: Entity): void { this._other = other; }
}
