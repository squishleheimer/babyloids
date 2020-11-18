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
import { Color3, Color4, DynamicTexture, LinesMesh, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3 } from '@babylonjs/core';
import Vector from './agency/math/vector';
import Face from './agency/face';

const colours: Color4[] = [
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
    } = {},
    colour: Color4 = Color4.FromColor3(Color3.White(), alpha)): LinesMesh {

    const points = isoscelesInscribedInCircle(radius, xRatio)
      .map(p => new Vector3(p.x, 0, p.y));

    points.push(points[0].clone());

    return MeshBuilder.CreateLines(
      "arrow",
      {
        points: points,
        colors: points.map(_ => colour)
      });
  }

  static createCircleDiagnostic(
    radius: number,
    centre: Vector,
    segments: number = 12,
    {
      alpha = 0.6
    } = {}): Mesh {

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

  static createCellSpaceDiagnostic(
    face: Face,
    scene: Scene,
    surface: Mesh): Mesh[] {

    const surfaceTexture = new DynamicTexture(
      "cell_space",
      {
        width: 1024,
        height: 1024
      },
      scene,
      true,
      undefined,
      undefined,
      false);

    const surfaceMaterial = new StandardMaterial("Mat", scene);
    surfaceMaterial.diffuseTexture = surfaceTexture;
    surface.material = surfaceMaterial;

    const surfaceWidth = 
      surface.getBoundingInfo().boundingBox.maximum.x - 
      surface.getBoundingInfo().boundingBox.minimum.x;
    const surfaceHeight = 
      surface.getBoundingInfo().boundingBox.maximum.z - 
      surface.getBoundingInfo().boundingBox.minimum.z;

    const xScale = surfaceTexture.getSize().width / surfaceWidth;
    const yScale = surfaceTexture.getSize().height / surfaceHeight;

    const meshes = face.csp.cells.map((cell, idx) => {

      surfaceTexture.drawText(
        `${idx}:0`,
        (cell.BBox.centre.x - cell.BBox.width * 0.5) * xScale,
        (cell.BBox.centre.y - cell.BBox.height * 0.5) * yScale,
        "bold 24px monospace",
        "white",
        null,
        true,
        false);

      const mesh = DiagnosticFactory.createCellDiagnostic(
        cell, idx, surface, face.position);

      // mesh.onBeforeDraw()

      // if (!this.face.outOfBounds(p)) {
      //   this.cursor.updatePosition(this.cursor.position, p);
      //   const idx = this.face.csp.positionToIndex(p);
      //   console.log(`${idx}:${this.face.csp.cells[idx].members.length}`);
      //   //txt.position.set(p.x, p.y);
      //   //txt.text = `${idx}:${this.face.csp.cells[idx].members.length}`;
      // }
      
      return mesh;
    });

    surfaceTexture.update();

    return meshes;
  }

  static createCellDiagnostic(
    cell: Cell<Agent>,
    idx: number,
    surface: Mesh,
    offset: Vector): Mesh {

    const corners = cell.BBox.corners;
    corners.push(corners[0]);
    const points: Vector[] = corners.map(c => c.add(offset));
    return MeshBuilder.CreateLines(
      `cell_${idx}`,
      {
        points: points.map(c => new Vector3(c.x, 0, c.y)),
        colors: points.map(_ => Color4.FromColor3(Color3.White(), 1.0))
      });
  }

  static createWallDiagnostic(
    w: Wall,
    scene: Scene,
    normalLength: number = 10): Mesh {
    const c = w.centre();
    const d = c.add(w.N.mult(normalLength));

    const lines = [
      [new Vector3(w.A.x, 0, w.A.y),
      new Vector3(w.B.x, 0, w.A.y)
      ],
      [new Vector3(c.x, 0, c.y),
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
