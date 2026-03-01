export class AsyncLocalStorage<T> {
  private value: T | undefined
  getStore(): T | undefined {
    return this.value
  }
  run<R>(store: T, fn: () => R): R {
    this.value = store
    try {
      return fn()
    } finally {
      this.value = undefined
    }
  }
}
