import * as PIXI from 'pixi.js';

import CircleImage from 'assets/circle.png';
import { doNTimes } from 'utils/do-n-times';
import { setupGraphics } from 'utils/graphics';
import { randomInRange } from 'utils/math';
import { setupCollisions } from './collisions';
import { debugTimer, setupFPSDisplay } from './debug';

const { min, random } = Math;

export const setupSimulation = (container: HTMLElement): void => {
  const objectsCount = 500;
  const { graphicsEngine, /* circlesSprites, makeSprite, */ _debugDraw } = setupGraphics(
    container,
    objectsCount,
  );
  const { offsetWidth: worldWidth, offsetHeight: worldHeight } = container;
  const { updateFPSDisplay } = setupFPSDisplay();

  const collisions = setupCollisions();
  const result = [0, 0, 0];

  let x = 0;
  let y = 0;
  const offset = 20;
  doNTimes(objectsCount, (indexAsId) => {
    x = randomInRange(offset, worldWidth - offset);
    y = randomInRange(offset, worldHeight - offset * 2);
    collisions.addCircle(indexAsId, x, y, 5);
    // circlesSprites.addChild(makeSprite(CircleImage, x, y, 0.2 * random() * 8 + 1, [0.5]));
  });

  let lastTime = performance.now();
  let deltaSeconds = 0;
  let frameBeginTime = 0;
  let id = 0;
  function simulationUpdate() {
    frameBeginTime = performance.now();
    deltaSeconds = min((frameBeginTime - lastTime) / 1000, 1);
    lastTime = frameBeginTime;

    collisions.forEach((circle: number[]) => {
      id = circle[0];
      for (const other of collisions.getPotentials(id)) {
        if (collisions.areCirclesColliding(id, other[id], result)) {
          //
        }
      }
    });

    collisions.update();
    _debugDraw.clear();
    _debugDraw.lineStyle(1, 0x006600);
    collisions.drawCircles(_debugDraw);

    if (debugTimer.update(deltaSeconds)) {
      updateFPSDisplay(deltaSeconds);
    }
  }

  graphicsEngine.ticker.add(simulationUpdate);
  graphicsEngine.start();
};
