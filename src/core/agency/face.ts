import Agent from './agent';
import Vector from './math/vector';
import Alignment from './steering/alignment';
import Cohesion from './steering/cohesion';
import Separation from './steering/separation';
import Wander from './steering/wander';
import Wall from './steering/wall';
import { pointToLocalSpace } from './math/geometry';
import CellSpacePartition from './math/cell-space-partition';
import Entity from './steering/entity';
import { NavGraph, createSquareGrid, createTriangleGrid } from './math/graph/handy-graph-functions';
import { PathFinder } from './math/graph/path-finder';
import Path from './steering/path';
import { randomIntFromInterval } from './math/random';

export default class Face {

  // tslint:disable-next-line:variable-name
  private _position: Vector;
  // tslint:disable-next-line:variable-name
  private _rect: Vector;
  // tslint:disable-next-line:variable-name
  private _csp: CellSpacePartition;
  // tslint:disable-next-line:variable-name
  private _walls: Wall[] = [];
  // tslint:disable-next-line:variable-name
  private _obstacles: Entity[] = [];
  // tslint:disable-next-line:variable-name
  private _facets: Agent[] = [];
  // tslint:disable-next-line:variable-name
  private _graph: NavGraph;
  // tslint:disable-next-line:variable-name
  private _pathFinder: PathFinder;

  get position(): Vector { return this._position; }
  get rect(): Vector { return this._rect; }
  get csp(): CellSpacePartition { return this._csp; }
  get walls(): Wall[] { return this._walls; }
  get obstacles(): Entity[] { return this._obstacles; }
  get facets(): Agent[] { return this._facets; }
  get graph(): NavGraph { return this._graph; }
  get pathFinder(): PathFinder { return this._pathFinder; }

  public enableNonPenetrationConstraint: boolean = true;

  onAdd = (a: Agent) => {
    a.addEvent.trigger(a);
  }

  onRemove = (a: Agent) => {
    a.removeEvent.trigger(a);
  }

  constructor(
    position: Vector,
    rect: Vector,
    private maxFacets: number,
    {
      cellSpaceSize = 7,
      nonPenetrationEnabled = false
    } = {}) {
    this.enableNonPenetrationConstraint = nonPenetrationEnabled;
    this._position = position;
    this._rect = rect;
    this._csp = new CellSpacePartition(
      this._rect.x,
      this._rect.y,
      cellSpaceSize,
      cellSpaceSize,
     this.maxFacets
    );
    this._graph = new NavGraph();
    createSquareGrid(
      this._graph,
      this._rect.x,
      this._rect.y,
      this.csp.cellsX * 4,
      this.csp.cellsY * 4,
      this.position);
    // createTriangleGrid(
    //   this._graph,
    //   500,
    //   3);
    this._pathFinder =
      new PathFinder(this._graph);
  }

  public removeNode(p: Vector, r: number): void {
    const i = this.pathFinder.getClosestNodeToPos(p);
    const n = this.graph.getNode(i);
    if (n) {
      if (p.sub(n.position).getLengthSq() < r ** 2) {
        this.graph.removeNode(i);
        this.graph.isDirty = true;
      }
    }
  }

  public async removeNodeAsync(
    p: Vector,
    r: number): Promise<void> {
    this.removeNode(p, r);
  }

  public getRandomOther(other: Agent): Entity {
    const x = this.facets[randomIntFromInterval(0, this.facets.length - 1)] as Entity;
    return x === other ? null : x;
  }

  public async getRandomOtherAsync(other: Agent): Promise<Entity> {
    return this.getRandomOther(other);
  }

  public getRandomPath(
    p: Vector): any {
    const out = {
      i0: -1,
      i1: -1,
      cost: 0,
      path: null
    };
    out.i0 = this.pathFinder.getClosestNodeToPos(p);
    out.i1 = this.pathFinder.getRandomOtherNode(out.i0);
    out.cost = this.pathFinder.createPathAStar(out, out.i0, out.i1);
    return out;
  }

  public async getRandomPathAsync(
    p: Vector): Promise<any> {
    return this.getRandomPath(p);
  }

  addWall(...walls: Wall[]): void {
    this._walls.push(...walls);
  }

  addObstacle(...obstacles: Entity[]): void {
    this._obstacles.push(...obstacles);
  }

