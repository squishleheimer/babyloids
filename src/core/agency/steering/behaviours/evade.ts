import { SteeringBehaviour, BehaviourType } from './../steering';
import Vector from '../../math/vector';
import Agent from '../../agent';
import Entity from './../entity';
import Flee from './flee';

export default class Evade extends SteeringBehaviour {

  constructor(
    private owner: Agent,
    // tslint:disable-next-line: variable-name
    private _other: Entity) {
    super(3, 1.0, 1.0);
  }

  static calculateForce(
    a: Agent,
    pursuer: Entity): Vector {

      const to = pursuer.position.sub(a.position);

      // uncomment the following two lines to have Evade only consider pursuers
      // within a 'threat range'
      const threatRange = a.radius * 50.0;
      if (to.getLengthSq() > threatRange * threatRange) {
        return Vector.ZERO;
      }

      // the lookahead time is proportional to the distance between the pursuer
      // and the pursuer; and is inversely proportional to the sum of the
      // agents' velocities
      const lookAheadTime = to.length /	(a.maxSpeed + pursuer.speed);

      // now seek to the predicted future position of the evader
      // NB arrive with slow delec produces better results IMO
      return Flee.calculateForce(a,
        pursuer.position.add(
          pursuer.velocity.mult(lookAheadTime)));
  }

  get behaviourType(): BehaviourType { return BehaviourType.Evade; }

  force(): Vector {
    if (this._other) {
      return Evade.calculateForce(
        this.owner,
        this._other);
    }
    return Vector.ZERO;
  }

  get other() { return this._other; }
  setOther(other: Entity): void { this._other = other; }
}
