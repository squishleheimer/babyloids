import Agent from '../agent';
import Vector from '../math/vector';
import Entity from './entity';
import Path from './path';

export enum SummingMethod {
  WeightedAverage,
  Prioritized,
  Dithered
}

export enum BehaviourType {
  None = 0x00000,
  Seek = 0x00002,
  Flee = 0x00004,
  Arrive = 0x00008,
  Wander = 0x00010,
  Cohesion = 0x00020,
  Separation = 0x00040,
  Alignment = 0x00080,
  ObstacleAvoidance = 0x00100,
  WallAvoidance = 0x00200,
  FollowPath = 0x00400,
  Pursuit = 0x00800,
  Evade = 0x01000,
  Interpose = 0x02000,
  Hide = 0x04000,
  Flock = 0x08000,
  OffsetPursuit = 0x10000,
}

export default class Steering {

  public static AllBehaviours: BehaviourType[] = [
    BehaviourType.ObstacleAvoidance,
    BehaviourType.WallAvoidance,
    BehaviourType.Alignment,
    BehaviourType.Cohesion,
    BehaviourType.Separation,
    BehaviourType.Wander,
    BehaviourType.FollowPath,
    BehaviourType.Evade,
    BehaviourType.Arrive,
    BehaviourType.Flee,
    BehaviourType.Pursuit,
    BehaviourType.OffsetPursuit,
    BehaviourType.Evade,
    BehaviourType.Hide,
    BehaviourType.Interpose
  ];

  private behaviours: Array<SteeringBehaviour> = [];

  private flags: number;

  enabled = false;

  forceTweaker = 250.0;
  summingMethod: SummingMethod = SummingMethod.Dithered;

  steeringForce: Vector = Vector.ZERO;

  viewDistance = 0;
  cellSpaceEnabled = true;

  constructor(
    public owner: Agent,
    public path: Path = new Path()) {
  }

  get forwardComponent(): number {
    return this.owner.heading.dot(this.steeringForce);
  }

  get sideComponent(): number {
    return this.owner.side.dot(this.steeringForce);
  }

  isOn(bt: BehaviourType): boolean {
    // tslint:disable-next-line:no-bitwise
    return (this.flags & bt) === bt;
  }

  on(bt: BehaviourType): void {
    // tslint:disable-next-line:no-bitwise
    this.flags |= bt;
  }

  off(bt: BehaviourType): void {
    if (this.isOn(bt)) {
      // tslint:disable-next-line:no-bitwise
      this.flags ^= bt;
    }
  }

  reset(zeroForce: boolean = true): void {
    this.path.clear();
    if (zeroForce) {
      this.steeringForce.zero();
    }
    this.behaviours.forEach(b => {
      b.reset();
    });
  }

  hasBehaviour(name: string): boolean {
    return this.behaviours.filter(x => x.name === name).length === 1;
  }

  getBehaviourByName(name: string): SteeringBehaviour {
    const x = this.behaviours.filter(b => b.name === name);
    if (x && x.length === 1) {
      return x[0];
    }
    throw new Error(`Behaviour ${name} not found.`);
  }

  getBehaviourByType(bType: BehaviourType): SteeringBehaviour {
    const x = this.behaviours.filter(b => b.behaviourType === bType);
    if (x && x.length === 1) {
      return x[0];
    }
    return null;
    throw new Error(`Behaviour ${bType} not found.`);
  }

  sortPriority(): void {
    this.behaviours.sort((a, b) => {
      return a.priority - b.priority;
    });
  }

  addBehaviour(
    sort: boolean = true,
    ...behaviour: SteeringBehaviour[]): void {

    for (const b of behaviour) {
      if (!this.hasBehaviour(b.name)) {

        this.behaviours.push(b);
        if (sort) {
          this.sortPriority();
        }
        this.on(b.behaviourType);
      }
    }
  }

  private accumulateForce(
    out: { runningTot: Vector },
    forceToAdd: Vector): boolean {

    // calculate how much steering force the vehicle has used so far.
    const magnitudeSoFar: number = out.runningTot.length;

    // calculate how much steering force remains to be used by this vehicle
    const magnitudeRemaining: number = this.owner.maxForce - magnitudeSoFar;

    // return false if there is no more force left to use
    if (magnitudeRemaining <= 0.0) {
      return false;
    }

    // calculate the magnitude of the force we want to add
    const magnitudeToAdd: number = forceToAdd.length;

    // if the magnitude of the sum of ForceToAdd and the running total
    // does not exceed the maximum force available to this vehicle, just
    // add together. Otherwise add as much of the ForceToAdd vector is
    // possible without going over the max.
    if (magnitudeToAdd < magnitudeRemaining) {
      out.runningTot.addTo(forceToAdd);
    } else {
      // add it to the steering force
      out.runningTot.addTo(
        forceToAdd.unit().mult(magnitudeRemaining));
    }

    return true;
  }

  private preCalculate(): void {
    // reset the steering force
    this.steeringForce.zero();

    // tag neighbors if Separation, Alignment or Cohesion are added
    if (this.isOn(
      // tslint:disable-next-line:no-bitwise
      BehaviourType.Alignment |
      BehaviourType.Cohesion |
      BehaviourType.Separation)) {

      if (!this.cellSpaceEnabled) {
        this.owner.face.tagAgentsWithinViewRange(this.owner, this.viewDistance);
      } else {
        // calculate neighbours in cell-space if any of the following 3 group
        // behaviors are switched on
        this.owner.face.csp.calculateNeighbours(
          this.owner.position, 
          this.viewDistance);
      }
    }
  }

