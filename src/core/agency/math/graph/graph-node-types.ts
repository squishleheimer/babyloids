import { NodeType } from './node-type-enumerations';
import Vector from '../vector';

export interface IGraphNode {
  index: number;
  isValid: boolean;
  setIndex(idx: number): void;
}

export class GraphNode implements IGraphNode {

  constructor(
    protected iIndex: number = NodeType.invalid_node_index) {
  }

  public get index(): number {
    return this.iIndex;
  }

  public setIndex(index: number): void {
    this.iIndex = index;
  }

  get isValid(): boolean {
    return (this.iIndex !== NodeType.invalid_node_index); }

  toString(): string {
    return `${this.index}:${this.isValid}`;
  }
}

export class NavGraphNode<T> extends GraphNode {

  constructor(
    index: number,
    // tslint:disable-next-line:variable-name
    protected _position: Vector,
    // tslint:disable-next-line:variable-name
    private _extraInfo: T = null,
    // tslint:disable-next-line:variable-name
    private _isOccupied: boolean = false) {
    super(index);
  }

  public get isOccupied(): boolean { return this._isOccupied; }
  public setOccupied(occupado: boolean = !this._isOccupied): void {
    this._isOccupied = occupado;
  }

  get extraInfo(): T { return this._extraInfo; }

  get position(): Vector { return this._position; }
  setPosition(p: Vector): void { this._position.set(p); }

  toString(): string {
    return `${super.toString()}:${this.extraInfo}:${this.position}`;
  }
}
