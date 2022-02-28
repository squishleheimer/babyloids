import { SteeringBehaviour, BehaviourType } from '../steering';
import Vector from '../../math/vector';
import Agent from '../../agent';

export default class Alignment extends SteeringBehaviour {
  owner: Agent;

  constructor(owner: Agent) {
    super(4, 1.0, 0.2);

    this.owner = owner;
  }

  get behaviourType(): BehaviourType { return BehaviourType.Alignment; }

  force(): Vector {
    if (this.owner.steering.cellSpaceEnabled) {
      const idx = this.owner.face.csp.positionToIndex(this.owner.position);
      const cellmates = this.owner.face.csp.cells[idx].members;
      return this.calculateForce(cellmates);
    }
    return this.calculateForce(this.owner.face.facets);
  }

  private calculateForce(neighbours: Array<Agent>): Vector {

    if (this.owner && neighbours.length > 0) {

      // used to record the average heading of the neighbors
      let averageHeading: Vector = Vector.ZERO;

      let neighbourCount = 0;

      // iterate through all the tagged vehicles and sum their heading vectors
      for (const n of neighbours) {
        // make sure this agent isn't included in the calculations and that
        // the agent being examined is close enough.
        // TODO: *** also make sure it doesn't include the evade target ***
        if (n !== this.owner && n.enabled &&
          (this.owner.steering.cellSpaceEnabled || n.isTagged())) {
          averageHeading.addTo(n.heading);
          ++neighbourCount;
        }
      }

      // if the neighborhood contained one or more vehicles, average their
      // heading vectors.
      if (neighbourCount > 0) {
        averageHeading = averageHeading.div(neighbourCount);
        averageHeading = averageHeading.sub(this.owner.heading);
      }

      return averageHeading;
    }

    return Vector.ZERO;
  }
}
