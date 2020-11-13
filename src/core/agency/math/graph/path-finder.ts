import Path from '../../steering/path';
import { GraphSearchAStar } from './graph-algorithms';
import { NavGraph } from './handy-graph-functions';
import Vector from '../vector';
import { randomIntFromInterval } from '../random';

export class PathFinder {

  constructor(
    private graph: NavGraph
  ) { }

  public createPathAStar(
    out: { path: Path },
    sourceIndex: number,
    targetIndex: number) {

    console.assert(this.graph !== undefined, 'graph not assigned');

    // create an instance of the A* search
    // using the Euclidean heuristic.
    const search = new GraphSearchAStar(
      this.graph, sourceIndex, targetIndex);

    // populate list with new path nodes
    const path = search.getPathToTarget();

    // console.log(`path: ${path}`);

    if (path.length > 0) {
      out.path = new Path(
        path
          .map(i => this.graph.getNode(i).position)
      );
    }

    return search.costToTarget;
  }

  public getClosestNodeToPos(p: Vector): number {
    let minIndex = -1;
    let minLengthSq = Number.MAX_VALUE;

    for (let index = 0; index < this.graph.numNodes; ++index) {

      if (this.graph.isNodePresent(index)) {
        const n = this.graph.getNode(index);
        const lengthSq = n.position.sub(p).getLengthSq();

        if (lengthSq < minLengthSq) {
          minIndex = index;
          minLengthSq = lengthSq;
        }
      }
    }
    return minIndex;
  }

  public getRandomOtherNode(
    node: number = -1,
    maxTries: number = 1000): number {

    let index = -1;
    do {
      index = randomIntFromInterval(0, this.graph.numNodes - 1);
    } while (
      (index === node ||
      !this.graph.isNodePresent(index)) &&
      maxTries-- > 0);

    if (maxTries <= 0) {
      index = -1;
    }

    return index;
  }

  public getRandomDestinationWithinDistanceSq(
    p: Vector,
    dSq: number): number {

    let lengthSq = Number.MAX_VALUE;
    const pos: Vector = Vector.ZERO;
    const indices: Array<number> = [];

    for (let index = 0; index < this.graph.numNodes; ++index) {
      if (this.graph.isNodePresent(index)) {
        const n = this.graph.getNode(index);
        pos.set(n.position);
        lengthSq = pos.sub(p).getLengthSq();

        if (lengthSq < dSq) {
          indices.push(index);
        }
      }
    }

    if (indices.length > 0) {
      const randomIndex = randomIntFromInterval(0, indices.length - 1);
      return indices[randomIndex];
    } else {
      return -1;
    }
  }

}
