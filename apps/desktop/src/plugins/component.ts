import { App } from 'vue'

import FileInput from '@/components/FileInput.vue'
import ColorPicker from '@/components/ColorPicker/index.vue'
import ColorButton from '@/components/ColorButton.vue'
import TextColorButton from '@/components/TextColorButton.vue'
import FullscreenSpin from '@/components/FullscreenSpin.vue'
import LinePointMarker from '@/components/LinePointMarker.vue'
import FileUpload from '@/components/FileUpload/index.vue'
import FileExport from '@/components/FileExport/index.vue'
import HomePopover from '@/components/HomePopover.vue'
import NumberComboBox from '@/components/NumberComboBox.vue'

const components = {
  FileInput,
  ColorButton,
  TextColorButton,
  ColorPicker,
  FullscreenSpin,
  LinePointMarker,
  FileUpload,
  FileExport,
  HomePopover,
  NumberComboBox
}

export default {
  install(app: App) {
    for (const key of Object.keys(components)) {
      app.component(key, components[key as keyof typeof components])
    }
  }
}
