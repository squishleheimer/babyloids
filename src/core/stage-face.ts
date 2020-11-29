import { Scene, Mesh, TransformNode, Color3, InstancedMesh, AbstractMesh, LinesMesh, Plane, Vector3, Epsilon, ActionManager, ExecuteCodeAction, PointerEventTypes, BoundingBox, StandardMaterial, VertexBuffer, BoxBuilder, KeyboardInfo, PointerInfo, Color4 } from '@babylonjs/core';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';

import Face from './agency/face';
import Agent from './agency/agent';
import Boid from './boid';
import Vector from './agency/math/vector';
import Steering, { BehaviourType } from './agency/steering/steering';
import { Waking, DozingOff, Asleep, Reset, Awake } from './states';
import { clamp, randInRange, randomIntFromInterval } from './agency/math/random';
import Obstacle from './obstacle';
import Cursor from './cursor';
import { createInwardRectWalls } from './agency/steering/wall';
import SteeringFactory from './agency/steering/factory';
import Entity from './agency/steering/entity';
import DiagnosticFactory from './diagnostic-factory';

export class StageFace {

  private readonly MAX_AGENTS = 500;

  public face: Face;

  diagnostics = [];

  plane: Mesh;
  cursor: Cursor = new Cursor(5.0);
  nodeDiagnostic: any = null;
  bAddAgent = false;
  private boidRadius = 0.5;//randomIntFromInterval(1.0, 6.0);
  private boidColor: Color3 = Color3.White();

  timePassed = 0;
  timeFactor: number = 1.0;

  constructor(
    public scene: Scene,
    width: number,
    height: number
  ) {
    this.init(
      width,
      height
    );
  }

  clearDiagnostics() {
    // this.scene.removeChild(...this.diagnostics);
  }

  addDiagnostics() {
    // this.scene.addChild(...this.diagnostics);
  }

  addAgent(radius: number = 1.0, p: Vector = Vector.ZERO): Agent {
    if (p &&
      this.face.numberOfFacets() < this.MAX_AGENTS &&
      !this.face.outOfBounds(p)) {
      return this.face.addAgent(
        new Boid(radius, this.face, p));
    }
  }

  poke() {
    const sleepers = this.face.facets.filter(a =>
      a.fsm.currentState instanceof Asleep);
    if (sleepers.length > 0) {
      const a: Agent =
        sleepers[randomIntFromInterval(0, sleepers.length - 1)];
      a.fsm.setGlobalState(new Reset());
      a.fsm.transitionTo(new Waking());
    }
  }

  awaken() {
    this.face.facets
      .filter(a => a.fsm.currentState instanceof Asleep)
      .forEach(a => {
        a.fsm.setGlobalState(new Reset());
        a.fsm.transitionTo(new Waking());
      });
  }

  enslumber() {
    this.face.facets
      .filter(a => a.fsm.currentState instanceof Awake)
      .forEach(a => a.fsm.transitionTo(new DozingOff()));
  }

  init(
    w: number,
    h: number): void {

    this.cursor.g = DiagnosticFactory.createCircleDiagnostic(
      1.0,
      this.cursor.position
    );

    this.scene.onKeyboardObservable.add((key, state) => {
      // console.log(`code:${key.event.code},ctrl:${key.event.ctrlKey}`);
      const DISP = 0.02;
      let factor: number = this.timeFactor;

      if (key.event.key === 'q') {
        //this.cursor.g.setEnabled(key.event.ctrlKey);
      }
      if (key.event.key === 's') {
        factor = 0;
      }
      if (key.event.key === 'f') {
        factor = 1.0;
      }
      if (key.event.key === 'a') {
        factor = this.timeFactor - DISP;
      }
      if (key.event.key === 'd') {
        factor = this.timeFactor + DISP;
      }
      this.timeFactor = factor;// clamp(factor, 0, 5.0, false);
    });

    this.scene.onPointerObservable.add((pointer) => {
      if (pointer.pickInfo.hit === true) {
        const p: Vector = new Vector(
          pointer.pickInfo.pickedPoint.x,
          pointer.pickInfo.pickedPoint.z);
        if (!this.face.outOfBounds(p)) {
          this.cursor.asyncUpdate(p);
        }
        switch (pointer.type) {
          case PointerEventTypes.POINTERMOVE:
            break;
          case PointerEventTypes.POINTERWHEEL:
            const wheelEvent = pointer.event as WheelEvent;
            const delta = wheelEvent.deltaY * 0.005;
            this.cursor.radius = clamp(
              this.cursor.radius + delta, 0.1, 200, false);
            this.boidRadius = this.cursor.radius * 0.1;
            break;
        }
      }
    });

    this.face = new Face(
      Vector.ZERO.clone(),
      new Vector(w, h),
      this.MAX_AGENTS,
      {
        cellSpaceSize: 5,
        nonPenetrationEnabled: true
      });

    // Our built-in 'ground' shape.
    this.plane = this.createGround(w, h);

    // WALLS
    this.face.addWall(
      ...createInwardRectWalls(this.face.rect, this.face.position));

    this.face.walls.forEach((wall, idx) => {
      return DiagnosticFactory.createWallDiagnostic(wall, idx, this.scene);
    });

    DiagnosticFactory.createCellSpaceDiagnostic(
      this.face,
      this.scene).forEach(mesh => {
        mesh.isPickable = false;
      });

    DiagnosticFactory.createGraphDiagnostic(
      this.face.graph,
      this.scene,
      {
        node: false,
        head: false,
        line: true
      });

    // this.nodeDiagnostic = DiagnosticFactory.createNodeDiagnostic(
    //   this.face.graph, { });
    // this.stage.addChild(this.nodeDiagnostic.g);
    this.face.graph.isDirty = true;

    // AGENTS
    const boid = DiagnosticFactory.createBoidDiagnostic(
      this.scene,
      1.0);

    this.face.addObstacle(this.cursor);

    this.face.onAdd = (a: Boid) => {
      this.addAsync(a).then(_ => {
        // console.log(`added:${a.id}`);
      });
    };

    this.addDiagnostics();
  }

