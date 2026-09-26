import { describe, expect, it } from 'vitest'
import { Templates } from '@/lib/mocks/templates'

describe('lib/mocks/templates', () => {
  it('provides exactly one default document', () => {
    expect(Array.isArray(Templates)).toBe(true)
    expect(Templates).toHaveLength(1)
  })

  it('describes a 1920x1080 blank page at 50% zoom', () => {
    const [template] = Templates

    expect(template.id).toBe('blank_template')
    expect(template.width).toBe(1920)
    expect(template.height).toBe(1080)
    expect(template.zoom).toBe(0.5)
  })

  it('ships a non-selectable workspace rect sized to the page', () => {
    const [template] = Templates
    const workspace = template.objects.find((obj) => obj.id === 'WorkSpaceDrawType')

    expect(workspace).toBeTruthy()
    expect(workspace!.width).toBe(1920)
    expect(workspace!.height).toBe(1080)
    expect(workspace!.selectable).toBe(false)
    expect(workspace!.evented).toBe(false)
  })

  it('keeps workSpace metadata consistent with the template size', () => {
    const [template] = Templates

    expect(template.workSpace).toBeTruthy()
    expect(template.workSpace!.fill).toBe('#ffffff')
    expect(template.background).toBe('rgba(255,255,255,0)')
  })

  it('is safely serializable for storage', () => {
    const roundTripped = JSON.parse(JSON.stringify(Templates))
    expect(roundTripped).toEqual(Templates)
    expect(() => structuredClone(Templates)).not.toThrow()
  })
})
