import * as PIXI from 'pixi.js';

import { doNTimes } from 'utils/do-n-times';
import { setupGraphics } from 'utils/graphics';
import { randomInRange, randomUnitVector } from 'utils/math';
import CircleImage from 'assets/circle.png';
import { setupCollisions } from './collisions';
import { debugTimer, setupFPSDisplay } from './debug';

const { min, random } = Math;

export const setupSimulation = (container: HTMLElement): void => {
  const objectsCount = 5000;
  const { graphicsEngine, circlesSprites, makeSprite, _debugDraw } = setupGraphics(
    container,
    objectsCount,
  );
  const { offsetWidth: worldWidth, offsetHeight: worldHeight } = container;
  const { updateFPSDisplay } = setupFPSDisplay();

  const collisions = setupCollisions(objectsCount);
  const result = [0, 0, 0];

  let x = 0;
  let y = 0;
  const offset = 30;
  const velocities: number[][] = [];
  let radius = 3;
  doNTimes(objectsCount, (indexAsId) => {
    x = randomInRange(offset, worldWidth - offset);
    y = randomInRange(offset, worldHeight - offset * 2);
    collisions.addCircle(indexAsId, x, y, radius);
    velocities[indexAsId] = randomUnitVector();
    circlesSprites.addChild(makeSprite(CircleImage, x, y, 0.2 * radius, [0.5]));
  });
  const { children: sprites } = circlesSprites;
  const speed = 30;
  let lastTime = performance.now();
  let deltaSeconds = 0;
  let frameBeginTime = 0;
  let id = 0;
  function simulationUpdate() {
    frameBeginTime = performance.now();
    deltaSeconds = min((frameBeginTime - lastTime) / 1000, 1);
    lastTime = frameBeginTime;

    collisions.bodies.forEach((body: number[], index: number): void => {
      body[1] += speed * velocities[body[0]][0] * deltaSeconds;
      body[2] += speed * velocities[body[0]][1] * deltaSeconds;

      [id, x, y, radius] = body;
      /** If the cricle tries to escape world bounds - don't let it! */
      if (x - radius < 0) {
        body[1] -= x - radius;
        velocities[body[0]][0] *= -1;
      } else if (x + radius > worldWidth) {
        body[1] -= x + radius - worldWidth;
        velocities[body[0]][0] *= -1;
      }
      if (y - radius < 0) {
        body[2] -= y - radius;
        velocities[body[0]][1] *= -1;
      } else if (y + radius > worldHeight) {
        velocities[body[0]][1] *= -1;
        body[2] -= y + radius - worldHeight;
      }

      sprites[index].x = body[1];
      sprites[index].y = body[2];
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
    });

    // _debugDraw.clear();
    // _debugDraw.lineStyle(1, 0x005500);
    // collisions.drawBVH(_debugDraw);
    // _debugDraw.lineStyle(1, 0xffffff);
    // collisions.drawCircles(_debugDraw);

    if (debugTimer.update(deltaSeconds)) {
      updateFPSDisplay(deltaSeconds);
    }
  }

  graphicsEngine.ticker.add(simulationUpdate);
  graphicsEngine.start();
};
