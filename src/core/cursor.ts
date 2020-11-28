import { TransformNode } from '@babylonjs/core';

import Vector from './agency/math/vector';
import Entity from './agency/steering/entity';
import Smoother from './agency/math/smoother';

export default class Cursor extends Entity {

  g: TransformNode;

  public speedFactor = 40;
  maxSpeed = 2000;

  private smoother = new Smoother();

  constructor(
    radius: number
    ) {
    super(radius, Vector.ZERO);
    const gUp = (_: Entity) => {
      if (this.g) {
        this.updateGraphics();
      }
    };
    this.resetEvent.on(gUp);
    this.updateEvent.on(gUp);
  }

  public asyncUpdate(newPos: Vector, oldPos: Vector = this.position): Promise<void> {
    return new Promise((resolve, reject) => {
      this.updatePosition(oldPos, newPos);
    });
  }
  
  public updatePosition(oldPos: Vector, newPos: Vector): void {
    if (newPos) {
      if (oldPos) {
        this._velocity = this.smoother.update(
          newPos.sub(oldPos).mult(this.speedFactor));
        this._velocity.truncate(this.maxSpeed);
      }
      this.position.set(newPos);
      this.updateEvent.trigger(this);
    }
  }

  public updateGraphics(): void {
    if (this.g) {
      this.g.position.x = this.position.x;
      this.g.position.z = this.position.y;
      this.g.scaling.set(this.radius, this.radius, this.radius);
      // this.g
      //   .clear()
      //   .lineStyle(1, 0xFFFFFF, 1)
      //   .beginFill(0xff00ff, 0.2)
      //   .drawCircle(
      //     this.position.x,
      //     this.position.y,
      //     this.radius)
      //   .endFill()
      //   .moveTo(
      //     this.position.x,
      //     this.position.y)
      //   .lineTo(
      //     this.position.x + this.velocity.x,
      //     this.position.y + this.velocity.y);
    }
  }

  public get enabled(): boolean {
    return this.g.isEnabled(); // return (this.g) ? this.g.alpha > 0 : false;
  }

}
