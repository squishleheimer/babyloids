import { BehaviourType } from './steering';
import WallAvoidance from './wall-avoidance';
import ObstacleAvoidance from './obstacle-avoidance';
import Alignment from './alignment';
import Separation from './separation';
import Cohesion from './cohesion';
import Wander from './wander';
import FollowPath from './follow-path';
import Arrive from './arrive';
import Flee from './flee';
import Pursuit from './pursuit';
import OffsetPursuit from './offset-pursuit';
import Evade from './evade';
import Hide from './hide';
import Interpose from './interpose';

export default class SteeringFactory {
  static createSteeringBehaviour(args: any);
  static createSteeringBehaviour(args: any): WallAvoidance;
  static createSteeringBehaviour(args: any): ObstacleAvoidance;
  static createSteeringBehaviour(args: any): Alignment;
  static createSteeringBehaviour(args: any): Cohesion;
  static createSteeringBehaviour(args: any): Separation;
  static createSteeringBehaviour(args: any): Wander;
  static createSteeringBehaviour(args: any): FollowPath;
  static createSteeringBehaviour(args: any): Arrive;
  static createSteeringBehaviour(args: any): Flee;
  static createSteeringBehaviour(args: any): Pursuit;
  static createSteeringBehaviour(args: any): OffsetPursuit;
  static createSteeringBehaviour(args: any): Evade;
  static createSteeringBehaviour(args: any): Hide;
  static createSteeringBehaviour(args: any): Interpose;

  public static createSteeringBehaviour(args: any):
  WallAvoidance |
  ObstacleAvoidance |
  Alignment |
  Cohesion |
  Separation |
  Wander |
  FollowPath |
  Arrive |
  Flee |
  Pursuit |
  OffsetPursuit |
  Evade |
  Hide |
  Interpose {
    switch (args.type) {
      case BehaviourType.WallAvoidance:
        return new WallAvoidance(args.agent);
      case BehaviourType.ObstacleAvoidance:
        return new ObstacleAvoidance(args.agent);
      case BehaviourType.Alignment:
        return new Alignment(args.agent);
      case BehaviourType.Cohesion:
        return new Cohesion(args.agent);
      case BehaviourType.Alignment:
        return new Alignment(args.agent);
      case BehaviourType.Separation:
        return new Separation(args.agent);
      case BehaviourType.Wander:
        return new Wander(args.agent);
      case BehaviourType.FollowPath:
        return new FollowPath(args.agent, args.seekDistance);
      case BehaviourType.Arrive:
        return new Arrive(args.agent, args.position);
      case BehaviourType.Flee:
        return new Flee(args.agent, args.otherA);
      case BehaviourType.Pursuit:
        return new Pursuit(args.agent, args.otherA);
      case BehaviourType.OffsetPursuit:
        return new OffsetPursuit(args.agent, args.otherA, args.offset);
      case BehaviourType.Evade:
        return new Evade(args.agent, args.otherA);
      case BehaviourType.Hide:
        return new Hide(args.agent, args.otherA);
      case BehaviourType.Interpose:
        return new Interpose(args.agent, args.otherA, args.otherB);
      default:
        throw new Error(`Invalid type argument: ${args.type}`);
    }
  }
}