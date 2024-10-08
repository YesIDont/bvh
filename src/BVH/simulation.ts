import * as PIXI from 'pixi.js';

import { doNTimes } from 'utils/do-n-times';
import { setupGraphics } from 'utils/graphics';
import { randomInRange, randomUnitVector } from 'utils/math';
import CircleImage from 'assets/circle.png';
import { setupCollisions } from './collisions';
import { debugTimer, setupFPSDisplay } from './debug';

const { min } = Math;

export const setupSimulation = (container: HTMLElement): void => {
  const objectsCount = 20000;
  const { graphicsEngine, circlesSprites, makeSprite, _debugDraw } = setupGraphics(
    container,
    objectsCount,
  );
  const { offsetWidth: worldWidth, offsetHeight: worldHeight } = container;
  const { updateFPSDisplay } = setupFPSDisplay();

  const collisions = setupCollisions(objectsCount);

  const offset = 30;
  // const velocities: number[][] = [];
  const initialRadius = 3;
  doNTimes(objectsCount, (indexAsId) => {
    const x = randomInRange(offset, worldWidth - offset);
    const y = randomInRange(offset, worldHeight - offset * 2);
    collisions.addCircle(indexAsId, x, y, initialRadius);
    // velocities[indexAsId] = randomUnitVector();
    circlesSprites.addChild(makeSprite(CircleImage, x, y, 0.2 * initialRadius, [0.5]));
  });
  const { children: sprites } = circlesSprites;
  const circleSpeed = 30;
  let lastTime = performance.now();
  let deltaSeconds = 0;

  function simulationUpdate() {
    const frameBeginTime = performance.now();
    deltaSeconds = min((frameBeginTime - lastTime) / 1000, 1);
    lastTime = frameBeginTime;

    collisions.bodies.forEach((body: number[], index: number): void => {
      body[1] += circleSpeed * body[3] * deltaSeconds;
      body[2] += circleSpeed * body[4] * deltaSeconds;

      const x = body[1];
      const y = body[2];
      const radius = body[5];
      /** If the cricle tries to escape world bounds - don't let it! */
      if (x - radius < 0) {
        body[1] -= x - radius;
        body[3] *= -1;
      } else if (x + radius > worldWidth) {
        body[1] -= x + radius - worldWidth;
        body[3] *= -1;
      }
      if (y - radius < 0) {
        body[2] -= y - radius;
        body[4] *= -1;
        /** In case of bottom border take into account StatusBar.height = 20px */
      } else if (y + radius > worldHeight - 20) {
        body[4] *= -1;
        body[2] -= y + radius - worldHeight + 20;
      }

      sprites[index].x = body[1];
      sprites[index].y = body[2];
    });

    collisions.solve();

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
