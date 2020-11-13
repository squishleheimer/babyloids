import { NodeType } from './node-type-enumerations';
import { IGraphNode } from './graph-node-types';
import { IGraphEdge } from './graph-edge-types';

export interface IGraph {
  numNodes: number;
  nodes: Array<IGraphNode>;
  edges: Array<Array<IGraphEdge>>;
  isDirty: boolean;
  getNode(idx: number): IGraphNode;
  getEdge(from: number, to: number): IGraphEdge;
}

interface IteratorResult<T> {
  done: boolean;
  value: T;
}

interface Iterator<T> {
  begin(): IteratorResult<T>;
  next(value?: any): IteratorResult<T>;
  return?(value?: any): IteratorResult<T>;
  throw?(e?: any): IteratorResult<T>;
}

export class EdgeIterator implements Iterator<IGraphEdge> {
  private currentEdgeIndex = 0;

  constructor(
    public graph: IGraph,
    public nodeIndex: number) {

    }

  public begin(): IteratorResult<IGraphEdge> {
    this.currentEdgeIndex = 0;
    return {
      done: false,
      value: this.graph.edges[this.nodeIndex][this.currentEdgeIndex++]
    };
  }

  public next(): IteratorResult<IGraphEdge> {
    if (this.currentEdgeIndex < this.graph.edges[this.nodeIndex].length) {
      return {
        done: false,
        value: this.graph.edges[this.nodeIndex][this.currentEdgeIndex++]
      };
    } else {
      return {
        done: true,
        value: null
      };
    }
  }

  return?(value?: any): IteratorResult<IGraphEdge> {
    throw new Error('Method not implemented.');
  }

  throw?(e?: any): IteratorResult<IGraphEdge> {
    throw new Error('Method not implemented.');
  }

}

export class NodeIterator implements Iterator<IGraphNode> {
  private currentNodeIndex = -1;

  constructor(
    public graph: IGraph) {
    }

  // if a graph node is removed, it is not removed from the
  // vector of nodes (because that would mean changing all the indices of
  // all the nodes that have a higher index). This method takes a node
  // iterator as a parameter and assigns the next valid element to it.
  private getNextValidNode(): number {

    let i = this.currentNodeIndex + 1;

    while (i < this.graph.numNodes) {
      const n = this.graph.getNode(i);
      if (n.index !== NodeType.invalid_node_index) {
        return i;
      } else {
        ++i;
      }
    }

    return -1;
  }

  public begin(): IteratorResult<IGraphNode> {
    this.currentNodeIndex = -1;
    const i = this.getNextValidNode();
    return {
      done: false,
      value: this.graph.getNode(i)
    };
  }

  public next(): IteratorResult<IGraphNode> {
    this.currentNodeIndex = this.getNextValidNode();
    if (
      this.currentNodeIndex >= 0 &&
      this.currentNodeIndex < this.graph.numNodes) {
      return {
        done: false,
        value: this.graph.getNode(this.currentNodeIndex)
      };
    } else {
      return {
        done: true,
        value: null
      };
    }
  }

  return?(value?: any): IteratorResult<IGraphNode> {
    throw new Error('Method not implemented.');
  }

  throw?(e?: any): IteratorResult<IGraphNode> {
    throw new Error('Method not implemented.');
  }

}

