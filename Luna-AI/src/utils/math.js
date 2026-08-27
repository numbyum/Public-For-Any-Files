const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const randomRange = (min, max) => Math.random() * (max - min) + min;
const randomInt = (min, max) => Math.floor(randomRange(min, max + 1));
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const angleDiff = (a, b) => {
  let diff = ((b - a + 540) % 360) - 180;
  return diff;
};
const normalizeAngle = (angle) => ((angle % 360) + 360) % 360;
const weightedRandom = (choices) => {
  const totalWeight = choices.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of choices) {
    random -= item.weight;
    if (random <= 0) return item.value;
  }
  return choices[choices.length - 1].value;
};

module.exports = {
  clamp,
  lerp,
  smoothstep,
  easeInOutCubic,
  randomRange,
  randomInt,
  randomChoice,
  angleDiff,
  normalizeAngle,
  weightedRandom,
};
