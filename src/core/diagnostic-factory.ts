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
import { Color3, Color4, DynamicTexture, LinesMesh, Mesh, MeshBuilder, Scene, StandardMaterial, Texture, Vector3 } from '@babylonjs/core';
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
      alpha = 0.4
    } = {},
    colour: Color4 = Color4.FromColor3(Color3.White(), alpha)): LinesMesh {

    const points = isoscelesInscribedInCircle(radius, xRatio)
      .map(p => new Vector3(p.x, 0, p.y));

    points.push(points[0]);    

    // points.push(points[0]);
    // points.push(points[1]);
    // points.push(apex);
    // points.push(points[0]);

    points.push(
      Vector3.FromArray(
        points[1].add(points[2])
        .asArray()
        .map((_,i) => i === 1 ? radius * xRatio : _ / 2.0))
    );
    points.push(points[1]);
    points.push(points[2]);
    points.push(points[4]);

    // points.push(points[2]);
    // points.push(points[0]);
    // points.push(apex);
    // points.push(points[2]);

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
    segments: number = 18,
    {
      alpha = 0.6,
      heightOffset = 0
    } = {}): Mesh {

    const points = createCircleVertices(
      radius,
      centre,
      Math.PI / segments)
      .map(p => new Vector3(p.x, heightOffset, p.y));

    return MeshBuilder.CreateLines(
      "circle",
      {
        points: points,
        colors: points.map(_ => Color3.Black().toColor4(alpha))
      });
  }

  static createCellSpaceDiagnostic(
    face: Face,
    scene: Scene,
    {
      textColor = "white",
      bgColor = "transparent",
      textureWidth = 512,
      textureHeight = 512,
      alpha: materialAlpha = 1.0,
      heightOffset = 0.1
    } = {}): Mesh[] {

    const meshes = face.csp.cells.map((cell, idx) => {
      
      const mesh = MeshBuilder.CreateGround(
        `cell_${idx}`,
        {
          width: cell.BBox.width,
          height: cell.BBox.height
        }, scene);

      DiagnosticFactory.createCellDiagnostic(
        cell, idx, face.position)
        .position.y = heightOffset;

      mesh.position.x = cell.BBox.centre.x;
      mesh.position.z = cell.BBox.centre.y;
      mesh.position.y = heightOffset;

      const cellTexture = new DynamicTexture(
        `cell_tex_${idx}`,
        {
          width: textureWidth,
          height: textureHeight
        },
        scene,
        true);

      const cellMaterial = new StandardMaterial(
        `cell_mat_${idx}`, 
        scene);
      
      cellMaterial.diffuseTexture = cellTexture;
      cellMaterial.diffuseTexture.hasAlpha = true;
      cellMaterial.alpha = materialAlpha;

      mesh.material = cellMaterial;

      // const cellWidth = 
      //   mesh.getBoundingInfo().boundingBox.maximum.z - 
      //   mesh.getBoundingInfo().boundingBox.minimum.z;

      const cellHeight = 
        mesh.getBoundingInfo().boundingBox.maximum.z - 
        mesh.getBoundingInfo().boundingBox.minimum.z;

      //const xScale = cellTexture.getSize().width / cellWidth;
      const yScale = cellTexture.getSize().height / cellHeight;
      
      const ctx = cellTexture.getContext();

      const draw = () => {
        const count = face.csp.cells[idx].members.length;
        const text = `${idx}:${count}`;
        ctx.clearRect(0, 0, textureWidth, textureHeight);
        cellTexture.drawText(
          count === 0 ? `${idx}`: text,
          0,
          cellHeight * yScale,
          count === 0 ? "24px monospace" : "bold 44px monospace",
          textColor,
          bgColor,
          true,
          true);
      };

      mesh.onBeforeRenderObservable.add(draw);

      return mesh;
    });

    return meshes;
  }

  static createCellDiagnostic(
    cell: Cell<Agent>,
    idx: number,
    offset: Vector): Mesh {

    const corners = cell.BBox.corners;
    corners.push(corners[0]);
    const points: Vector[] = corners.map(c => c.add(offset));
    return MeshBuilder.CreateLines(
      `cell_${idx}`,
      {
        points: points.map(c => new Vector3(c.x, 0, c.y)),
        colors: points.map(_ => Color3.White().toColor4())
      });
  }

  static createWallDiagnostic(
    w: Wall,
    idx: number,
    scene: Scene,
    normalLength: number = 10): Mesh {
    
    const c = w.centre();
    const d = c.add(w.N.mult(normalLength));

    return MeshBuilder.CreateLineSystem(
      `wall_${idx}`,
      {
        lines: [
          [new Vector3(w.A.x, 0, w.A.y),
          new Vector3(w.B.x, 0, w.B.y)
          ],
          [new Vector3(c.x, 0, c.y),
          new Vector3(d.x, 0, d.y)
          ]
        ]
      },
      scene);
  }
}
