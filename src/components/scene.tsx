import React, { useRef } from 'react';

import { StageFace } from '../core/stage-face';
import Vector from '../core/agency/math/vector';

import { ActionManager } from '@babylonjs/core/Actions/actionManager';
import { ExecuteCodeAction } from '@babylonjs/core/Actions';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Color3, Vector3 } from '@babylonjs/core/Maths/math';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import BabylonScene from 'babylonjs-hook';
import './scene.css';

let babylonLink;

let stageFace: StageFace;

const onSceneReady = scene => {
  // This creates and positions a free camera (non-mesh)
  var camera = new FreeCamera("camera1", new Vector3(0, 5, -50), scene);

  // This targets the camera to scene origin
  camera.setTarget(Vector3.Zero());

  const canvas = scene.getEngine().getRenderingCanvas();

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);

  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  var light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7;

  var faceColors = [];
  faceColors[0] = Color3.Blue();
  faceColors[1] = Color3.Red();
  faceColors[2] = Color3.Green();
  faceColors[3] = Color3.White();
  faceColors[4] = Color3.Yellow();
  faceColors[5] = Color3.Black();

  const boxOptions = {
    faceColors: faceColors,
    size: 2.0
  };

  stageFace = new StageFace(
    scene,
    200,
    200);
    
  const m = MeshBuilder.CreateBox(
    "box", 
    boxOptions, 
    scene);

  m.isVisible = false;

  // Our built-in 'ground' shape.
  const ground = MeshBuilder.CreateGround("ground", {width: 200, height: 200}, scene);

  // Register click event on box mesh
  ground.actionManager = new ActionManager(scene);
  ground.actionManager.registerAction(
    new ExecuteCodeAction(
        ActionManager.OnPickTrigger,
        () => {
          // babylonLink.current.click()
          stageFace.addAgent(Vector.ZERO);
        }
    )
  );
}

/**
 * Will run on every frame render.  We are spinning the box on y-axis.
 */
const onRender = scene => {
  var deltaTimeInMilliseconds = scene.getEngine().getDeltaTime();
  stageFace.tick(deltaTimeInMilliseconds * 0.001);
}

export default () => {
  babylonLink = useRef(null);

  return (
    <>
      <BabylonScene antialias onSceneReady={onSceneReady} onRender={onRender} id='render-canvas' />
      <a ref={babylonLink} target="_blank" rel="noopener noreferrer" href="https://www.babylonjs.com/">
        Babylon documentation
      </a>
    </>
  )
}
