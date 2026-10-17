import { type IDBPDatabase, openDB } from 'idb'
import type { SaveStore } from './SaveStore'

const DB_NAME = 'zen-garden'
const STORE = 'saves'
const KEY = 'main'

export class IndexedDbSaveStore implements SaveStore {
  private db: Promise<IDBPDatabase>

  constructor(name = DB_NAME) {
    this.db = openDB(name, 1, {
      upgrade(db) {
        db.createObjectStore(STORE)
      },
    })
  }

  async load(): Promise<unknown> {
    return (await (await this.db).get(STORE, KEY)) ?? null
  }

  async save(data: unknown): Promise<void> {
    await (await this.db).put(STORE, data, KEY)
  }

  async clear(): Promise<void> {
    await (await this.db).delete(STORE, KEY)
  }
}

/** Opens IndexedDB if the browser allows it (private modes sometimes do not). */
export async function openIndexedDbStore(name?: string): Promise<IndexedDbSaveStore | null> {
  if (typeof indexedDB === 'undefined') return null
  try {
    const store = new IndexedDbSaveStore(name)
    await store.load()
    return store
  } catch {
    return null
  }
}
