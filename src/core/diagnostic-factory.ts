import Wall from './agency/steering/wall';
import Agent from './agency/agent';
import CellSpacePartition, { Cell } from './agency/math/cell-space-partition';
import { createCircleVertices, isoscelesInscribedInCircle } from './agency/math/geometry';
import Obstacle from './obstacle';
import Wander from './agency/steering/wander';
import ObstacleAvoidance from './agency/steering/obstacle-avoidance';
import WallAvoidance from './agency/steering/wall-avoidance';
import Path from './agency/steering/path';
import { NavGraph } from './agency/math/graph/handy-graph-functions';
import { BehaviourType } from './agency/steering/steering';
import FollowPath from './agency/steering/follow-path';
import { NodeIterator } from './agency/math/graph/sparse-graph';
import { Color3, Color4, LinesMesh, MeshBuilder, Scene, Vector3 } from '@babylonjs/core';
import Vector from './agency/math/vector';
import Face from './agency/face';

const colours:Color4[] = [
  Color4.FromColor3(Color3.Blue(), 1.0),
  Color4.FromColor3(Color3.Red(), 1.0),
  Color4.FromColor3(Color3.Green(), 1.0),
  Color4.FromColor3(Color3.White(), 1.0),
  Color4.FromColor3(Color3.Yellow(), 1.0),
  Color4.FromColor3(Color3.Black(), 1.0)
];

export default class DiagnosticFactory {

  static createArrowDiagnostic(
    radius: number,
    xRatio: number = 0.75,
    {
      alpha = 1.0
    } = {}): LinesMesh {
      
    const points = isoscelesInscribedInCircle(radius, xRatio)
          .map(p => new Vector3(p.x, 0, p.y));

    points.push(points[0].clone());
    
    return MeshBuilder.CreateLines(
      "arrow",
      {
        points: points,
        colors: points.map(_ => Color4.FromColor3(Color3.Black(), alpha))
      });
  }

  static createCircleDiagnostic(
    radius: number,
    centre: Vector,
    segments: number = 12,
    {
      alpha = 0.6
    } = {}): LinesMesh {
      
    const points = createCircleVertices(
      radius,
      centre,
      Math.PI / segments)
        .map(p => new Vector3(p.x, 0, p.y));

    return MeshBuilder.CreateLines(
      "circle",
      {
        points: points,
        colors: points.map(_ => Color4.FromColor3(Color3.Black(), alpha))
      });
  }

  static createCellSpaceDiagnostic(face: Face): LinesMesh[] {
    return face.csp.cells.map((cell, idx) => {
      return DiagnosticFactory.createCellDiagnostic(cell, idx, face.position);
    });
  }

  static createCellDiagnostic(
    cell: Cell<Agent>,
    idx: number, 
    offset: Vector): LinesMesh {
    // const c = new PIXI.Container();
    // const t = new PIXI.Text(
    //   `${idx}`,
    //   DiagnosticFactory.createTextStyle(14));
    // t.anchor.set(0.5);
    // c.addChild(t);
    // t.setTransform(
    //   cell.BBox.centre.x,
    //   cell.BBox.centre.y);
    // const b = new PIXI.Graphics()
    //   .clear()
    //   .lineStyle(1, 0x000000, 0.1)
    //   .beginFill(0xff00ff, 0.0)
    //   .drawRect(
    //     cell.BBox.bottomLeft.x,
    //     cell.BBox.bottomLeft.y,
    //     cell.BBox.right - cell.BBox.left,
    //     cell.BBox.bottom - cell.BBox.top
    //   )
    //   .endFill();
    // c.addChild(b);
    // return c;
    const corners = cell.BBox.corners;
    corners.push(corners[0]);
    const points: Vector[] = corners.map(c => c.add(offset));
    return MeshBuilder.CreateLines(
      `cell_${idx}`,
      {
        points: points.map(c => new Vector3(c.x, 0, c.y)),
        colors: points.map(_ => Color4.FromColor3(Color3.Black(), 1.0))
      });
  }

  static createTextStyle(fSize: number = 10): any {
    return {
      fontFamily : 'Fira Code',
      fontSize: fSize,
      fill : 0x555555,
      align : 'center'
    };
  }

  static createWallDiagnostic(
    w: Wall,
    scene: Scene,
    normalLength: number = 10): LinesMesh {
    const c = w.centre();
    const d = c.add(w.N.mult(normalLength));

    const lines = [
      [	new Vector3(w.A.x, 0, w.A.y),
        new Vector3(w.B.x, 0, w.A.y)
      ],
      [	new Vector3(c.x, 0, c.y),
        new Vector3(d.x, 0, d.y)
      ]
    ];
    
    return MeshBuilder.CreateLineSystem(
      `wall_${w}`,
      {
        lines: lines
      },
      scene);
  }
}
