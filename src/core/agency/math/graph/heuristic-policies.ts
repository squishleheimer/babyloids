import { IGraph } from './sparse-graph';
import { NavGraph } from './handy-graph-functions';
import { randInRange } from '../random';

export interface IHeuristic<G extends IGraph> {
  calculate(
    g: G,
    i0: number,
    i1: number): number;
}

// -----------------------------------------------------------------------------
// the euclidian heuristic (straight-line distance)
// -----------------------------------------------------------------------------
export class HeuristicEuclid implements IHeuristic<NavGraph> {

  // calculate the straight line distance from node nd1 to node nd2
  static calculate(
    g: NavGraph,
    i0: number,
    i1: number): number {
      const n0 = g.getNode(i0);
      const n1 = g.getNode(i1);
      console.assert(n0 !== undefined, `invalid node from index: ${i0}`);
      console.assert(n1 !== undefined, `invalid node from index: ${i1}`);
      return n0.position
        .sub(n1.position).length;
  }
  calculate(
    g: NavGraph,
    i0: number,
    i1: number): number {
    return HeuristicEuclid.calculate(g, i0, i1);
  }
}

// -----------------------------------------------------------------------------
// this uses the euclidian distance but adds in an amount of noise to the
// result. You can use this heuristic to provide imperfect paths. This can
// be handy if you find that you frequently have lots of agents all following
// each other in single file to get from one place to another
// -----------------------------------------------------------------------------
export class HeuristicNoisyEuclid implements IHeuristic<NavGraph> {

  static calculate(
    g: NavGraph,
    i0: number,
    i1: number): number {
      return HeuristicEuclid.calculate(g, i0, i1) * randInRange(0.9, 1.1);
  }
  calculate(
    g: NavGraph,
    i0: number,
    i1: number): number {
    return HeuristicNoisyEuclid.calculate(g, i0, i1);
  }
}

// -----------------------------------------------------------------------------
// you can use this class to turn the A* algorithm into Dijkstra's search.
// this is because Dijkstra's is equivalent to an A* search using a heuristic
// value that is always equal to zero.
// -----------------------------------------------------------------------------
export class HeuristicDijkstra implements IHeuristic<NavGraph> {

  // calculate the straight line distance from node nd1 to node nd2
  static calculate(
    g: NavGraph,
    n0: number,
    n1: number): number {
      return 0;
  }
  calculate(
    g: NavGraph,
    n0: number,
    n1: number): number {
    return HeuristicDijkstra.calculate(g, n0, n1);
  }
}
