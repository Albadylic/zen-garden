import { useEffect, useRef, useState } from 'react'
import { SaveError } from '../core/save'
import { downloadJson, isStoragePersistent, readJsonFile } from '../persistence/browser'
import { useController, useSession } from './hooks'
import { Sheet } from './Sheet'

export function SettingsPanel() {
  const controller = useController()
  const session = useSession()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [persisted, setPersisted] = useState<boolean | null>(null)

  useEffect(() => {
    void isStoragePersistent().then(setPersisted)
  }, [])

  const exportSave = () => {
    const date = new Date().toISOString().slice(0, 10)
    downloadJson(session.exportSave(), `zen-garden-${date}.json`)
  }

  const importSave = async (file: File | undefined) => {
    if (!file) return
    try {
      await session.importSave(await readJsonFile(file))
      controller.toast('Garden loaded from file')
    } catch (e) {
      controller.toast(
        e instanceof SaveError ? e.message : 'That file could not be read',
        'warning',
      )
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <Sheet title="Settings" onClose={() => controller.closePanel()} testId="settings-panel">
      <section className="settings-group">
        <h3 className="inventory-group__title">Your garden</h3>
        <p className="muted">
          {session.persistent
            ? 'Your garden saves automatically on this device.'
            : 'This browser is not allowing saves, so your garden will reset when the page closes. Export it to keep a copy.'}
          {session.persistent &&
            persisted === false &&
            ' Your browser may clear it if storage runs low, so an occasional export is a good safety net.'}
        </p>
        <div className="actions">
          <button type="button" className="button" onClick={exportSave}>
            Export save
          </button>
          <button type="button" className="button" onClick={() => fileRef.current?.click()}>
            Import save
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            data-testid="import-input"
            onChange={(e) => void importSave(e.target.files?.[0])}
          />
        </div>
        <div className="actions">
          {confirmReset ? (
            <>
              <button
                type="button"
                className="button button--danger"
                onClick={() => {
                  setConfirmReset(false)
                  void session.resetGarden()
                }}
              >
                Yes, start a new garden
              </button>
              <button type="button" className="button" onClick={() => setConfirmReset(false)}>
                Keep my garden
              </button>
            </>
          ) : (
            <button type="button" className="button" onClick={() => setConfirmReset(true)}>
              Start a new garden
            </button>
          )}
        </div>
      </section>
    </Sheet>
  )
}
