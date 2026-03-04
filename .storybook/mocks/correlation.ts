export function getCorrelationId(): string | undefined {
  return undefined
}

export function generateCorrelationId(): string {
  return crypto.randomUUID()
}

export function withCorrelationId<T>(_id: string, fn: () => T): T {
  return fn()
}
