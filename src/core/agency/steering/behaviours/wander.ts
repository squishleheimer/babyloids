import Vector from '../../math/vector';
import Agent from '../../agent';
import { SteeringBehaviour, BehaviourType } from './../steering';
import { randomPointOnCircumference, pointToWorldSpace } from '../../math/geometry';
import { rand } from '../../math/random';

export default class Wander extends SteeringBehaviour {
  owner: Agent;

  wanderJitter: number;
  wanderRadius: number;
  wanderDistance: number;
  wanderTarget: Vector;

  constructor(owner: Agent) {
    super(5, 1.0, 0.3);

    this.owner = owner;

    const radius: number = this.owner.radius;

    this.wanderJitter = 150.0;
    this.wanderRadius = radius * 2.0;
    this.wanderDistance = radius + this.wanderRadius;

    // create a vector to a target
    // position on the wander circle
    this.wanderTarget =
      randomPointOnCircumference(this.wanderRadius);
  }

  get behaviourType(): BehaviourType { return BehaviourType.Wander; }

  force(): Vector {
    return this.calculateForce();
  }

  private calculateForce(): Vector {

    if (this.owner) {
      // this behavior is dependent on the update rate, so this line must
      // be included when using time independent frame-rate.
      const jitterThisTimeSlice: number =
        this.wanderJitter * this.owner.sliceInSeconds;

      // first, add a small random vector to the target's position
      this.wanderTarget.addTo(
          new Vector(
            rand() * jitterThisTimeSlice,
            rand() * jitterThisTimeSlice));

      // re-project this new vector back on to a unit circle
      this.wanderTarget = this.wanderTarget.unit().mult(this.wanderRadius);

      // increase the length of the vector to the
      // same as the radius of the wander circle
      const target =
        this.owner.position.add(this.wanderTarget);

      return target.sub(this.owner.position);
    }

    return Vector.ZERO;
  }
}
