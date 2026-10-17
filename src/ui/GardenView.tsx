import { useEffect, useRef } from 'react'

interface Props {
  /** Mounts the garden renderer into the element and returns a cleanup function. */
  mount: (element: HTMLElement) => () => void
}

export function GardenView({ mount }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    return mount(host)
  }, [mount])

  return <div ref={hostRef} className="garden-view" />
}
