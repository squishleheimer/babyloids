import { SteeringBehaviour, BehaviourType } from './steering';
import Vector from '../math/vector';
import Agent from '../agent';
import Seek from './seek';

export default class Cohesion extends SteeringBehaviour {
  owner: Agent;

  constructor(owner: Agent) {
    super(4, 2.0, 0.2);

    this.owner = owner;
  }

  get behaviourType(): BehaviourType { return BehaviourType.Cohesion; }

  force(): Vector {
    if (this.owner.steering.cellSpaceEnabled) {
      const idx = this.owner.face.csp.neighbours.indexOf(undefined, 0);
      return this.calculateForce(
        this.owner.face.csp.neighbours.slice(0, idx));
    }
    return this.calculateForce(this.owner.face.facets);
  }

  private calculateForce(neighbours: Array<Agent>): Vector {

    if (this.owner && neighbours.length > 0) {

      // first find the center of mass of all the agents
      let steeringForce: Vector = Vector.ZERO;
      let centreOfMass: Vector = Vector.ZERO;

      let neighbourCount = 0;

      // iterate through the neighbors and sum up all the position vectors
      for (const n of neighbours) {
        // make sure this agent isn't included in the calculations and that
        // the agent being examined is close enough.
        // TODO: *** also make sure it doesn't include the evade target ***
        if (n !== this.owner && n.enabled &&
          (this.owner.steering.cellSpaceEnabled || n.isTagged())) {
          centreOfMass = centreOfMass.add(n.position);
          ++neighbourCount;
        }
      }

      if (neighbourCount > 0) {
        // the center of mass is the average of the sum of positions
        centreOfMass = centreOfMass.div(neighbourCount);
        // now seek towards that position
        steeringForce = Seek.calculateForce(this.owner, centreOfMass);
      }

      // the magnitude of cohesion is usually much larger than separation or
      // alignment so it usually helps to normalize it.
      if (steeringForce.getLengthSq() > 0) {
        return steeringForce.unit();
      }
    }

    return Vector.ZERO;
  }
}
