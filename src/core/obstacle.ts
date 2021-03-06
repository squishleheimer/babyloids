import { Mesh } from '@babylonjs/core';

import Vector from './agency/math/vector';
import Entity from './agency/steering/entity';

export default class Obstacle extends Entity {

  g: Mesh;

  constructor(radius: number, position: Vector) {
    super(radius, position);
    const gUp = (_: Entity) => {
      if (this.g) {
        this.updateGraphics();
      }
    };
    this.resetEvent.on(gUp);
    this.updateEvent.on(gUp);
  }

  public updatePosition(_: Vector, newPos: Vector): void {
    this.position.set(newPos);
    this.updateEvent.trigger(this);
  }

  public updateGraphics(): void {
    if (this.g) {
      this.g.position.set(
        this.position.x,
        0,
        this.position.y);
    }
  }

  public get enabled(): boolean {
    return (this.g) ? this.g.visibility > 0 : false;
  }

}