  addAgent(a: Agent): Agent {
    this._facets.push(a);
    this._csp.addEntity(a);
    this.onAdd(a);
    return a;
  }

  removeAgent(a: Agent): void {
    const idx = this._facets.indexOf(a);
    const _ = this._facets.splice(idx);
    a.removeEvent.trigger(a);
  }

  wipeAgents() {
    while (this._facets.length > 0) {
      const a = this._facets.pop();
      a.removeEvent.trigger(a);
    }
    Agent._nextId = 0;
    this._csp.reset();
  }

  addFlocking(a: Agent) {
    a.steering.addBehaviour(true, ...[
      new Alignment(a),
      new Cohesion(a),
      new Separation(a),
      new Wander(a)
    ]);
  }

  numberOfFacets(): number {
    return this._facets.length;
  }

  centre(): Vector {
    return this._rect.div(2.0);
  }

  reset() {
    this._facets.forEach((a: Agent) => {
      a.reset(a.origin);
    });
  }

  outOfBounds = (p: Vector): boolean => {
    return (
      p.x <= this.position.x ||
      p.x >= this._rect.x ||
      p.y <= this.position.y ||
      p.y >= this._rect.y
    );
  }

  tick(deltaTimeInSeconds: number) {
    this._facets.forEach((a: Agent) => {
      if (this.enableNonPenetrationConstraint) {
        this.enforceNonPenetrationConstraint(a, [
          ...this.obstacles,
          ...this.facets
        ]);
      }
      a.tick(deltaTimeInSeconds);
    });
  }

  tagAgentsWithinViewRange(
    agent: Agent,
    range: number): void {
    this.tagNeighbours(agent, this._facets, range);
  }

  tagObstaclesWithinViewRange(
    agent: Agent,
    range: number): void {
    this.tagNeighbours(agent, this._obstacles, range);
  }

  // ----------------------- TagNeighbours ----------------------------------
  //
  //  tags any entities contained in a container that are within the
  //  radius of the single entity parameter
  // ------------------------------------------------------------------------
  tagNeighbours(
    a: Agent,
    others: Entity[],
    radius: number): void {

    // iterate through all entities checking for range
    others.forEach(b => {

      // first clear any current tag
      b.unTag();

      if (b.enabled) {
        const to: Vector = b.position.sub(a.position);

        // the bounding radius of the other is taken
        // into account by adding it to the range.
        const range: number = radius + b.radius;

        // if entity within range, const ag: Vector for further consideration..sub(.position i)n
        // distance-squared space to avoid sqrts)
        const distSq: number = to.getLengthSq();

        if (b !== a && distSq < range * range) {
          // calculate this obstacle's position in local space
          const localPos: Vector = pointToLocalSpace(
            b.position,
            a.heading,
            a.side,
            a.position);

          const distX = localPos.x + b.radius + a.radius;

          if (distX >= 0) {
            b.tag();
            a.tag();
          } else {
            a.unTag();
          }
        }
      }
    });
  }

  // ------------------- EnforceNonPenetrationConstraint ---------------------
  //
  //  Given a pointer to an entity and a std container of pointers to nearby
  //  entities, this function checks to see if there is an overlap between
  //  entities. If there is, then the entities are moved away from each
  //  other
  // -------------------------------------------------------------------------
  enforceNonPenetrationConstraint(
    a: Entity,
    others: Entity[]): void {

    // iterate through all entities checking for any overlap of bounding radii
    others.forEach(b => {
      // make sure we don't check against the individual
      if (b !== a && b.enabled) {
        // calculate the distance between the positions of the entities
        const ab: Vector = b.position.sub(a.position);
        const distFromEachOther: number = ab.length;

        // if this distance is smaller than the sum of their radii then this
        // entity must be moved away in the direction parallel to the toOther vector
        const radiiSum = a.radius + b.radius;
        const amountOfOverLap: number = radiiSum - distFromEachOther;

        if (distFromEachOther < radiiSum) { // overlap
          let offset: Vector = Vector.randomUnit(); // full overlap
          if ( // partial overlap
            amountOfOverLap > Number.MIN_VALUE &&
            distFromEachOther > Number.MIN_VALUE) {
            // move the entity a distance away equivalent to the amount of overlap.
            offset = ab.neg().div(distFromEachOther);
          }

          a.updatePosition(
            a.position.add(
              offset.mult(amountOfOverLap)),
            a.position);
        }
      }
    });
  }
}
