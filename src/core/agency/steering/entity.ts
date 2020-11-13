import Vector from '../math/vector';
import LifetimeEvent from '../handlers';

export default abstract class Entity {

  // tslint:disable-next-line:variable-name
  public static _nextId = 0;
  // tslint:disable-next-line:variable-name
  private _id: number = Entity._nextId++;

  get id() { return this._id; }

  // tslint:disable-next-line:variable-name
  protected _tagged = false;

  addEvent = new LifetimeEvent<Entity>();
  removeEvent = new LifetimeEvent<Entity>();
  updateEvent = new LifetimeEvent<Entity>();
  resetEvent = new LifetimeEvent<Entity>();

  public abstract get enabled(): boolean;
  public abstract updatePosition(oldPos: Vector, newPos: Vector): void;

  constructor(
    // tslint:disable-next-line:variable-name
    private _radius: number,
    // tslint:disable-next-line:variable-name
    private _position: Vector,
    // tslint:disable-next-line: variable-name
    protected _velocity: Vector = Vector.ZERO,
    // tslint:disable-next-line: variable-name
    protected _heading: Vector = Vector.ZERO,
    // tslint:disable-next-line: variable-name
    protected _side: Vector = Vector.ZERO) { }

  get radius(): number { return this._radius; }
  get position(): Vector { return this._position; }
  get velocity(): Vector { return this._velocity; }
  get heading(): Vector { return this._heading; }
  get side(): Vector { return this._side; }
  get speed(): number { return this.velocity.length; }

  public isTagged(): boolean { return this._tagged; }
  public tag(): void { this._tagged = true; }
  public unTag(): void { this._tagged = false; }
}
