import { AgentState } from './agency/agent';
import { clamp } from './agency/math/random';
import Vector from './agency/math/vector';
import Boid from './boid';
import FollowPath from './agency/steering/follow-path';
import { BehaviourType } from './agency/steering/steering';
import Arrive from './agency/steering/arrive';

export class Asleep extends AgentState {
  enter(a: Boid): void {
    a.steering.enabled = false;
    a.g.alpha = 0;
  }
}
export class DozingOff extends AgentState {
  opacity = 1.0;
  enter(a: Boid): void {
    a.g.alpha = this.opacity;
  }
  execute(a: Boid): void {
    if (this.opacity > 0) {
      this.opacity -= 0.01;
    } else {
      a.fsm.transitionTo(new Asleep());
      a.steering.enabled = false;
    }
    a.g.alpha = clamp(this.opacity);
  }
}
export class Awake extends AgentState {
  enter(a: Boid): void {
    a.steering.enabled = true;
    a.g.alpha = 1.0;
    a.direction = Vector.randomUnit().clone();
    a.smoother.reset();
  }
}
export class Waking extends AgentState {
  opacity = 0.0;
  enter(a: Boid): void {
    a.g.alpha = this.opacity;
  }
  execute(a: Boid): void {
    if (this.opacity < 1.0) {
      this.opacity += 0.01;
    } else {
      a.fsm.transitionTo(new Awake());
    }
    a.g.alpha = clamp(this.opacity);
  }
}
export class Reset extends AgentState {
  constructor() {
    super();
  }
  execute(a: Boid): void {
    if (a.steering.isOn(BehaviourType.FollowPath)) {
      const fp = a.steering.getBehaviourByType(
        BehaviourType.FollowPath) as FollowPath;
      if (fp && a.steering.path.finished && a.speed < 1.0) {
        a.reset(a.position);
        a.g.alpha = 0;
        a.fsm.transitionTo(new Asleep());
      }
    }
    if (a.face.outOfBounds(a.position)) {
      a.reset(a.origin);
      a.g.alpha = 0;
      a.fsm.transitionTo(new Asleep());
    }
  }
}
