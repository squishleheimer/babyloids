import { SteeringBehaviour, BehaviourType } from './../steering';
import Vector from '../../math/vector';
import Agent from '../../agent';

export default class Flee extends SteeringBehaviour {

  constructor(owner: Agent, target: Vector) {
    super(4, 1.0, 1.0);

    this.owner = owner;
    this.target = target;
  }
  owner: Agent;
  target: Vector;

  static calculateForce(owner: Agent, target: Vector): Vector {
    const temp: Vector = owner.position.sub(target);
    const desiredVelocity: Vector = temp.unit().mult(owner.maxSpeed);
    return desiredVelocity.sub(owner.velocity);
  }

  get behaviourType(): BehaviourType { return BehaviourType.Flee; }

  force(): Vector {
    if (this.owner && this.target) {
      return Flee.calculateForce(this.owner, this.target);
    }
    return Vector.ZERO;
  }
}
