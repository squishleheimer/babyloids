import { randInRange } from './math/random';

const UpdatePeriodVariator = 10.0;

export default class Regulator {

  // tslint:disable-next-line:variable-name
  private _nextUpdateTime: number;
  // tslint:disable-next-line:variable-name
  private _updatePeriod: number;

  constructor(public numUpdatesPerSecondRqd: number) {

    this._nextUpdateTime = this.getTime() * Math.random();

    if (this.numUpdatesPerSecondRqd > 0) {
      this._updatePeriod = 1000.0 / this.numUpdatesPerSecondRqd;
    } else if (this.numUpdatesPerSecondRqd === 0) {
      this._updatePeriod = 0.0;
    } else if (this.numUpdatesPerSecondRqd < 0) {
      this._updatePeriod = -1;
    }
  }

  private getTime(): number {
    return Date.now();
  }

  get isReady(): boolean {

    if (this._updatePeriod === 0) {
      return true;
    }

    if (this._updatePeriod < 0) {
      return false;
    }

    const currentTime = this.getTime();

    if (currentTime >= this._nextUpdateTime) {
      const variation = randInRange(-UpdatePeriodVariator, UpdatePeriodVariator);
      this._nextUpdateTime = currentTime + this._updatePeriod + variation;
      return true;
    }

    return false;
  }
}
