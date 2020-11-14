import { InstancedMesh, Mesh, TransformNode, Vector3 } from '@babylonjs/core';
import Agent from './agency/agent';
import Face from './agency/face';
import Vector from './agency/math/vector';

export default class Boid extends Agent {

  g: TransformNode;

  public sprotate: boolean = true;

  constructor(
    radius: number,
    face: Face,
    p: Vector,
    private rotationOffset = 0.0) {
    super(radius, face, p);
    this.resetEvent.on(_ => {
      if (this.g) {
        this.updateGraphics();
      }
    });
  }

  public updateGraphics(): void {
    if (this.g) {
      if (this.sprotate === true) {
        this.g.rotation.y = -this.heading.angle + this.rotationOffset;
      }
      this.g.position.x = this.position.x;
      this.g.position.z = this.position.y;
    }
  }

  public get enabled(): boolean {
    return true; // return (this.g) ? this.g.alpha > 0 : false;
  }
}
