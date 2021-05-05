import * as PIXI from 'pixi.js';

import CircleImage from 'assets/circle.png';
import { doNTimes } from 'utils/do-n-times';
import { setupGraphics } from 'utils/graphics';
import { randomInRange } from 'utils/math';
import { CircleMinimal, setupCircleMinimalCollisions } from './circlesMinimalCollisions';
import { debugTimer, setupFPSDisplay } from './debug';

const { min } = Math;

export const setupSimulation = (container: HTMLElement): void => {
  const objectsCount = 5000;
  const { graphicsEngine, circlesSprites, makeSprite, _debugDraw } = setupGraphics(
    container,
    objectsCount,
  );
  const { offsetWidth: worldWidth, offsetHeight: worldHeight } = container;
  const { updateFPSDisplay } = setupFPSDisplay();

  const collisions = setupCircleMinimalCollisions();

  let x = 0;
  let y = 0;
  const offset = 20;
  const scale = 3;
  doNTimes(objectsCount, () => {
    x = randomInRange(offset, worldWidth - offset);
    y = randomInRange(offset, worldHeight - offset * 2);
    circlesSprites.addChild(makeSprite(CircleImage, x, y, 0.2 * scale, [0.5]));
  });

  let lastTime = performance.now();
  let deltaSeconds = 0;
  let frameBeginTime = 0;
  function simulationUpdate() {
    frameBeginTime = performance.now();
    deltaSeconds = min((frameBeginTime - lastTime) / 1000, 1);
    lastTime = frameBeginTime;

    collisions.update();
    // _debugDraw.clear();
    // _debugDraw.lineStyle(1, 0x006600);
    // collisions.forEach((circle: CircleMinimal) => {
    //   circle.draw(_debugDraw);
    // });

    if (debugTimer.update(deltaSeconds)) {
      updateFPSDisplay(deltaSeconds);
    }
  }

  graphicsEngine.ticker.add(simulationUpdate);
  graphicsEngine.start();
};
