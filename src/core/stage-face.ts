import { Scene, Mesh, TransformNode, Color3, InstancedMesh, AbstractMesh, LinesMesh } from '@babylonjs/core';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';

import Face from './agency/face';
import Agent from './agency/agent';
import Boid from './boid';
import Vector from './agency/math/vector';
import { BehaviourType } from './agency/steering/steering';
import { Waking, DozingOff, Asleep, Reset, Awake } from './states';
import { randInRange, randomIntFromInterval } from './agency/math/random';
import PixiObstacle from './pixi-obstacle';
import Cursor from './cursor';
import { createInwardRectWalls } from './agency/steering/wall';
import SteeringFactory from './agency/steering/factory';
import Entity from './agency/steering/entity';

export class StageFace {

  private readonly MAX_AGENTS = 500;
  private readonly RADIUS = randomIntFromInterval(5, 10);

  public face: Face;

  diagnostics = [];

  cursor: Cursor = new Cursor(50.0);
  nodeDiagnostic: any = null;
  mouseDown = false;
  timePassed = 0;

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

  addAgent(p: Vector = this.cursor.position.clone()): Agent {
    if (p &&
      this.face.numberOfFacets() < this.MAX_AGENTS &&
      !this.face.outOfBounds(p)) {
      return this.face.addAgent(new Boid(this.RADIUS, this.face, p));
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

    this.face = new Face(
      new Vector(w, h),
      this.MAX_AGENTS,
      false);

    const cellRadius = this.face.csp.rect;

    // WALLS
    this.face.addWall(
      ...createInwardRectWalls(this.face.rect));

    // this.stage.addChild(...this.face.walls.map(wall => {
    //   return DiagnosticFactory.createWallDiagnostic(wall);
    // }));

    // const gd = DiagnosticFactory.createGraphDiagnostic(
    //   this.face.graph, { });
    // this.stage.addChild(gd);

    // this.nodeDiagnostic = DiagnosticFactory.createNodeDiagnostic(
    //   this.face.graph, { });
    // this.stage.addChild(this.nodeDiagnostic.g);
    this.face.graph.isDirty = true;

    // const bg = this.scene.addChild(
    //   PIXI.Sprite.from('assets/623178_2560x1440.jpg')
    // );
    // bg.width = w;
    // bg.height = h;
    // bg.alpha = 1.0;

    // AGENTS
    this.face.onAdd = (a: Boid) => {

      const radius = 1.0;//randomIntFromInterval(5, 50); // = this.RADIUS;

      // const ad = this.stage.addChild(new PIXI.Container());
      // ad.addChild(DiagnosticFactory.createArrowDiagnostic(radius));
      
      // ad.visible = false;

      //a.sprotate = false;

      //const m = MeshBuilder.CreateSphere("sphere", sphereOptions, this.scene);

      const m: LinesMesh = this.scene.getMeshByID("arrow") as LinesMesh;
      if (m) {
        a.g = m.createInstance("boid_" + this.face.facets.length)
        a.updateEvent.on(_ => {
          a.g.position.y = radius * 0.5;
        });
      } else {
        return;
      }

      a.steering.viewDistance = Math.min(cellRadius.x, cellRadius.y);
      a.steering.cellSpaceEnabled = true;

      // a.g.addChild(
      //   new PIXI.Text(
      //     `${a.id}`,
      //     DiagnosticFactory.createTextStyle(9))
      // );

      let otherA = this.face.facets[randomIntFromInterval(0, this.face.facets.length - 1)] as Entity;
      let otherB = this.face.facets[randomIntFromInterval(0, this.face.facets.length - 1)] as Entity;
      if (otherA === a) {
        otherA = null;
      }
      if (otherB === a) {
        otherB = null;
      }

      const behaviours = [
        //BehaviourType.ObstacleAvoidance,
        //BehaviourType.WallAvoidance,
        BehaviourType.Alignment,
        BehaviourType.Cohesion,
        BehaviourType.Separation,
        BehaviourType.Wander,
        //BehaviourType.FollowPath,
        // BehaviourType.Evade,
        // BehaviourType.Arrive,
        // BehaviourType.Flee,
        // BehaviourType.Pursuit,
        // BehaviourType.OffsetPursuit,
        // BehaviourType.Evade,
        // BehaviourType.Hide
        // BehaviourType.Interpose
      ].map(b => {
        return SteeringFactory.createSteeringBehaviour({
          type: b,
          agent: a,
          seekDistance: a.radius * 3,
          position: Vector.ZERO,
          otherA,
          otherB,
          offset: Vector.randomUnit().mult(a.radius * 3)
        });
      });

      // if (this.face.facets.length === 3) {
      //   a.steering.addBehaviour(true,
      //     new Interpose(a,
      //       this.face.facets[0],
      //       this.face.facets[1]));
      //   a.g.tint = 0x0000FF;
      // }

      a.steering.addBehaviour(true, ...behaviours);

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

      // a.updateEvent.on((_: Agent) => {
      //   ad.rotation = a.heading.angle;
      //   ad.position.set(a.position.x, a.position.y);
      //   // wd.updateGraphics();
      //   // oad.updateGraphics();
      //   // wad.updateGraphics();
      //   if (fpd) {
      //     fpd.updateGraphics();
      //   }
      //   // if (a.steering.path && a.steering.path.points.length > 0) {
      //   //   a.steering.path.points.forEach(p => {
      //   //     if (this.cursor.position.sub(p).getLengthSq() < this.cursor.radius ** 2) {
      //   //       const i = this.face.pathFinder.getClosestNodeToPos(p);
      //   //       const n = this.face.graph.getNode(i);
      //   //       if (n) {
      //   //         n.setOccupied(true);
      //   //         this.face.graph.isDirty = true;
      //   //       }
      //   //     }
      //   //   });
      //   // }
      // });

      a.removeEvent.on((_: Agent) => {
        //this.scene.removeMesh(a.g);
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
        // if (pp) {
        //   a.steering.path.clear();
        //   pp.clear();
        //   this.scene.removeChild(pp);
        //   this.face.getRandomPathAsync(
        //     _.position
        //   ).then(out => {
        //     if (out.path) {
        //       a.steering.path = out.path;
        //       // pp = DiagnosticFactory.createPathDiagnostic(
        //       //   a.steering.path);
        //       // this.stage.addChild(pp);
        //       // console.log(`${out.i0}=>${out.i1}$${out.cost.toFixed(2)}`);
        //     }
        //   });
        // }
      });

      // a.g.on('mousemove', (evt: PIXI.InteractionEvent) => {
      // });

      // a.g.on('mouseover', (evt: PIXI.InteractionEvent) => {
      //   // a.g.tint = 0xFF0000;
      // });

      // a.g.on('mouseout', (evt: PIXI.InteractionEvent) => {
      //   // a.g.tint = 0x00FF00;
      // });

      a.fsm.transitionTo(new Asleep());

      this.poke();
    };

    // this.diagnostics.push(
    //   DiagnosticFactory.createCellSpaceDiagnostic(this.face.csp)
    // );

    this.addDiagnostics();

    // this.cursor.g = new PIXI.Graphics();
    // this.scene.addChild(this.cursor.g);

    this.face.addObstacle(this.cursor);

    // const txt = new PIXI.Text(
    //   'mxmy',
    //   DiagnosticFactory.createTextStyle(18));
    // txt.anchor.set(1);
    // this.stage.addChild(txt);

    // this.scene.on('mousemove', (evt: PIXI.InteractionEvent) => {
    //   const p = Vector.from(evt.data.global);
    //   if (!this.face.outOfBounds(p)) {
    //     this.cursor.updatePosition(this.cursor.position, p);
    //     const idx = this.face.csp.positionToIndex(p);
    //     txt.position.set(p.x, p.y);
    //     txt.text = `${idx}:${this.face.csp.cells[idx].members.length}`;
    //   }
    // });

    // this.scene.on('mousedown', (evt: PIXI.InteractionEvent) => {
    //   // this.face.wipeAgents();
    //   this.cursor.g.alpha = 0;
    //   this.mouseDown = true;
    // });

    // this.scene.on('mouseup', (evt: PIXI.InteractionEvent) => {
    //   this.cursor.g.alpha = 0.3;
    //   this.addAgent();
    //   // const o = this.addObstacle(this.cursor.radius, this.cursor.position.copy());
    //   // this.face.enforceNonPenetrationConstraint(o, this.face.obstacles);
    //   this.mouseDown = false;
    // });
  }

  // Listen for animate update
  tick(deltaTimeInSeconds: number): void {
    this.timePassed += deltaTimeInSeconds;
    this.face.tick(deltaTimeInSeconds);

    if (this.mouseDown) {
      this.addAgent();
    }

    if (this.nodeDiagnostic) {
      this.nodeDiagnostic.updateGraphics();
    }

    this.poke();

    if (this.timePassed > randInRange(0.1, 0.2)) {
      this.timePassed = 0;
      this.poke();
      // if (!this.mouseDown) {
      //   this.addAgent(
      //     Vector.randInRect(
      //       this.face.rect));
      // }
    }

    this.face.obstacles.forEach(o => {
      this.face.enforceNonPenetrationConstraint(o, this.face.obstacles);
    });
  }

  get sleepingAgents(): Agent[] {
    return this.face.facets.filter(
      a => a.fsm.currentState instanceof Asleep);
  }

  addObstacle(
    radius: number = this.face.csp.cellHypotenuse * 0.5,
    position: Vector = Vector.randInRect(this.face.rect, radius)): PixiObstacle {
    const po = new PixiObstacle(radius, position);
    this.face.addObstacle(po);
    // this.scene.addChild(DiagnosticFactory.createObstacleDiagnostic(po));
    return po;
  }
}
