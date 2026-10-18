// Unified mouse and touch input on the garden canvas: tap, drag to pan,
// pinch and wheel to zoom, and hover for mouse users.

import type { Camera } from './camera'
import type { Point } from './iso'

export interface InputCallbacks {
  onTap(screen: Point, pointerType: string): void
  onHover(screen: Point | null): void
  onCameraChange(): void
}

/** Movement (in CSS pixels) beyond which a press becomes a drag rather than a tap. */
const TAP_SLOP = 8
const TAP_MAX_MS = 600

interface Press {
  start: Point
  last: Point
  startTime: number
  dragging: boolean
}

export class PointerInput {
  private pointers = new Map<number, Press>()
  private pinchDistance = 0
  private pinchMid: Point | null = null
  /** Set once a gesture used two fingers, so lifting them doesn't count as a tap. */
  private multiTouch = false

  private readonly element: HTMLElement
  private readonly camera: Camera
  private readonly callbacks: InputCallbacks

  constructor(element: HTMLElement, camera: Camera, callbacks: InputCallbacks) {
    this.element = element
    this.camera = camera
    this.callbacks = callbacks
    element.addEventListener('pointerdown', this.down)
    element.addEventListener('pointermove', this.move)
    element.addEventListener('pointerup', this.up)
    element.addEventListener('pointercancel', this.cancel)
    element.addEventListener('pointerleave', this.leave)
    element.addEventListener('wheel', this.wheel, { passive: false })
    element.addEventListener('touchend', this.touchEnd, { passive: false })
  }

  destroy(): void {
    this.element.removeEventListener('pointerdown', this.down)
    this.element.removeEventListener('pointermove', this.move)
    this.element.removeEventListener('pointerup', this.up)
    this.element.removeEventListener('pointercancel', this.cancel)
    this.element.removeEventListener('pointerleave', this.leave)
    this.element.removeEventListener('wheel', this.wheel)
    this.element.removeEventListener('touchend', this.touchEnd)
  }

  /**
   * Taps are handled from pointer events. Cancelling the touch's end stops the
   * browser's follow-up click, which would otherwise land on whatever a tap
   * just opened under the finger (such as a tile's panel).
   */
  private touchEnd = (e: TouchEvent): void => {
    if (e.cancelable) e.preventDefault()
  }

  private local(e: PointerEvent | WheelEvent): Point {
    const rect = this.element.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  private down = (e: PointerEvent) => {
    this.element.setPointerCapture?.(e.pointerId)
    const p = this.local(e)
    if (this.pointers.size === 0) this.multiTouch = false
    this.pointers.set(e.pointerId, {
      start: p,
      last: p,
      startTime: performance.now(),
      dragging: false,
    })
    if (this.pointers.size === 2) {
      this.multiTouch = true
      this.startPinch()
    }
  }

  private startPinch() {
    const [a, b] = [...this.pointers.values()]
    if (!a || !b) return
    this.pinchDistance = Math.hypot(a.last.x - b.last.x, a.last.y - b.last.y)
    this.pinchMid = { x: (a.last.x + b.last.x) / 2, y: (a.last.y + b.last.y) / 2 }
  }

  private move = (e: PointerEvent) => {
    const p = this.local(e)
    const press = this.pointers.get(e.pointerId)
    if (!press) {
      if (e.pointerType === 'mouse') this.callbacks.onHover(p)
      return
    }
    if (this.pointers.size >= 2) {
      press.last = p
      const [a, b] = [...this.pointers.values()]
      if (!a || !b || !this.pinchMid) return
      const distance = Math.hypot(a.last.x - b.last.x, a.last.y - b.last.y)
      const mid = { x: (a.last.x + b.last.x) / 2, y: (a.last.y + b.last.y) / 2 }
      if (this.pinchDistance > 0) this.camera.zoomAt(mid.x, mid.y, distance / this.pinchDistance)
      this.camera.panBy(mid.x - this.pinchMid.x, mid.y - this.pinchMid.y)
      this.pinchDistance = distance
      this.pinchMid = mid
      this.callbacks.onCameraChange()
      return
    }
    if (!press.dragging && Math.hypot(p.x - press.start.x, p.y - press.start.y) > TAP_SLOP)
      press.dragging = true
    if (press.dragging) {
      this.camera.panBy(p.x - press.last.x, p.y - press.last.y)
      this.callbacks.onCameraChange()
    }
    press.last = p
    if (e.pointerType === 'mouse') this.callbacks.onHover(p)
  }

  private up = (e: PointerEvent) => {
    const press = this.pointers.get(e.pointerId)
    this.pointers.delete(e.pointerId)
    if (!press) return
    if (this.pointers.size === 1) this.startPinch()
    const quick = performance.now() - press.startTime < TAP_MAX_MS
    if (!press.dragging && !this.multiTouch && quick && this.pointers.size === 0) {
      this.callbacks.onTap(this.local(e), e.pointerType)
    }
  }

  private cancel = (e: PointerEvent) => {
    this.pointers.delete(e.pointerId)
  }

  private leave = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && !this.pointers.has(e.pointerId)) this.callbacks.onHover(null)
  }

  private wheel = (e: WheelEvent) => {
    e.preventDefault()
    const p = this.local(e)
    // Trackpad pinches arrive as wheel events with ctrlKey and need a stronger response.
    const sensitivity = e.ctrlKey ? 0.01 : 0.0015
    this.camera.zoomAt(p.x, p.y, Math.exp(-e.deltaY * sensitivity))
    this.callbacks.onCameraChange()
  }
}
