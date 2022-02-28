import { SteeringBehaviour, BehaviourType } from './../steering';
import Vector from '../../math/vector';
import Agent from '../../agent';

export default class Seek extends SteeringBehaviour {

  constructor(owner: Agent, target: Vector) {
    super(8, 1.0, 1.0);

    this.owner = owner;
    this.target = target;
  }
  owner: Agent;
  target: Vector = Vector.ZERO;

  static calculateForce(
    owner: Agent,
    target: Vector): Vector {
      const temp: Vector = target.sub(owner.position);
      const desiredVelocity: Vector = temp.unit().mult(owner.maxSpeed);
      return desiredVelocity.sub(owner.velocity);
  }

  get behaviourType(): BehaviourType { return BehaviourType.Seek; }

  force(): Vector {
    if (this.owner && this.target) {
      return Seek.calculateForce(this.owner, this.target);
    }
    return Vector.ZERO;
  }
}
