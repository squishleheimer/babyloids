import { EdgeIterator } from './sparse-graph';
import { IGraphEdge } from './graph-edge-types';
import { IndexedPriorityQLow } from './priority-queue';
import { HeuristicDijkstra } from './heuristic-policies';
import { NavGraph } from './handy-graph-functions';

export class GraphSearchAStar {

  constructor(
    private graph: NavGraph,
    private source: number,
    private target: number,
    private heuristic = new HeuristicDijkstra(),
    private fCosts = new Array<number>(graph.numNodes),
    private gCosts = new Array<number>(graph.numNodes),
    private shortestPathTree = new Array<IGraphEdge>(graph.numNodes),
    private searchFrontier = new Array<IGraphEdge>(graph.numNodes)
  ) {
    this.fCosts.fill(0.0);
    this.gCosts.fill(0.0);
    this.shortestPathTree.fill(null);
    this.searchFrontier.fill(null);

    this.search();
  }

  // returns the vector of edges that the algorithm has examined
  get spt(): Array<IGraphEdge> { return this.shortestPathTree; }

  // returns the total cost to the target
  get costToTarget(): number { return this.gCosts[this.target]; }

  search(): void {
    // create an indexed priority queue of nodes. The nodes with the
    // lowest overall F cost (G+H) are positioned at the front.
    const pq = new IndexedPriorityQLow<number>(
      this.fCosts,
      this.graph.numNodes);

    // put the source node on the queue
    pq.insert(this.source);

    // while the queue is not empty
    while (!pq.empty) {
      // get lowest cost node from the queue
      const nextClosestNode = pq.pop();

      // move this node from the frontier to the spanning tree
      this.shortestPathTree[nextClosestNode] = this.searchFrontier[nextClosestNode];

      // if the target has been found exit
      if (
        nextClosestNode === this.target ||
        (nextClosestNode === 0 && !this.graph.isDigraph)) {
          return;
      }

      // now to test all the edges attached to this node
      const edgeItr = new EdgeIterator(this.graph, nextClosestNode);

      for (let e = edgeItr.begin(); !e.done; e = edgeItr.next()) {
        console.assert(e.value !== null, 'edge iterator without value');
        // calculate the heuristic cost from this node to the target (H)
        const hCost = this.heuristic.calculate(
          this.graph, this.target, e.value.to);

        // calculate the 'real' cost to this node from the source (G)
        const gCost = this.gCosts[nextClosestNode] + e.value.cost;

        // if the node has not been added to the frontier, add it and update
        // the G and F costs
        if (!this.searchFrontier[e.value.to]) {
          this.fCosts[e.value.to] = gCost + hCost;
          this.gCosts[e.value.to] = gCost;

          pq.insert(e.value.to);

          this.searchFrontier[e.value.to] = e.value;

        } else if (gCost < this.gCosts[e.value.to] && this.shortestPathTree[e.value.to] === null) {
          // if this node is already on the frontier but the cost to get here
          // is cheaper than has been found previously, update the node
          // costs and frontier accordingly.
          this.fCosts[e.value.to] = gCost + hCost;
          this.gCosts[e.value.to] = gCost;

          pq.changePriority(e.value.to);

          this.searchFrontier[e.value.to] = e.value;
        }
      }
    }
  }

  getPathToTarget(): Array<number> {

    // just return an empty path if
    // no target or no path found
    if (
      this.target < 0 ||
      !this.shortestPathTree.some(e => e !== null)) {

      return [];
    }

    const path = [ this.target ];

    let nd = this.target;
    while (
      nd !== this.source &&
      this.shortestPathTree[nd] !== null) {

      nd = this.shortestPathTree[nd].from;
      path.push(nd);
    }

    return path.reverse();
  }
}