  private async addAsync(a: Boid): Promise<void> {
    return this.addBoid(a);
  }

  private addBehaviours(a: Boid, behaviours: BehaviourType[]): void {
    const otherA = this.face.getRandomOther(a);
    const otherB = this.face.getRandomOther(a);
    a.steering.addBehaviour(true, ...behaviours.map(b => {
      return SteeringFactory.createSteeringBehaviour({
        type: b,
        agent: a,
        seekDistance: a.steering.viewDistance,
        position: this.cursor.position,
        otherA,
        otherB,
        offset: Vector.randomUnit().mult(a.radius * 3)
      });
    }));
  }

  private addBoid(a: Boid): void {
    const m: Mesh = this.scene.getMeshByID("boid") as Mesh;
    if (m) {
      const instance = m.createInstance(`boid_${this.face.facets.length}`);
      instance.instancedBuffers.color = this.boidColor.toColor4();
      a.g = instance;
      a.updateEvent.on(_ => {
        a.g.position.y = 0.1;
      });
    } else {
      return;
    }

    a.steering.viewDistance = Math.max(this.face.csp.rect.x, this.face.csp.rect.y) * 0.5;
    a.steering.cellSpaceEnabled = true;

    const followers = [
      BehaviourType.FollowPath,
    ];

    const flockers = [
      BehaviourType.WallAvoidance,
      BehaviourType.Alignment,
      BehaviourType.Cohesion,
      BehaviourType.Separation,
      BehaviourType.Wander,
    ]

    this.addBehaviours(a, a.id % 2 === 0 ? flockers : followers);

    // if (this.face.facets.length === 3) {
    //   a.steering.addBehaviour(true,
    //     new Interpose(a,
    //       this.face.facets[0],
    //       this.face.facets[1]));
    //   a.g.tint = 0x0000FF;
    // }

    // const wd = DiagnosticFactory.createWanderDiagnostic(a,
    //   a.steering.getBehaviourByType(BehaviourType.Wander) as Wander);
    // this.stage.addChild(wd.g);
    // const oad = DiagnosticFactory.createObstacleAvoidanceDiagnostic(a,
    //   a.steering.getBehaviourByType(BehaviourType.ObstacleAvoidance) as ObstacleAvoidance);
    // this.stage.addChild(oad.g);
    // const wad = DiagnosticFactory.createWallAvoidanceDiagnostic(a,
    //   a.steering.getBehaviourByType(BehaviourType.WallAvoidance) as WallAvoidance);
    // this.stage.addChild(wad.g);

    // let pp: PIXI.Graphics = null;

    this.face.getRandomPathAsync(
      this.cursor.position ?
        this.cursor.position.clone() :
        null)
      .then(out => {
        if (out.path) {
          a.steering.path = out.path;
          // pp = DiagnosticFactory.createPathDiagnostic(
          //   a.steering.path);
          // this.scene.addChild(pp);
        }
      });

    // const fpd = DiagnosticFactory.createFollowPathDiagnostic(a);
    // if (fpd) {
    //   this.stage.addChild(fpd.g);
    // }

    // ad.addChild(
    //   new PIXI.Graphics()
    //   .lineStyle(2, 0x000000, 0.1)
    //   .drawCircle(0, 0, a.steering.viewDistance)
    // );

    a.updateEvent.on((_: Agent) => {
      // wd.updateGraphics();
      // oad.updateGraphics();
      // wad.updateGraphics();
      // if (fpd) {
      //   fpd.updateGraphics();
      // }
      this.nodeOccupancyUpdate(_);
    });

    a.removeEvent.on((_: Agent) => {
      this.scene.removeMesh(a.g as Mesh);
      // this.stage.removeChild(ad);
      // if (pp) {
      //   this.stage.removeChild(pp);
      // }
      // if (fpd) {
      //   this.stage.removeChild(fpd);
      // }
      // this.stage.removeChild(wd.g);
      // this.stage.removeChild(oad.g);
      // this.stage.removeChild(wad.g);
    });

    a.resetEvent.on((_: Agent) => {
      a.steering.path.clear();
      this.face.getRandomPathAsync(
        _.position
      ).then(out => {
        if (out.path) {
          a.steering.path = out.path;
          // pp = DiagnosticFactory.createPathDiagnostic(
          //   a.steering.path);
          // this.stage.addChild(pp);
          // console.log(`${out.i0}=>${out.i1}$${out.cost.toFixed(2)}`);
        }
      });
    });

    // a.g.on('mousemove', (evt: PIXI.InteractionEvent) => {
    // });

    // a.g.on('mouseover', (evt: PIXI.InteractionEvent) => {
    //    a.g.tint = 0xFF0000;
    //});

    // a.g.on('mouseout', (evt: PIXI.InteractionEvent) => {
    //   // a.g.tint = 0x00FF00;
    // });

    a.fsm.transitionTo(new Asleep());

    this.poke();
  }

