export function setupMousePosition(): number[] {
  const mouse = [0, 0];

  document.addEventListener('mousemove', (event: MouseEvent): void => {
    const e = event || window.event;
    let x = e.pageX;
    let y = e.pageY;

    // IE 8
    if (x === undefined || x === null) {
      const { scrollLeft, scrollTop } = document.body;
      const { documentElement } = document;
      x = e.clientX + scrollLeft + documentElement.scrollLeft;
      y = e.clientY + scrollTop + documentElement.scrollTop;
    }

    mouse[0] = x;
    mouse[1] = y;
  });

  return mouse;
}
