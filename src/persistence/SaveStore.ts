// Where saves live. The web build uses IndexedDB; the Capacitor build can
// provide a native implementation of the same interface later.

export interface SaveStore {
  /** The saved data, or null if there is no save yet. */
  load(): Promise<unknown>
  save(data: unknown): Promise<void>
  clear(): Promise<void>
}

/** Keeps saves in memory only: used when no persistent storage is available. */
export class MemorySaveStore implements SaveStore {
  private data: unknown = null

  async load(): Promise<unknown> {
    return this.data
  }

  async save(data: unknown): Promise<void> {
    this.data = JSON.parse(JSON.stringify(data))
  }

  async clear(): Promise<void> {
    this.data = null
  }
}
