
export function swap(a: number, b: number, arr: any[]): void {
  [arr[a], arr[b]] = [arr[b], arr[a]];
}

export function reorderUpwards(arr: any[], idx: number): void {
  while (idx > 0 && (arr[Math.floor(idx / 2)] < arr[idx])) {
    swap(Math.floor(idx / 2), idx, arr);
    idx = Math.floor(idx / 2);
    console.log(`idx:${idx}`);
  }
}

export class IndexedPriorityQLow<KeyType> {

  // tslint:disable-next-line:variable-name
  private _iSize = 0;

  get keys(): Array<KeyType> { return this._keys; }

  constructor(
    // tslint:disable-next-line:variable-name
    private _keys: Array<KeyType>,
    // tslint:disable-next-line:variable-name
    private _iMaxSize: number,
    // tslint:disable-next-line:variable-name
    private _heap: Array<number> = new Array(_iMaxSize + 1),
    // tslint:disable-next-line:variable-name
    private _invHeap: Array<number> = new Array(_iMaxSize + 1)
  ) {

    this._heap.fill(0, 0, _iMaxSize + 1);
    this._invHeap.fill(0, 0, _iMaxSize + 1);
  }

  get empty(): boolean { return (this._iSize === 0); }

  insert(idx: number) {
    console.assert(this._iSize + 1 <= this._iMaxSize);
    this._heap[++this._iSize] = idx;
    this._invHeap[idx] = this._iSize;
    this.reorderUpwards(this._iSize);
  }

  // to get the min item the first element is exchanged with the lowest
  // in the heap and then the heap is reordered from the top down.
  pop(): number {
    this.swap(1, this._iSize);
    this.reorderDownwards(1, this._iSize - 1);
    return this._heap[this._iSize--];
  }

  // if the value of one of the client key's changes then call
  // this with  the key's index to adjust the queue accordingly.
  changePriority(idx: number): void {
    this.reorderUpwards(this._invHeap[idx]);
  }

  private swap(a: number, b: number): void {
    // [this._heap[a], this._heap[b]] = [this._heap[b], this._heap[a]];

    const temp = this._heap[a];
    this._heap[a] = this._heap[b];
    this._heap[b] = temp;

    // Change the handles too
    this._invHeap[this._heap[a]] = a;
    this._invHeap[this._heap[b]] = b;
  }

  private reorderUpwards(idx: number): void {
    // Move up the heap swapping the elements until the heap is ordered
    const up = Math.floor(idx / 2);
    while (idx > 1 && (this._keys[this._heap[up]] > this._keys[this._heap[idx]]) ) {
      this.swap(up, idx);
      idx = up;
    }
  }

  private reorderDownwards(idx: number, heapSize: number): void {
    // move down the heap from node idx swapping the elements until
    // the heap is reordered
    while (2 * idx <= heapSize) {
      let child = 2 * idx;

      // set child to smaller of idx's two children
      if ((child < heapSize) && (this.keys[this._heap[child]] > this.keys[this._heap[child + 1]])) {
        ++child;
      }

      // if this idx is larger than its child, swap
      if (this.keys[this._heap[idx]] > this.keys[this._heap[child]]) {
        this.swap(child, idx);
        // move the current node down the tree
        idx = child;
      } else {
        break;
      }
    }
  }

}
