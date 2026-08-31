<template>
  <div class="element-style-panel">
    <KeepAlive>
      <component :is="currentPanelComponent"></component>
    </KeepAlive>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import { ElementNames } from '@/types/elements'

import TextboxStylePanel from './TextboxStylePanel.vue'
import ImageStylePanel from './ImageStylePanel.vue'
import GifStylePanel from './GifStylePanel.vue'
import PathStylePanel from './PathStylePanel.vue'
import CircleStylePanel from './CircleStylePanel.vue'
import LineStylePanel from './LineStylePanel.vue'
import QRCodeStylePanel from './QRCodeStylePanel.vue'
import BarCodeStylePanel from './BarCodeStylePanel.vue'
import MathStylePanel from './MathStylePanel.vue'
import GroupStylePanel from './GroupStylePanel.vue'

const panelMap = {
  [ElementNames.TEXTBOX]: TextboxStylePanel,
  [ElementNames.TEXT]: TextboxStylePanel,
  [ElementNames.ITEXT]: TextboxStylePanel,
  [ElementNames.INPUTTEXT]: TextboxStylePanel,
  [ElementNames.VERTICALTEXT]: TextboxStylePanel,
  [ElementNames.ARCTEXT]: TextboxStylePanel,
  [ElementNames.IMAGE]: ImageStylePanel,
  [ElementNames.GIFIMAGE]: GifStylePanel,
  [ElementNames.SVGIMAGE]: ImageStylePanel,
  [ElementNames.CROPIMAGE]: ImageStylePanel,
  [ElementNames.PATH]: PathStylePanel,
  [ElementNames.RECT]: PathStylePanel,
  [ElementNames.ELLIPSE]: PathStylePanel,
  [ElementNames.POLYLINE]: PathStylePanel,
  [ElementNames.CIRCLE]: CircleStylePanel,
  [ElementNames.LINE]: LineStylePanel,
  [ElementNames.ARROW]: LineStylePanel,
  [ElementNames.QRCODE]: QRCodeStylePanel,
  [ElementNames.BARCODE]: BarCodeStylePanel,
  [ElementNames.MATH]: MathStylePanel,
  [ElementNames.GROUP]: GroupStylePanel,
  [ElementNames.ACTIVE]: GroupStylePanel,
}

const { canvasObject } = storeToRefs(useMainStore())

const currentPanelComponent = computed(() => {
  if (!canvasObject.value) return null
  const canvasType = canvasObject.value.name ? canvasObject.value.name : canvasObject.value.type
  return panelMap[canvasType.toLowerCase() as ElementNames.TEXT]
})
</script>