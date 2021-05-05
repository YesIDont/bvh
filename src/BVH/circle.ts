export type CircleType = {
  radius: number;
  x: number;
  y: number;
};
export function Circle(): CircleType {
  return {
    radius: 3,
    x: 0,
    y: 0,
  };
}
