import Vector from './vector';

export default class Smoother {
  history: Array<Vector> = [];
  zeroValue: Vector = Vector.ZERO;
  nextUpdateSlot = 0;
  enabled = true;

  constructor(sampleSize: number = 10, zeroValue: Vector = Vector.ZERO) {
    this.zeroValue = zeroValue;
    for (let index = 0; index < sampleSize; ++index) {
      this.history.push(this.zeroValue.clone());
    }
  }

  reset() {
    this.nextUpdateSlot = 0;
    for (let index = 0; index < this.history.length; ++index) {
      this.history[index] = this.zeroValue.clone();
    }
  }

  update(mostRecentValue: Vector): Vector {
    // overwrite the oldest value with the newest.
    this.history[this.nextUpdateSlot++] = mostRecentValue.clone();
    // make sure _nextUpdateSlot wraps around.
    if (this.nextUpdateSlot === this.history.length) {
      this.nextUpdateSlot = 0;
    }
    // now to calculate the average of the history list.
    return this.history
      .reduce((a, b) => a.add(b))
      .div(this.history.length);
  }
}
