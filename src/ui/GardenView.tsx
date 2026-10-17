import { useEffect, useRef } from 'react'
import { startingMap } from '../content'
import { GardenRenderer } from '../render/GardenRenderer'

export function GardenView() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const renderer = new GardenRenderer()
    void renderer.mount(host, startingMap)
    return () => renderer.destroy()
  }, [])

  return <div ref={hostRef} className="garden-view" />
}
