import { Timer } from 'utils/timer';

const get = document.querySelector.bind(document);

export const debugTimer = new Timer(0.5);

export const setupFPSDisplay = (): { [key: string]: (deltaTime: number) => void } => {
  let fpsMax = 0;
  let fpsMin = 999;

  const [fpsElement, fpsMaxElement, fpsMinElement] = [
    '#status-fps span',
    '#status-fps-max span',
    '#status-fps-min span',
  ].map((id: string) => get(id));

  return {
    updateFPSDisplay: (deltaTime: number): void => {
      const fps = Math.round(1 / deltaTime);
      fpsElement.innerHTML = `${fps}`;
      if (fps > fpsMax) fpsMax = fps;
      fpsMaxElement.innerHTML = `${fpsMax}`;
      if (fps < fpsMin) fpsMin = fps;
      fpsMinElement.innerHTML = `${fpsMin}`;
    },
  };
};
