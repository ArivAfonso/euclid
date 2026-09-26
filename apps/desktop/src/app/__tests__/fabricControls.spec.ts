import { describe, it, expect } from 'vitest'
import { FabricObject, Textbox } from 'fabric'
import { defaultControls } from '@/app/fabricControls'

// Same wiring as useCanvas: every object shares this control set.
FabricObject.ownDefaults.controls = defaultControls()

/**
 * Minimal stand-in for the fabric canvas: control placement only needs the
 * viewport transform, the current active object and the zoom. Avoiding a real
 * `Canvas` also avoids deferred rendering in jsdom (text drawing requires a
 * browser canvas context).
 */
const makeObject = () => {
  let active: FabricObject | undefined
  const fakeCanvas = {
    viewportTransform: [1, 0, 0, 1, 0, 0],
    getActiveObject: () => active,
    getZoom: () => 1,
    requestRenderAll: () => {},
  }
  const obj = new Textbox('hello', {
    width: 200,
    height: 100,
    left: 100,
    top: 100,
    originX: 'left',
    originY: 'top',
  })
  obj.canvas = fakeCanvas as never
  return {
    obj,
    setActive: (target?: FabricObject) => {
      active = target
    },
  }
}

/** Badge position relative to the element's (rotated) center. */
const badgeOffset = (obj: any) => {
  const badge = obj.oCoords.size
  const center = obj.getCenterPoint()
  return { x: Math.round(badge.x - center.x), y: Math.round(badge.y - center.y) }
}

/** Fabric adds stroke/padding rounding on top of the 18px gap. */
const expectRoughly = (actual: number, expected: number, tolerance = 2) => {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance)
}

describe('app/fabricControls — dimension badge', () => {
  it('hangs below the element (bottom edge) while upright', () => {
    const { obj, setActive } = makeObject()
    setActive(obj)
    obj.setCoords()

    const offset = badgeOffset(obj)
    expectRoughly(offset.x, 0)
    expectRoughly(offset.y, 41) // half height + 18
  })

  it('rotating while already active swaps to the side edge (canvas handles)', () => {
    const { obj, setActive } = makeObject()
    setActive(obj)
    obj.setCoords()

    obj.set({ angle: 90 })
    obj.setCoords()

    const offset = badgeOffset(obj)
    expectRoughly(offset.x, 0)
    expectRoughly(offset.y, 118) // half width + 18 → still below on screen
  })

  it('rotating from the sidebar swaps to the same side (modifedElement path)', () => {
    const { obj, setActive } = makeObject()
    setActive(obj)
    obj.setCoords()

    // templatesStore.modifedElement(): set + setCoords + setActiveObject
    obj.set({ angle: 90, left: 100, top: 100 })
    obj.setCoords()
    setActive(obj)

    const offset = badgeOffset(obj)
    expectRoughly(offset.x, 0)
    expectRoughly(offset.y, 118)
  })

  it('setCoords while NOT active still computes the swapped side (regression)', () => {
    const { obj, setActive } = makeObject()
    setActive(obj)
    obj.setCoords()
    setActive(undefined) // element deselected

    obj.set({ angle: 90 })
    obj.setCoords()
    const whileInactive = badgeOffset(obj)

    setActive(obj)
    obj.setCoords()
    const afterReactivate = badgeOffset(obj)

    // Used to differ: the inactive pass kept stale control values from the
    // last active object, so the badge stayed on the old (bottom) side.
    expect(whileInactive).toEqual(afterReactivate)
    expectRoughly(afterReactivate.x, 0)
    expectRoughly(afterReactivate.y, 118)
  })

  it('stays on the visually-bottom side (via the local top edge) when flipped', () => {
    const { obj, setActive } = makeObject()
    setActive(obj)
    obj.setCoords()

    obj.set({ angle: 180 })
    obj.setCoords()

    const offset = badgeOffset(obj)
    expectRoughly(offset.x, 0)
    expectRoughly(offset.y, 41)
  })
})
