import Wall from './agency/steering/wall';
import Agent from './agency/agent';
import CellSpacePartition from './agency/math/cell-space-partition';
import { isoscelesInscribedInCircle } from './agency/math/geometry';
import PixiObstacle from './pixi-obstacle';
import Wander from './agency/steering/wander';
import ObstacleAvoidance from './agency/steering/obstacle-avoidance';
import WallAvoidance from './agency/steering/wall-avoidance';
import Path from './agency/steering/path';
import { NavGraph } from './agency/math/graph/handy-graph-functions';
import { BehaviourType } from './agency/steering/steering';
import FollowPath from './agency/steering/follow-path';
import { NodeIterator } from './agency/math/graph/sparse-graph';
import { Color3, Color4, LinesMesh, MeshBuilder, Vector3 } from '@babylonjs/core';

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
    segments: number = 0.75,
    {
      alpha = 0.6
    } = {}): LinesMesh {
      
    const points = isoscelesInscribedInCircle(radius, xRatio)
          .map(p => new Vector3(p.x, 0, p.y));

    points.push(points[0].clone());

    return MeshBuilder.CreateLines(
      "arrow",
      {
        points: points
      });
  }
}