  async calculateAsync(): Promise<Vector> {
    
    this.preCalculate();

    return this.calculateDitheredAsync()
    .then(force => {
      this.steeringForce.set(force);
    })
    .then(_ => {
      return this.steeringForce;
    });
  }

  // ----------------------- Calculate --------------------------------------
  //
  //  calculates the accumulated steering force according to the method set
  //  in _summingMethod
  // ------------------------------------------------------------------------
  calculate(): Vector {

    this.preCalculate();

    switch (this.summingMethod) {
      case SummingMethod.WeightedAverage:
        this.steeringForce = this.calculateWeightedSum();
        break;
      case SummingMethod.Prioritized:
        this.steeringForce = this.calculatePrioritized();
        break;
      case SummingMethod.Dithered:
        this.steeringForce = this.calculateDithered();
        break;
      default:
        this.steeringForce.zero();
        break;
    }

    return this.steeringForce;
  }

  // ---------------------- CalculatePrioritized ----------------------------
  //
  //  this method calls each active steering behavior in order of priority
  //  and accumulates their forces until the max steering force magnitude
  //  is reached, at which time the function returns the steering force
  //  accumulated to that  point
  // ------------------------------------------------------------------------
  private calculatePrioritized(): Vector {

    for (const b of this.behaviours) {
      if (this.isOn(b.behaviourType)) {
        const force: Vector = b.force().mult(b.weight * this.forceTweaker);
        const out = { runningTot: this.steeringForce };
        if (!this.accumulateForce(out, force)) {
          this.steeringForce = out.runningTot;
          return this.steeringForce;
        }
      }
    }

    return this.steeringForce;
  }

  // ---------------------- CalculateWeightedSum ----------------------------
  //
  //  this simply sums up all the active behaviors X their weights and
  //  truncates the result to the max available steering force before
  //  returning
  // ------------------------------------------------------------------------
  private calculateWeightedSum(): Vector {

    for (const b of this.behaviours) {
      if (this.isOn(b.behaviourType)) {
        this.steeringForce.addTo(
          b.force().mult(b.weight * this.forceTweaker));
      }
    }

    if (this.steeringForce.length > Number.MIN_VALUE) {
      this.steeringForce.truncate(this.owner.maxForce);
    }

    return this.steeringForce;
  }

  // ---------------------- CalculateDithered ----------------------------
  //
  //  this method sums up the active behaviors by assigning a probability
  //  of being calculated to each behavior. It then tests the first priority
  //  to see if it should be calculated this simulation-step. If so, it
  //  calculates the steering force resulting from this behavior. If it is
  //  more than zero it returns the force. If zero, or if the behavior is
  //  skipped it continues onto the next priority, and so on.
  //
  //  NOTE: Not all of the behaviors have been implemented in this method,
  //        just a few, so you get the general idea
  // ------------------------------------------------------------------------
  private calculateDithered(): Vector {

    for (const b of this.behaviours) {
      if (this.isOn(b.behaviourType) && Math.random() < b.probability) {
        this.steeringForce.addTo(
          b.force().mult(b.weight * this.forceTweaker));
        this.steeringForce.multiply(b.weight / b.probability);

        if (this.steeringForce.length > Number.MIN_VALUE) {
          this.steeringForce.truncate(this.owner.maxForce);
          return this.steeringForce;
        }
      }
    }

    return this.steeringForce;
  }

  private async calculateDitheredAsync(): Promise<Vector> {

    const force: Vector = this.steeringForce.clone();

    return Promise.all(this.behaviours.map( async b => {
      if (this.isOn(b.behaviourType) && Math.random() < b.probability) {
        const f: Vector = await b.forceAsync();
        return { behaviour: b, force: f };
      }
      return { behaviour: b, force: Vector.ZERO };
    }))
    .then(values => {
      values.forEach(v => {
        force.addTo(v.force.mult(v.behaviour.weight * this.forceTweaker));
        force.multiply(v.behaviour.weight / v.behaviour.probability);
      });
    })
    .then(_ => {
      if (force.length > Number.MIN_VALUE) {
        force.truncate(this.owner.maxForce);
      }
      return force;
    });
  }
}

// Produces a force each time slice that accumulates
// with others to produces an overall steering force
// from which a behaviour emerges.
export abstract class SteeringBehaviour {

  priority: number;
  weight: number;
  probability: number;

  constructor(
    priority: number,
    weight: number,
    probability: number) {

    this.priority = priority;
    this.weight = weight;
    this.probability = probability;
  }

  static turnAroundTime(
    e: Entity,
    target: Vector): number {

    // determine the normalized vector to the target
    const pos: Vector = e.position;
    const to: Vector = target.sub(pos).unit();
    const dot: number = e.heading.dot(to);

    // tweak this value to get the desired bejavier
    const coefficient = 0.35;

    // The dot product gives a value of 1 if the target is directly ahead and -1
    // if it is directly behind.  Subtracting 1 and multiplying by the -ve of the
    // coefficient gives a +ve value propnl to rotational displacement of the agent
    // and target.
    return (dot - 1.0) * -coefficient;
  }

  abstract get behaviourType(): BehaviourType;

  get name(): string { return BehaviourType[this.behaviourType].toUpperCase(); }

  async forceAsync(): Promise<Vector> {
    return this.force();
  }

  force(): Vector { return Vector.ZERO; }

  reset(): void { }
}
