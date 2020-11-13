
export interface ILifetimeEvent<T> {
  on(handler: (data?: T) => void): void;
  off(handler: (data?: T) => void): void;
}

export default class LifetimeEvent<T> implements ILifetimeEvent<T> {

  private handlers: ((data?: T) => void)[] = [];

  public on(handler: (data?: T) => void): void {
      this.handlers.push(handler);
  }

  public off(handler: (data?: T) => void): void {
      this.handlers = this.handlers.filter(h => h !== handler);
  }

  public trigger(data?: T) {
      this.handlers.forEach(h => h(data));
  }

  public expose(): ILifetimeEvent<T> {
      return this;
  }
}