  public nodeOccupancyUpdate(a: Agent) {
    if (a.steering.path && a.steering.path.points.length > 0) {
      a.steering.path.points.forEach(p => {
        if (this.cursor.position.sub(p).getLengthSq() < this.cursor.radius ** 2) {
          const i = a.face.pathFinder.getClosestNodeToPos(p);
          const n = this.face.graph.getNode(i);
          if (n) {
            n.setOccupied(true);
            this.face.graph.isDirty = true;
          }
        }
      });
    }
  }

  createGround(
    w: number,
    h: number): Mesh {

    const plane = MeshBuilder.CreateGround(
      "ground",
      {
        width: w,
        height: h,
        subdivisionsX: this.face.csp.cellsX,
        subdivisionsY: this.face.csp.cellsY
      },
      this.scene);
    plane.position.x = w * 0.5;
    plane.position.z = h * 0.5;

    const mat = new StandardMaterial(
      `ground_mat`,
      this.scene);
    mat.alpha = 0.0;
    plane.material = mat;

    // this.face.outOfBounds = (p: Vector): boolean => {
    //   const q = new Vector3(p.x, 0, p.y);
    //   return plane.getBoundingInfo().intersectsPoint(q) === false;
    // }

    plane.actionManager = new ActionManager(this.scene);

    plane.actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPointerOverTrigger,
        (evt) => {
          this.cursor.g.setEnabled(true);
          this.bAddAgent = false;
        }
      )
    );

    plane.actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPointerOutTrigger,
        (evt) => {
          this.cursor.g.setEnabled(false);
          this.bAddAgent = false;
        }
      )
    );

    plane.actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPickDownTrigger,
        (evt) => {
          if (evt.sourceEvent?.button === 0) {
            this.bAddAgent = true;
          }
          if (evt.sourceEvent?.button === 2) {
            this.face.wipeAgents();
          }
        }
      )
    );

    plane.actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPickUpTrigger,
        (evt) => {
          this.bAddAgent = false;
          this.boidColor = Color3.Random();
        }
      )
    );

    return plane;
  }

  addObstacle(
    radius: number = this.face.csp.cellHypotenuse * 0.5,
    position: Vector = Vector.randInRect(this.face.rect, radius)): Obstacle {
    const po = new Obstacle(radius, position);
    this.face.addObstacle(po);
    return po;
  }

  // Listen for animate update
  tick(deltaTimeInSeconds: number): void {
    const d = deltaTimeInSeconds * this.timeFactor;
    this.timePassed += d;
    this.face.tick(d);

    if (this.cursor) {
      this.cursor.updateGraphics();
    }

    if (this.nodeDiagnostic) {
      this.nodeDiagnostic.updateGraphics();
    }

    if (this.timePassed > randInRange(0.01, 0.02)) {
      this.timePassed = 0;
      this.poke();
      if (this.bAddAgent) {
        this.addAgent(
          this.boidRadius,
          this.cursor.position.clone());
      }
    }

    this.face.obstacles.forEach(o => {
      this.face.enforceNonPenetrationConstraint(o, this.face.obstacles);
    });
  }

  get sleepingAgents(): Agent[] {
    return this.face.facets.filter(
      a => a.fsm.currentState instanceof Asleep);
  }
}