export default class SparseGraph<N extends IGraphNode, E extends IGraphEdge>
  implements IGraph {

  // tslint:disable-next-line:variable-name
  public isDirty = false;
  // public get isDirty() { return this._isDirty; }
  public get isDigraph(): boolean { return this._isDigraph; }

  // tslint:disable-next-line:variable-name
  private _nodes: Array<N> = [];
  // tslint:disable-next-line:variable-name
  private _edges: Array<Array<E>> = [];

  constructor(
    // tslint:disable-next-line:variable-name
    private _isDigraph: boolean = true,
    // tslint:disable-next-line:variable-name
    private _nextNodeIndex: number = 0
  ) {
  }

  get nodes(): Array<N> { return this._nodes; }
  get edges(): Array<Array<E>> { return this._edges; }

  get nextFreeNodeIndex(): number { return this._nextNodeIndex; }

  // returns the number of active nodes present in the graph (this method's
  // performance can be improved greatly by caching the value)
  // TODO: cache the value (on addNode?).
  get numActiveNodes(): number {
    return this._nodes.filter(n => n.index !== NodeType.invalid_node_index).length;
  }

  // returns the number of active + inactive nodes present in the graph
  get numNodes(): number {
    return this._nodes.length;
  }

  // returns the total number of edges present in the graph
  get numEdges(): number	{
    return this._edges
      .map(x => x.length)
      .reduce((e, f) => e + f);
  }

  // returns true if the graph contains no nodes
  get isEmpty(): boolean {
    return this._nodes.length === 0;
  }

  // clears the graph ready for new node insertions
  clear(): void {
    this._nextNodeIndex = 0;
    this._nodes = [];
    this._edges = [];
  }

  removeEdges(): void {
    for (let index = 0; index < this._edges.length; index++) {
      this._edges[index] = [];
    }
  }

  isNodePresent(idx: number): boolean {
    if (idx >= this._nodes.length || this._nodes[idx].index === NodeType.invalid_node_index) {
      return false;
    }
    return true;
  }

  isEdgePresent(from: number, to: number): boolean {
    if (this.isNodePresent(from) && this.isNodePresent(from)) {
      return this._edges[from].some(e => e.to === to);
    }
    return false;
  }

  getNode(idx: number): N {
    console.assert(idx >= 0 && idx < this._nodes.length);
    return this._nodes[idx];
  }

  getEdgeList(from: number): Array<E> {
    console.assert(
      from >= 0 &&
      from < this._nodes.length &&
      this._nodes[from].index !== NodeType.invalid_node_index);
    return this._edges[from];
  }

  getEdge(from: number, to: number): E {
    console.assert(
      from >= 0 &&
      from < this._nodes.length &&
      this._nodes[from].index !== NodeType.invalid_node_index);
    console.assert(
      to >= 0 &&
      to < this._nodes.length &&
      this._nodes[to].index !== NodeType.invalid_node_index);
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < this._edges[from].length; ++i) {
      const e = this._edges[from][i];
      if (e.to === to) {
        return e;
      }
    }
    console.assert(false, 'getEdge: edge does not exist');
  }

  addEdge(edge: E): void {
    console.assert(
      edge.from <= this._nextNodeIndex && edge.to < this._nextNodeIndex,
      `addEdge: invalid node index: ${edge.from}`);

    if (this.uniqueEdge(edge.from, edge.to)) {
      if (this.isDigraph) {
        this._edges[edge.from].push(edge);
      } else {
        this._edges[edge.to].push(edge.reverseCopy() as E);
      }
    }
  }

  removeEdge(from: number, to: number): void {
    console.assert(
      from < this._nodes.length && to < this._nodes.length,
      `SparseGraph.removeEdge - invalid node index: ${from} or ${to}`);

    if (!this.isDigraph) {
      // tslint:disable-next-line:prefer-for-of
      for (let i = 0; i < this._edges[to].length; i++) {
        const e = this._edges[to][i];
        if (e.to === from) {
          this._edges[to].splice(i);
          break;
        }
      }
    }

    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < this._edges[from].length; i++) {
      const e = this._edges[from][i];
      if (e.to === to) {
        this._edges[from].splice(i);
        break;
      }
    }
  }

  addNode(node: N): number {
    if (node.index < this._nodes.length) {
      // make sure the client is not trying to add a node with the same ID as
      // a currently active node
      console.assert(
        this._nodes[node.index].index === NodeType.invalid_node_index,
        'SparseGraph.addNode: Attempting to add a node with a duplicate ID');
      this._nodes[node.index] = node;
      return this._nextNodeIndex;
    } else {
      console.assert(
        node.index === this._nextNodeIndex,
        `SparseGraph.addNode: invalid index: ${node.index}`
      );
      this._nodes.push(node);
      this._edges.push(new Array<E>());
      return this._nextNodeIndex++;
    }
  }

  cullInvalidEdges(): void {
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < this._edges.length; ++i) {
      const edgeList = this._edges[i];
      let removeValFromIndex = [];
      // tslint:disable-next-line:prefer-for-of
      for (let j = 0; j < edgeList.length; ++j) {
        const edge = edgeList[j];
        if (
          this._nodes[edge.to].index === NodeType.invalid_node_index ||
          this._nodes[edge.from].index === NodeType.invalid_node_index) {
          removeValFromIndex.push(j);
        }
      }

      if (removeValFromIndex.length > 0) {
        removeValFromIndex = removeValFromIndex.sort((a, b) => b - a);
        while (removeValFromIndex.length) {
          edgeList.splice(removeValFromIndex.pop(), 1);
        }
        // for (let k = removeValFromIndex.length - 1; k >= 0; --k) {
        //   edgeList.splice(removeValFromIndex[k], 1);
        // }
      }
    }
  }

  removeNode(idx: number): void {
    console.assert(
      idx < this._nodes.length,
      `SparseGraph.removeNode - invalid node index: ${idx}`
    );

    this._nodes[idx].setIndex(NodeType.invalid_node_index);

    if (!this.isDigraph) {
      // tslint:disable-next-line:prefer-for-of
      for (let i = 0; i < this._edges[idx].length; i++) {
        const edge = this._edges[idx][i];
        let removeValFromIndex = [];
        // tslint:disable-next-line:prefer-for-of
        for (let j = 0; j < this._edges[edge.to].length; ++j) {
          const element = this._edges[edge.to][j];
          if (element.to === idx) {
            removeValFromIndex.push(j);
          }
        }

        if (removeValFromIndex.length > 0) {
          removeValFromIndex = removeValFromIndex.sort((a, b) => b - a);
          while (removeValFromIndex.length) {
            this._edges[edge.to].splice(removeValFromIndex.pop(), 1);
          }
          // for (let k = removeValFromIndex.length - 1; k >= 0; --k) {
          //   this._edges[edge.to].splice(removeValFromIndex[k], 1);
          // }
        }
      }

      this._edges[idx] = [];
    } else {
      this.cullInvalidEdges();
    }
  }

  uniqueEdge(
    from: number,
    to: number): boolean {
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < this._edges[from].length; ++i) {
      const e = this._edges[from][i];
      if (e.to === to) {
        return false;
      }
    }
    return true;
  }

  setEdgeCost(
    from: number,
    to: number,
    cost: number): void {
    // make sure the nodes given are valid
    console.assert(
      from < this._nodes.length && to < this._nodes.length,
      `SparseGraph.setEdgeCost - invalid index: ${from} or ${to}`);

    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < this._edges[from].length; ++i) {
      const e = this._edges[from][i];
      if (e.to === to) {
        e.setCost(cost);
        break;
      }
    }
  }

}
