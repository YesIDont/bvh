export const doNTimes = (n: number, callback: (index: number) => void): void => {
  let i = 0;
  for (i; i < n; i++) {
    callback(i);
  }
};
