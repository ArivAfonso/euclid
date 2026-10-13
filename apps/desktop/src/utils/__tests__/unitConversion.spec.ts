import { describe, expect, it } from 'vitest'
import { DefaultUnitMode, UnitMode, inch2px, px2inch, px2mm, px2unit, unit2px } from '@/utils/image'

describe('utils/image unit conversion', () => {
  it('uses px as the default unit', () => {
    expect(DefaultUnitMode).toBe(UnitMode.PX)
  })

  it('leaves px untouched', () => {
    expect(px2unit(1080, UnitMode.PX)).toBe(1080)
    expect(unit2px(1080, UnitMode.PX)).toBe(1080)
  })

  it('converts px to mm and inch for display', () => {
    expect(px2unit(1080, UnitMode.MM)).toBeCloseTo(px2mm(1080))
    expect(px2unit(1080, UnitMode.INCH)).toBeCloseTo(px2inch(1080))
    // 1080px at 300 DPI is 3.6in
    expect(px2unit(1080, UnitMode.INCH)).toBeCloseTo(3.6)
  })

  it('converts typed values back to px', () => {
    expect(unit2px(3.6, UnitMode.INCH)).toBeCloseTo(1080)
    expect(unit2px(3.6, UnitMode.INCH)).toBeCloseTo(inch2px(3.6))
  })

  it.each([UnitMode.MM, UnitMode.PX, UnitMode.INCH])('round-trips values in unit %i', (mode) => {
    expect(unit2px(px2unit(2440, mode), mode)).toBeCloseTo(2440)
  })

  it('shows a different number for inch than for px', () => {
    // Regression: inch used to fall through and show the raw px value
    expect(px2unit(1080, UnitMode.INCH)).not.toBe(1080)
  })
})
