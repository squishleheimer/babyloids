
export function rand(): number {
  const r = 2.0 * (Math.random() - 0.5);
  return r;
}

export function randInRange(x: number, y: number) {
  const r = x + Math.random() * (y - x);
  return r;
}

export function randSignum(): number {
  return Math.round(this.rand());
}

export function randomIntFromInterval(min: number, max: number): number {
  const r = Math.floor(Math.random() * (max - min + 1) + min);
  return r;
}

export function clamp(
  value: number,
  min: number = 0.0,
  max: number = 1.0,
  wrapped: boolean = false): number {
  if (value < min) {
    value = wrapped ? max : min;
  } else if (value > max) {
    value = wrapped ? min : max;
  }
  return value;
}

export function wrap(
  value: number,
  min: number = 0.0,
  max: number = 1.0): number {
  return clamp(value, min, max, true);
}

export function createIntArray(size: number): number[] {
  const a: Array<number> = [];
  for (let i = 0; i < size; i++) {
    a.push(0);
  }
  return a;
}
