import Vector from './vector';
import { AABBInverted } from './aabb';
import { clamp } from './random';
import Agent from '../agent';

export class Cell<T> {

  // All the entities inhabiting this cell
  members: Array<T> = [];

  // The cell's bounding box (it's inverted because the Window's default
  // co-ordinate system has a y axis that increases as it descends)
  BBox: AABBInverted;

  constructor(
    bottomleft: Vector,
    topright: Vector) {
    this.BBox = new AABBInverted(bottomleft, topright);
  }
}

export default class CellSpacePartition {

  public cells: Array<Cell<Agent>> = [];
  public neighbours: Array<Agent> = [];

  // The width and height of the world space the entities inhabit
  private spaceWidth: number;
  private spaceHeight: number;

  // The number of cells the space is going to be divided up into
  private numCellsX: number; // int
  private numCellsY: number; // int

  private readonly cellSizeX: number;
  private readonly cellSizeY: number;

  public get width(): number { return this._width; }
  public get height(): number { return this._height; }
  public get cellsX(): number { return this._cellsX; }
  public get cellsY(): number { return this._cellsY; }

  // given a position in the game space this
  // method determines the relevant cell's index
  public positionToIndex(pos: Vector): number {

    const idx =
      Math.floor(this.numCellsX * pos.x / this.spaceWidth) +
      Math.floor(this.numCellsY * pos.y / this.spaceHeight) * this.numCellsX;

    // if the entity's position is equal to Vector(this.spaceWidth, this.spaceHeight)
    // then the index will overshoot. We need to check for this and adjust.
    return clamp(idx, 0, this.cells.length - 1);
  }

  constructor(
    // tslint:disable-next-line:variable-name
    private _width: number,  // width of the environment
    // tslint:disable-next-line:variable-name
    private _height: number, // height ...
    // tslint:disable-next-line:variable-name
    private _cellsX: number, // number of cells horizontally
    // tslint:disable-next-line:variable-name
    private _cellsY: number, // number of cells vertically
    maxAgents: number
  ) {

    this.neighbours = new Array<Agent>(maxAgents);

    this.spaceWidth = _width;
    this.spaceHeight = _height;
    this.numCellsX = _cellsX;
    this.numCellsY = _cellsY;

    // Calculate bounds of each cell.
    this.cellSizeX = _width / _cellsX;
    this.cellSizeY = _height / _cellsY;

    // Create the cells.
    for (let y = 0; y < this.numCellsY; ++y) {
      for (let x = 0; x < this.numCellsX; ++x) {

        const left = (x * this.cellSizeX);
        const right = (left + this.cellSizeX);
        const top = (y * this.cellSizeY);
        const bottom = (top + this.cellSizeY);

        this.cells.push(
          new Cell<Agent>(
            new Vector(left, top),
            new Vector(right, bottom)));
      }
    }
  }

  get cellHypotenuse(): number {
    if (this.cells.length > 0) {
      return this.cells
        .map(c => c.BBox.hypotenuseLength())
        .reduce((c, d) => c + d)
        / (this.cells.length * 2.0);
    }
    return 0;
  }

  get rect(): Vector {
    if (this.cells.length > 0) {
      return this.cells
        .map(c => new Vector(
          c.BBox.right - c.BBox.left,
          c.BBox.bottom - c.BBox.top))
        .reduce((a, b) => a.add(b))
        .div(this.cells.length);
    }
    throw new Error();
  }

  reset(): void {
    this.emptyCells();
  }

  // Empties the cells of entities
  emptyCells(): void {
    for (const cell of this.cells) {
      cell.members = [];
    }
  }

  // adds entities to the class by allocating
  // them to the appropriate cell.
  addEntity(a: Agent): void {
    const idx = this.positionToIndex(a.position);
    this.cells[idx].members.push(a);
  }

  // brute force removal for cases like a reset.
  removeEntity(a: Agent): boolean {
    for (const cell of this.cells) {
      const idx = cell.members.indexOf(a);
      if (idx > -1) {
        cell.members.splice(idx, 1);
        return true;
      }
    }
    return false;
  }

  // update an entity's cell by calling this
  // from your entity's Update method.
  updateEntity(
    a: Agent,
    oldPos: Vector,
    newPos?: Vector): boolean {

    // if the index for the old pos and the new pos are not equal then
    // the entity has moved to another cell.
    const oldIdx: number = this.positionToIndex(oldPos);
    const newIdx: number = this.positionToIndex(newPos || a.position);

    if (newIdx === oldIdx) { return false; }

    // the entity has moved into another cell so delete from current cell
    if (!this.removeMemberFromCell(oldIdx, a)) {
      throw new Error(`didn't remove agent`);
    }

    // and add to new one
    this.cells[newIdx].members.push(a);

    return true;
  }

  private removeMemberFromCell(index: number, a: Agent): boolean {
    const idx = this.cells[index].members.indexOf(a);
    if (idx > -1) {
      this.cells[index].members.splice(idx, 1);
      return true;
    }
    return false;
  }

  // this method calculates all a target's neighbors and stores them in
  // the neighbor vector. After you have called this method use the begin,
  // next and end methods to iterate through the vector.
  calculateNeighbours(
    targetPos: Vector,
    queryRadius: number): void {

      // TODO: investigate where this unused expression is relevant.
      const _ = new Vector(
        targetPos.x + this.spaceWidth / 2.0,
        targetPos.y + this.spaceHeight / 2.0);

      // create the query box that is the
      // bounding box of the target's query
      // area
      const queryBox = new AABBInverted(
        targetPos.sub(new Vector(queryRadius, queryRadius)),
        targetPos.add(new Vector(queryRadius, queryRadius))
      );

      // create an index and set it to the
      // beginning of the neighbor vector
      let curNbor = 0;

      // iterate through each cell and test to see if its bounding box overlaps
      // with the query box. If it does and it also contains entities then
      // make further proximity tests.
      for (const cell of this.cells) {
        // test to see if this cell contains members
        // and if it overlaps the query box
        if (cell.BBox.isOverlappedWith(queryBox) && cell.members.length > 0) {
          // add any entities found within query radius to the neighbor list
          for (const a of cell.members) {
            if (a.position.sub(targetPos).getLengthSq() < queryRadius ** 2) {
              this.neighbours[curNbor++] = a;
            }
          }
        }
      }
      // mark the end of the list with a zero.
      this.neighbours[curNbor] = undefined;
  }
}
