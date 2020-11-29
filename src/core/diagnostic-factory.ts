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
import { Color3, Color4, DynamicTexture, InstancedMesh, LinesMesh, Mesh, MeshBuilder, Scene, StandardMaterial, Texture, TransformNode, Vector3, VertexData } from '@babylonjs/core';
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
    scene: Scene,
    radius: number,
    xRatio: number = 0.75,
    {
      alpha = 0.8
    } = {}): InstancedMesh {

    let mesh: Mesh = scene.getMeshByID("arrow") as Mesh;
    if (!mesh) {
      const points = isoscelesInscribedInCircle(1.0, xRatio)
        .map(p => new Vector3(p.x, 0, p.y));
      points.push(points[0].clone());
      mesh = MeshBuilder.CreateLines(
        "arrow",
        {
          points: points,
          colors: points.map(_ => Color4.FromColor3(Color3.Gray(), alpha))
        });
    }

    const instance: InstancedMesh =
      mesh.createInstance(`arrow_${mesh.instances.length}`);

    instance.scaling.set(
      radius,
      radius,
      radius);

    return instance;
  }

  static createBoidDiagnostic(
    scene: Scene,
    radius: number,
    xRatio: number = 0.75,
    {
      alpha = 1.0
    } = {},
    colour: Color4 = Color4.FromColor3(Color3.White(), alpha)): Mesh {

    const points = isoscelesInscribedInCircle(radius, xRatio)
      .map(p => new Vector3(p.x, 0, p.y));

    points.push(
      Vector3.FromArray(
        points[1].add(points[2])
          .asArray()
          .map((_, i) => i === 1 ? radius * xRatio : _ / 2.0))
    );

    const positions = [];
    points.forEach((p, i) => points[i].toArray(positions, 0 + i * 3));
    var indices = [
      0, 2, 1,
      0, 1, 3,
      0, 3, 2,
      3, 1, 2,
    ];

    let normals = [];
    VertexData.ComputeNormals(positions, indices, normals);

    const mesh = new Mesh("boid", scene);
    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.applyToMesh(mesh);

    mesh.material = new StandardMaterial("boid_mat", scene);
    mesh.registerInstancedBuffer("color", 4); // 4 is the stride size eg. 4 floats here
    mesh.instancedBuffers.color = colour;
    mesh.isVisible = false;

    return mesh;
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
        colors: points.map(_ => Color3.Gray().toColor4(alpha))
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
          count === 0 ? `${idx}` : text,
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
    offset: Vector,
    {
      alpha = 0.6
    } = {}): Mesh {

    const corners = cell.BBox.corners;
    corners.push(corners[0]);
    const points: Vector[] = corners.map(c => c.add(offset));
    return MeshBuilder.CreateLines(
      `cell_${idx}`,
      {
        points: points.map(c => new Vector3(c.x, 0, c.y)),
        colors: points.map(_ => Color4.FromColor3(Color3.Black(), alpha))
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

  static createGraphDiagnostic(
    graph: NavGraph,
    scene: Scene,
    {
      node = false,
      line = true,
      head = true,
      nodeRadius = 0.2,
      headRadius = 0.8,
      headXRatio = 0.92,
      nodeAlpha = 0.25,
      lineAlpha = 0.1,
      headAlpha = 0.25

    } = {}): void {

    let g: Mesh = scene.getMeshByID("node") as Mesh;
    if (!g) {
      g = MeshBuilder.CreateIcoSphere(
        "node",
        {
          radius: 1.0,
        },
        scene
      );
      g.setEnabled(false);
    }

    const lines = new Array<Array<Vector3>>();

    for (let i = 0; i < graph.numNodes; ++i) {
      if (node) {
        const n = graph.getNode(i);

        const instance: InstancedMesh = g.createInstance(`node_${g.instances.length}`);

        instance.position.set(
          n.position.x,
          0,
          n.position.y);

        instance.scaling.set(
          nodeRadius,
          nodeRadius,
          nodeRadius);
      }

      if (line || head) {
        const edgeList = graph.getEdgeList(i);
        for (const e of edgeList) {
          const from = graph.getNode(e.from);
          const to = graph.getNode(e.to);
          if (line) {
            lines.push(
              [
                new Vector3(from.position.x, 0, from.position.y),
                new Vector3(to.position.x, 0, to.position.y)
              ]);
          }
          if (head) {
            const arrow = this.createArrowDiagnostic(
              scene,
              headRadius,
              headXRatio,
              { alpha: headAlpha });
            const p = to.position.sub(from.position);
            const l = p.length;
            const q = from.position.add(p.mult(
              1.0 - (headRadius / l)
            ));
            arrow.position.set(q.x, 0, q.y);
            arrow.rotation.set(0, -p.angle, 0);
          }
        }
      }
    }

    MeshBuilder.CreateLineSystem(
      `graph_x`,
      {
        lines: lines,
        colors: lines.map(_ => {
          return new Array<Color4>(..._.map(_ => Color3.Gray().toColor4(lineAlpha)))
        })
      },
      scene);
  }
}
