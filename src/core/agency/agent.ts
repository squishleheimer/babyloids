import Vector from './math/vector';
import Smoother from './math/smoother';
import Steering from './steering/steering';
import IState, { StateMachine } from './state';
import Entity from './steering/entity';

export class AgentState implements IState<Agent> {
  enter(_: Agent): void { }
  execute(_: Agent): void { }
  exit(_: Agent): void { }
}

export default abstract class Agent extends Entity {

  maxSpeed = 250.0;
  maxForce = 2500.0;
  mass = 5.0;

  face: any;

  origin: Vector;
  direction: Vector = Vector.randomUnit();

  sliceInSeconds = 0;
  lifetimeInSeconds = 0;

  smoother: Smoother = new Smoother();

  fsm: StateMachine<Agent> = new StateMachine<Agent>(this);
  steering: Steering = new Steering(this);

  protected abstract updateGraphics(): void;
  public abstract get enabled(): boolean;

  constructor(
    radius: number,
    f: any,
    o: Vector = Vector.ZERO,
    d: Vector = Vector.randomUnit(),
    p: Vector = o.clone()) {
    super(radius, p);
    this.face = f;
    this.origin = o;
    this.direction = d;
    this.heading.set(d.clone());
    this.side.set(this.heading.perp());
    this._velocity = Vector.ZERO;
    this.updatePosition(o, p);
  }

  reset(p: Vector, d: Vector = this.direction) {
    this.updatePosition(this.position, p);
    this._tagged = false;
    this.sliceInSeconds = 0;
    this.direction = d.clone();
    this.velocity.zero();
    this.side.set(this.direction.perp());
    this.lifetimeInSeconds = 0;
    this.smoother.reset();
    this.steering.reset();
    this.resetEvent.trigger(this);
  }

  tick(deltaTimeInSeconds: number) {
    this.lifetimeInSeconds += deltaTimeInSeconds;
    this.fsm.update(deltaTimeInSeconds);
    if (this.steering.enabled) {
      this.sliceInSeconds = deltaTimeInSeconds;
      this.steer(deltaTimeInSeconds);
    }
    this.updateGraphics();
  }

  updatePosition(
    oldPos: Vector,
    newPos: Vector): void {
    if (this.steering.cellSpaceEnabled) {
      this.face.csp.updateEntity(
        this, oldPos, newPos);
    }
    this.position.set(newPos);
    this.updateEvent.trigger(this);
  }

  private steer(deltaTimeInSeconds: number): void {

    // calculate the combined force from each
    // steering behavior in the npc's list
    const steeringForce: Vector = this.steering.calculate();

    // Acceleration = Force/Mass
    const acceleration: Vector = steeringForce.div(this.mass);

    // update velocity
    this.velocity.addTo(
      acceleration.mult(deltaTimeInSeconds));

    // make sure agent does not exceed maximum velocity
    this.velocity.truncate(this.maxSpeed);

    // update the heading if the agent has a non zero velocity
    if (this.velocity.getLengthSq() > Number.MIN_VALUE) {
      this.direction = this.velocity.unit();
      this.side.set(this.direction.perp());
    }

    const oldPos = this.position;
    const newPos = this.position.add(
      this.velocity.mult(deltaTimeInSeconds));

    this.updatePosition(
      oldPos, newPos);

    this._heading =
      this.smoother.enabled ?
      this.smoother.update(this.direction) :
      this.direction;

    // console.log(`speed: ${this.speed}`);
  }
}
