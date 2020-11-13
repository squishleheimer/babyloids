import SparseGraph, { EdgeIterator } from './sparse-graph';
import { NavGraphEdge } from './graph-edge-types';
import { NavGraphNode } from './graph-node-types';
import Vector from '../vector';

export class NavGraph extends
  SparseGraph<NavGraphNode<any>, NavGraphEdge> {
}

export function validNeighbour(
  x: number,
  y: number,
  numCellsX: number,
  numCellsY: number): boolean {
  return !(x < 0 || x >= numCellsX || y < 0 || y >= numCellsY);
}

export function addAllNeighboursToSquareGridNode(
  g: NavGraph,
  row: number,
  col: number,
  numCellsX: number,
  numCellsY: number): void {
  for (let i = -1; i <= 1; ++i) {
    for (let j = -1; j <= 1; ++j) {
      const nodeX = col + j;
      const nodeY = row + i;

      if (i === 0 && j === 0) { continue; }

      if (validNeighbour(nodeX, nodeY, numCellsX, numCellsY)) {
        const posNode: Vector = g.getNode(row * numCellsX + col).position;
        const posNeig: Vector = g.getNode(nodeY * numCellsX + nodeX).position;

        const d: number = posNode.sub(posNeig).length;

        g.addEdge(
          new NavGraphEdge(
            row * numCellsX + col,
            nodeY * numCellsX + nodeX,
            d)
        );

        // if graph is not a diagraph then an edge needs to be added going
        // in the other direction
        if (!g.isDigraph) {
          g.addEdge(
            new NavGraphEdge(
              nodeY * numCellsX + nodeX,
              row * numCellsX + col,
              d)
          );
        }
      }
    }
  }
}

export function addAllNeighboursToTriangleGridNode(
  g: NavGraph,
  row: number,
  col: number,
  numCellsX: number,
  numCellsY: number): void {
  for (let i = -1; i <= 1; ++i) {
    for (let j = -1; j <= 1; ++j) {
      const nodeX = col + j;
      const nodeY = row + i;

      // if (i === 0 && j === 0) { continue; }

      if (validNeighbour(nodeX, nodeY, numCellsX, numCellsY)) {
        const posNode: Vector = g.getNode(row * numCellsX + col).position;
        const posNeig: Vector = g.getNode(nodeY * numCellsX + nodeX).position;

        const d: number = posNode.sub(posNeig).length;

        g.addEdge(
          new NavGraphEdge(
            row * numCellsX + col,
            nodeY * numCellsX + nodeX,
            d)
        );

        // if graph is not a diagraph then an edge needs to be added going
        // in the other direction
        if (!g.isDigraph) {
          g.addEdge(
            new NavGraphEdge(
              nodeY * numCellsX + nodeX,
              row * numCellsX + col,
              d)
          );
        }
      }
    }
  }
}

export function createTriangleGrid(
  g: NavGraph,
  cSize: number,
  numCells: number,
  offset: Vector = Vector.ZERO
): void {

  // need some temporaries to help calculate each node center
  const rootTwo = Math.sqrt(2);
  const oneOnRootTwo = 1 / rootTwo;

  const cellWidth = cSize / numCells;
  const cellHeight = (1 - oneOnRootTwo) * cellWidth;

  const midX = cellWidth / 2.0;
  const midY = cellHeight / 2.0;

  const numCellsX = numCells;
  const numCellsY = Math.floor(cSize / cellHeight);

  // first create all the nodes
  for (let row = 0; row < numCellsY; ++row) {
    for (let col = 0; col < numCellsX; ++col) {
      let x = midX + (col * cellWidth);
      const y = midY + (row * cellHeight);

      if (row % 2) {
        x += midX;
      }

      g.addNode(
        new NavGraphNode<any>(
          g.nextFreeNodeIndex,
          offset.add(
            new Vector(
              x,
              y)))
      );

    }
  }
  // now to calculate the edges. (A position in a 2d array [x][y] is the
  // same as [y * NumCellsX + x] in a 1d array). Each cell has up to eight
  // neighbours.
  for (let row = 0; row < numCellsY; ++row) {
    for (let col = 0; col < numCellsX; ++col) {
      addAllNeighboursToTriangleGridNode(
        g, row, col, numCellsX, numCellsY);
    }
  }
}

export function createSquareGrid(
  g: NavGraph,
  cySize: number,
  cxSize: number,
  numCellsX: number,
  numCellsY: number,
  offset: Vector = Vector.ZERO
): void {

  // need some temporaries to help calculate each node center
  const cellWidth = cySize / numCellsX;
  const cellHeight = cxSize / numCellsY;

  const midX = cellWidth / 2.0;
  const midY = cellHeight / 2.0;

  // first create all the nodes
  for (let row = 0; row < numCellsY; ++row) {
    for (let col = 0; col < numCellsX; ++col) {
      g.addNode(
        new NavGraphNode<any>(
          g.nextFreeNodeIndex,
          offset.add(
            new Vector(
              midX + (col * cellWidth),
              midY + (row * cellHeight))))
      );
    }
  }

  // first create all the nodes
  for (let row = 0; row < numCellsY; ++row) {
    for (let col = 0; col < numCellsX; ++col) {
      addAllNeighboursToSquareGridNode(
        g, row, col, numCellsX, numCellsY);
    }
  }
}

export function weightNavGraphNodeEdges(
  g: NavGraph,
  idx: number,
  weight: number
): void {
  console.assert(idx < g.numNodes);
  const edgeItr = new EdgeIterator(g, idx);
  for (let e = edgeItr.begin(); !e.done; e = edgeItr.next()) {
    const d = g.getNode(e.value.from).position.sub(
      g.getNode(e.value.to).position).length;

    g.setEdgeCost(
      e.value.from,
      e.value.to,
      d * weight
    );

    // if not a digraph, set the cost of the parallel edge to be the same
    if (!g.isDigraph) {
      g.setEdgeCost(
        e.value.to,
        e.value.from,
        d * weight
      );
    }
  }
}
