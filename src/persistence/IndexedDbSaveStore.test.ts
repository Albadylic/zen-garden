import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { openIndexedDbStore } from './IndexedDbSaveStore'
import { MemorySaveStore } from './SaveStore'

describe('save stores', () => {
  it('saves, loads and clears through IndexedDB', async () => {
    const store = await openIndexedDbStore('test-saves')
    expect(store).not.toBeNull()
    expect(await store!.load()).toBeNull()
    await store!.save({ hello: 'garden' })
    expect(await store!.load()).toEqual({ hello: 'garden' })
    await store!.clear()
    expect(await store!.load()).toBeNull()
  })

  it('keeps an independent copy in memory', async () => {
    const store = new MemorySaveStore()
    const data = { n: 1 }
    await store.save(data)
    data.n = 2
    expect(await store.load()).toEqual({ n: 1 })
  })
})
