import * as PIXI from 'pixi.js';

type PixiSetupResultType = {
  graphicsEngine: PIXI.Application;
  circlesSprites: PIXI.ParticleContainer;
  _debugDraw: PIXI.Graphics;
  makeSprite: (
    imageUrl: string,
    x: number,
    y: number,
    scale: number,
    anchor: number[],
  ) => PIXI.Sprite;
};

export const setupGraphics = <T extends HTMLElement>(
  container: T,
  particlesMaxCount: number,
): PixiSetupResultType => {
  const app = new PIXI.Application({
    backgroundColor: 0x000000,
  });
  app.stop();
  container.append(app.view);

  const particlesOptions = { scale: true, position: true, rotation: true };
  const circlesSprites = new PIXI.ParticleContainer(particlesMaxCount, particlesOptions);
  circlesSprites.zIndex = 1;

  app.stage.addChild(circlesSprites);
  app.stage.sortableChildren = true;

  const _debugDraw = new PIXI.Graphics();
  _debugDraw.zIndex = 2;
  app.stage.addChild(_debugDraw);

  app.resizeTo = container;

  return {
    graphicsEngine: app,
    circlesSprites,
    _debugDraw,
    makeSprite: (
      imageUrl: string,
      x: number,
      y: number,
      scale = 1,
      anchor: number[],
    ): PIXI.Sprite => {
      const sprite = PIXI.Sprite.from(imageUrl);
      sprite.x = x;
      sprite.y = y;
      sprite.scale.set(scale);
      sprite.anchor.set(...anchor);

      return sprite;
    },
  };
};

export const updateRendererSize = <T extends HTMLElement>(container: T): void => {
  const canavs = document.querySelector('canvas');
  if (canavs) {
    const { offsetWidth, offsetHeight } = container;
    canavs.width = offsetWidth;
    canavs.height = offsetHeight;
  }
};
