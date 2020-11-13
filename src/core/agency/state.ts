export default interface IState<T> {
  enter(entity: T): void;
  execute(entity: T): void;
  exit(entity: T): void;
}

export class StateMachine<T> {
  private owner: T;
  // tslint:disable-next-line:variable-name
  private _currentState: IState<T>;
  private previousState: IState<T>;
  private globalState: IState<T>;

  private lifetimeInSeconds = 0;
  private secondsInCurrentState = 0;

  constructor(owner: T) {
    this.owner = owner;
  }

  get currentState(): IState<T> {
    return this._currentState;
  }

  setCurrentState(s: IState<T>) {
    this._currentState = s;
  }

  setPreviousState(s: IState<T>) {
    this.previousState = s;
  }

  setGlobalState(s: IState<T>) {
    this.globalState = s;
  }

  update(deltaTimeInSeconds: number) {
    // if a global state exists, call its execute method
    if (this.globalState) {
      this.globalState.execute(this.owner);
    }

    if (this._currentState) {
      this._currentState.execute(this.owner);
      this.secondsInCurrentState += deltaTimeInSeconds;
    }

    this.lifetimeInSeconds += deltaTimeInSeconds;
  }

  transitionTo(newState: IState<T>) {
    // keep a record of the previous state
    this.previousState = this._currentState;

    if (this._currentState) {
      // call the exit method of the existing state
      this.secondsInCurrentState = 0;
      this._currentState.exit(this.owner);
    }
    // change state to the new state
    this._currentState = newState;
    // call the entry method of the new state
    this._currentState.enter(this.owner);
  }

  revertToPreviousState() {
    this.transitionTo(this.previousState);
  }

  getSecondsInCurrentState(): number {
    return this.secondsInCurrentState;
  }

  getlifetimeInSeconds(): number {
    return this.lifetimeInSeconds;
  }
}
