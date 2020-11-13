import { NodeType } from './node-type-enumerations';

export interface IGraphEdge {
  from: number;
  to: number;
  cost: number;
  setCost(cost: number): void;
  reverseCopy(): IGraphEdge;
}

export class GraphEdge implements IGraphEdge {

  constructor(
    // tslint:disable-next-line:variable-name
    protected _iFrom: number = NodeType.invalid_node_index,
    // tslint:disable-next-line:variable-name
    protected _iTo: number = NodeType.invalid_node_index,
    // tslint:disable-next-line: variable-name
    public _cost: number = 1.0) {
  }

  public get cost(): number {
    return this._cost;
  }

  setCost(cost: number): void {
    this._cost = cost;
  }

  public get from(): number {
    return this._iFrom;
  }

  public get to(): number {
    return this._iTo;
  }

  public equals(other: GraphEdge): boolean {
    return this._iFrom === other.from &&
      this._iTo === other.to &&
      this._cost === other._cost;
  }

  public reverseCopy(): IGraphEdge {
    return new GraphEdge(
      this.to,
      this.from,
      this._cost,
    );
  }
}

export class NavGraphEdge extends GraphEdge {

  constructor(
    from: number,
    to: number,
    cost: number,
    // tslint:disable-next-line:variable-name
    private _flags: number = 0,
    public isOccupied: boolean = false) {
    super(from, to, cost);
  }

  public reverseCopy(): IGraphEdge {
    return new NavGraphEdge(
      this.to,
      this.from,
      this._cost,
      this._flags,
      this.isOccupied
    );
  }

  get flags(): number { return this._flags; }
  setFlags(flags: number): void { this._flags = flags; }
}
