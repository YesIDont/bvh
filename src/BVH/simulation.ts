import * as PIXI from 'pixi.js';

import { doNTimes } from 'utils/do-n-times';
import { setupGraphics } from 'utils/graphics';
import { randomInRange, randomUnitVector } from 'utils/math';
import { setupCollisions } from './collisions';
import { debugTimer, setupFPSDisplay } from './debug';

const { min } = Math;

export const setupSimulation = (container: HTMLElement): void => {
  const objectsCount = 50;
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
  const offset = 30;
  const velocities: number[][] = [];
  doNTimes(objectsCount, (indexAsId) => {
    x = randomInRange(offset, worldWidth - offset);
    y = randomInRange(offset, worldHeight - offset * 2);
    collisions.addCircle(indexAsId, x, y, 40);
    velocities[indexAsId] = randomUnitVector();
    // circlesSprites.addChild(makeSprite(CircleImage, x, y, 0.2 * random() * 8 + 1, [0.5]));
  });

  const speed = 30;
  let lastTime = performance.now();
  let deltaSeconds = 0;
  let frameBeginTime = 0;
  let radius = 0;
  function simulationUpdate() {
    frameBeginTime = performance.now();
    deltaSeconds = min((frameBeginTime - lastTime) / 1000, 1);
    lastTime = frameBeginTime;

    collisions.bodies.forEach((body: number[]): void => {
      body[1] += speed * velocities[body[0]][0] * deltaSeconds;
      body[2] += speed * velocities[body[0]][1] * deltaSeconds;
    });

    collisions.update();

    collisions.bodies.forEach((body: number[]) => {
      for (const other of collisions.getPotentials(body)) {
        if (collisions.areCirclesColliding(body, other, result)) {
          const [halfOverlapLength, overlap_x, overlap_y] = result;
          body[1] -= halfOverlapLength * overlap_x;
          body[2] -= halfOverlapLength * overlap_y;
          other[1] += halfOverlapLength * overlap_x;
          other[2] += halfOverlapLength * overlap_y;
        }
      }
      /** If its outside bounds */
      x = body[1];
      y = body[2];
      radius = body[3];
      if (x < radius || x + radius > worldWidth || y < radius || y + radius + 20 > worldHeight) {
        [x, y] = velocities[body[0]];
        velocities[body[0]] = [-x, -y];
      }
    });

    _debugDraw.clear();
    // _debugDraw.lineStyle(1, 0x005500);
    // collisions.drawBVH(_debugDraw);
    _debugDraw.lineStyle(1, 0xffffff);
    collisions.drawCircles(_debugDraw);

    if (debugTimer.update(deltaSeconds)) {
      updateFPSDisplay(deltaSeconds);
    }
  }

  graphicsEngine.ticker.add(simulationUpdate);
  graphicsEngine.start();
};
