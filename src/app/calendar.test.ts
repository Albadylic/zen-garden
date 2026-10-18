import { describe, expect, it } from 'vitest'
import { currentMonth, hemisphereOfZone } from './calendar'

describe('the calendar', () => {
  it('guesses the hemisphere from the time zone, northern when unsure', () => {
    expect(hemisphereOfZone('Europe/London')).toBe('north')
    expect(hemisphereOfZone('Asia/Tokyo')).toBe('north')
    expect(hemisphereOfZone('Australia/Sydney')).toBe('south')
    expect(hemisphereOfZone('Pacific/Auckland')).toBe('south')
    expect(hemisphereOfZone('America/Argentina/Buenos_Aires')).toBe('south')
    expect(hemisphereOfZone('Africa/Johannesburg')).toBe('south')
    expect(hemisphereOfZone(undefined)).toBe('north')
  })

  it('reads the month from the device clock', () => {
    expect(currentMonth(new Date(2026, 9, 17).getTime())).toBe(9)
  })
})
