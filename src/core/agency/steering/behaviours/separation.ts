import { SteeringBehaviour, BehaviourType } from './../steering';
import Vector from '../../math/vector';
import Agent from '../../agent';

export default class Separation extends SteeringBehaviour {
  owner: Agent;

  constructor(owner: Agent) {
    super(4, 2.0, 0.3);

    this.owner = owner;
  }

  get behaviourType(): BehaviourType { return BehaviourType.Separation; }

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

      let steeringForce: Vector = Vector.ZERO;

      for (const n of neighbours) {
        // make sure this agent isn't included in the calculations and that
        // the agent being examined is close enough.
        // TODO: *** also make sure it doesn't include the evade target ***
        if (n !== this.owner && n.enabled &&
          (this.owner.steering.cellSpaceEnabled || n.isTagged())) {
          const toAgent: Vector = this.owner.position.sub(n.position);

          // scale the force inversely proportional to the agents distance
          // from its neighbor.
          const length: number = toAgent.length;
          if (length > 0) {
            steeringForce = steeringForce.add(toAgent.unit().div(length));
          }
        }
      }

      return steeringForce;
    }

    return Vector.ZERO;
  }
}
