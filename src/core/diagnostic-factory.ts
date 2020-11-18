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
    segments: number = 18,
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
    surface: Mesh,
    {
      textColor = "white",
      bgColor = "gray",
    } = {}): Mesh[] {

    const mat = new StandardMaterial(
      `cell_mat`, 
      scene);
    mat.alpha = 0.0;
    surface.material = mat;

    const meshes = face.csp.cells.map((cell, idx) => {
      
      const mesh = MeshBuilder.CreateGround(
        `cell_${idx}`,
        {
          width: cell.BBox.width,
          height: cell.BBox.height
        }, scene);

      DiagnosticFactory.createCellDiagnostic(
        cell, idx, face.position);

      mesh.position.x = cell.BBox.centre.x;
      mesh.position.z = cell.BBox.centre.y;

      const cellMaterial = new StandardMaterial(
        `cell_mat_${idx}`, 
        scene);

      cellMaterial.diffuseColor = new Color3(1, 0, 1);
      cellMaterial.specularColor = new Color3(0.5, 0.6, 0.87);
      cellMaterial.emissiveColor = new Color3(1, 1, 1);
      cellMaterial.ambientColor = new Color3(0.23, 0.98, 0.53);

      const cellTexture = new DynamicTexture(
        `cell_tex_${idx}`,
        {
          width: 512,
          height: 512
        },
        scene,
        true);

      cellMaterial.diffuseTexture = cellTexture;

      mesh.material = cellMaterial;

      // const cellWidth = 
      //   mesh.getBoundingInfo().boundingBox.maximum.z - 
      //   mesh.getBoundingInfo().boundingBox.minimum.z;

      const cellHeight = 
        mesh.getBoundingInfo().boundingBox.maximum.z - 
        mesh.getBoundingInfo().boundingBox.minimum.z;

      //const xScale = cellTexture.getSize().width / cellWidth;
      const yScale = cellTexture.getSize().height / cellHeight;

      const draw = () => {
        const count = face.csp.cells[idx].members.length;
        const text = `${idx}:${count}`;
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
        colors: points.map(_ => Color4.FromColor3(Color3.White(), 1.0))
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
