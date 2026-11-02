// The benchmark grid at its widest: 12 columns of a 1382 px page with 12 px gaps and 8 px cell padding. Charts are drawn at their cell's width there.
const column = (1382 - 11 * 12) / 12;
export const drawnWidth = (span: number) => Math.floor(column * span + 12 * (span - 1) - 18);

// The smallest clean axis top above a value, so ticks at fifths land on round numbers.
export const niceMax = (value: number) => {
  const scale = 10 ** Math.floor(Math.log10(value));
  return [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10].find((step) => step * scale >= value)! * scale;
};
