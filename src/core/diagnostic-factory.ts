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
    surface: Mesh,
    {
      textColor = "white",
      bgColor = "gray",
    } = {}): Mesh[] {

    //surface.setEnabled(false);

    // const surfaceTexture = new DynamicTexture(
    //   "cell_space",
    //   {
    //     width: 64,
    //     height: 64
    //   },
    //   scene,
    //   true,
    //   Texture.TRILINEAR_SAMPLINGMODE);

    // const surfaceMaterial = new StandardMaterial("Mat", scene);
    // surfaceMaterial.diffuseTexture = surfaceTexture;
    //surface.material = surfaceMaterial;

    const surfaceWidth = 
      surface.getBoundingInfo().boundingBox.maximum.x - 
      surface.getBoundingInfo().boundingBox.minimum.x;
    const surfaceHeight = 
      surface.getBoundingInfo().boundingBox.maximum.z - 
      surface.getBoundingInfo().boundingBox.minimum.z;

    const mat = new StandardMaterial(
      `cell_mat`, 
      scene);

    mat.diffuseColor = new Color3(1, 0, 1);
    mat.specularColor = new Color3(0.5, 0.6, 0.87);
    mat.emissiveColor = new Color3(1, 1, 1);
    mat.ambientColor = new Color3(0.23, 0.98, 0.53);
    mat.alpha = 0.0;

    surface.material = mat;

    const meshes = face.csp.cells.map((cell, idx) => {
      
      const mesh = MeshBuilder.CreateGround(
        `cell_${idx}`,
        {
          width: Math.abs(cell.BBox.width),
          height: Math.abs(cell.BBox.height),
          updatable: true
        }, scene);
      
      // const mesh = DiagnosticFactory.createCellDiagnostic(
      //   cell, idx, surface, face.position);

      DiagnosticFactory.createCellDiagnostic(
        cell, idx, surface, face.position);

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

      const draw = () => {
        const text = `${idx}:${face.csp.cells[idx].members.length}`;
        cellTexture.drawText(
          text,
          0,//(cell.BBox.centre.x - cell.BBox.width * 0.5),
          cell.BBox.height,//((surfaceHeight - cell.BBox.centre.y) - cell.BBox.height * 0.5) * yScale,
          "bold 24px monospace",
          textColor,
          bgColor,//idx === 0 ? bgColor : null,
          true,
          true);
      };

      mesh.onBeforeRenderObservable.add(draw);

      return mesh;
    });

    //surfaceTexture.update();

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
