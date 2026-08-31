
import { isDefined } from '@vueuse/core'
import { ObjectRef, Textbox, Object as FabricObject, Rect } from 'fabric'
import { clampAngle, toFixed } from '@/utils/common'
import { isEqual, isNumber } from 'lodash-es'
import { check } from '@/utils/check'
import { ref, watchEffect, computed } from 'vue'
import { useMainStore } from '@/store'
import { storeToRefs } from 'pinia'
import { px2mm, mm2px } from '@/utils/image'
import type { WritableComputedRef } from 'vue'
import NP from 'number-precision'
import useCanvas from '@/views/Canvas/useCanvas'



export default () => {
  const mainStore = useMainStore()
  const { unitMode } = storeToRefs(mainStore)

  const handleUnit = (val: number) => {
    return unitMode.value === 0 ? px2mm(val) : val
  }
  const handleInput = (val: number) => {
    return unitMode.value === 0 ? mm2px(val) : val
  }
  const handleActive = <K extends keyof ObjectRef, T = ObjectRef[K] | undefined>(key: K): WritableComputedRef<{
    modelValue: T
    onSwipe: (value: T) => void
    onChange: (value: T) => void
  }> => {
    const [ canvas ] = useCanvas()
    
    const modelValue = ref()

    // After modifying the input component without pressing Enter, switching objects triggers onChange, causing wrong object value modification
    let lockChange = false

    watchEffect(() => {
      if (!isDefined(canvas.activeObject)) {
        modelValue.value = undefined
        return
      }

      const activeObject = canvas.activeObject.value as FabricObject & Textbox & Rect
      // Lock modification
      lockChange = true

      let value
      switch (key) {
        case 'width':
          value = handleUnit(activeObject.getWidth())
          break

        case 'height':
          value = handleUnit(activeObject.getHeight())
          break

        case 'opacity':
          value = NP.times(activeObject.opacity, 100)
          break

        case 'angle':
          value = clampAngle(activeObject.angle)
          break

        case 'left':
          // console.log('activeObject.getParent(true):', activeObject.getParent(true))
          // value = activeObject.getParent(true) ? handleUnit(activeObject.getLeftTop().x) : handleUnit(activeObject.left)
          value = handleUnit(activeObject.left)
          break

        case 'top':
          // value = activeObject.getParent(true) ? handleUnit(activeObject.getLeftTop().y) : handleUnit(activeObject.top)
          value = handleUnit(activeObject.top)
          break

        case 'fontSize':
          if (check.isTextObject(activeObject)) {
            // Check first and last character style first (fast path for uniform styles)
            const textLen = activeObject.text.length
            if (textLen > 0) {
              const firstStyle = activeObject.getStyleAtPosition(0).fontSize
              const lastStyle = activeObject.getStyleAtPosition(textLen - 1).fontSize
              // Only do full iteration if first and last differ
              if (!isEqual(firstStyle, lastStyle)) {
                value = 'Multiple values'
              } else if (textLen > 2) {
                // Sample the middle to avoid false positives
                const midStyle = activeObject.getStyleAtPosition(Math.floor(textLen / 2)).fontSize
                value = isEqual(firstStyle, midStyle) ? firstStyle : 'Multiple values'
              } else {
                value = firstStyle
              }
            } else {
              value = activeObject.fontSize
            }
          } 
          else {
            value = activeObject[key]
          }
          break

        default:
          // @ts-ignore
          value = activeObject[key]
          break
      }

      modelValue.value = isNumber(value) ? toFixed(value) : value
      requestAnimationFrame(() => (lockChange = false))
    })

    const setObjectValue = (obj: FabricObject, newValue: any) => {
      if (key === 'opacity') {
        newValue = NP.divide(newValue, 100)
      }
      if (obj.get(key) !== newValue) {
        obj.set(key, newValue)
      }
    }

    /**
     * Change value
     */
    const changeValue = (newValue: T, type: 'swipe' | 'change') => {
      const activeObject = canvas.activeObject.value as FabricObject & Textbox
      if (lockChange || !isDefined(activeObject)) return
      if (['width', 'height', 'left', 'top', 'angle'].includes(key)) {
        const currentObject = activeObject
        activeObject.canvas?.discardActiveObject()
        activeObject.set(key, Number(newValue))
        activeObject.canvas?.setActiveObject(currentObject)
        if (type === 'change' && activeObject.group?.updateLayout) {
          activeObject.group.updateLayout()
        }
      }
      else if (
        activeObject.isType<Textbox | Text>('Text', 'Textbox') &&
        ['fontSize'].includes(key) &&
        activeObject.selectionEnd - activeObject.selectionStart > 0
      ) {
        activeObject.setSelectionStyles({
          fontSize: newValue,
        })
      } 
      // Group
      else if (check.isCollection(activeObject) && !['left', 'top', 'visible', 'globalCompositeOperation', 'opacity'].includes(key)) {
        activeObject.forEachObject((obj) => {
          setObjectValue(obj, newValue)
        })
      }
      else {
        setObjectValue(activeObject, newValue)
      }

      canvas.requestRenderAll()
    }

    // return computed(() => ({
    //   disabled: !isDefined(canvas.activeObject.value),
    //   modelValue: modelValue.value as T,
    //   onSwipe: (value: T) => {
    //     changeValue(value, 'swipe')
    //   },
    //   onChange: (value: T) => {
    //     changeValue(value, 'change')
    //     if (!isDefined(canvas.activeObject)) return
    //     canvas.fire('object:modified', { target: canvas.activeObject.value })
    //   },
    // }))
    return computed({
      get() {
        return {
          disabled: !isDefined(canvas.activeObject.value),
          modelValue: modelValue.value as T,
          onSwipe: (value: T) => {
            changeValue(value, 'swipe')
          },
          onChange: (value: T) => {
            changeValue(value, 'change')
            if (!isDefined(canvas.activeObject)) return
            canvas.fire('object:modified', { target: canvas.activeObject.value })
          }
        }
      },
      set() {
        return {
          disabled: !isDefined(canvas.activeObject.value),
          modelValue: modelValue.value as T,
          onSwipe: (value: T) => {
            changeValue(value, 'swipe')
          },
          onChange: (value: T) => {
            changeValue(value, 'change')
            if (!isDefined(canvas.activeObject)) return
            canvas.fire('object:modified', { target: canvas.activeObject.value })
          }
        }
      }
    })
  }

  return {
    handleActive,
    handleInput,
    handleUnit
  }
}