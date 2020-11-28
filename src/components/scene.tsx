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
import DiagnosticFactory from '../core/diagnostic-factory';
import Cursor from '../core/cursor';
import { ArcRotateCamera, PointerEventTypes } from '@babylonjs/core';

let babylonLink;

let stageFace: StageFace;

const onSceneReady = scene => {

  const w = 500;
  const h = 500;

  // This creates and positions a free camera (non-mesh)
  var camera = new FreeCamera("camera1", new Vector3(w/2.0, 250, -h/2.0), scene);
  // var camera = new ArcRotateCamera(
  //   "Camera", 
  //   -Math.PI/2, 
  //   Math.PI / 3, 
  //   25, 
  //   Vector3.Zero(), 
  //   scene);

  // This attaches the camera to the canvas
  camera.attachControl(
    scene.getEngine().getRenderingCanvas(), 
    true);

  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  var light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7;

  stageFace = new StageFace(scene, w, h);

  // This targets the camera to scene origin
  camera.setTarget(new Vector3(w/2.0, 0, h/2.0));
  //camera.setTarget(stageFace.plane);
}

const onRender = scene => {
  const deltaTimeInSeconds = 
    scene.getEngine().getDeltaTime() * 0.001;
  stageFace.tick(deltaTimeInSeconds);
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
