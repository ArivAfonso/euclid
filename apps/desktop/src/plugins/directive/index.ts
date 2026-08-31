import { App } from 'vue'
import Contextmenu from './contextmenu'
import ClickOutside from './clickOutside'
import DropImage from './dropImage'
import { vLoading } from '@/directives/vLoading'

export default {
  install(app: App) {
    app.directive('contextmenu', Contextmenu)
    app.directive('click-outside', ClickOutside)
    app.directive('drop-image', DropImage)
    app.directive('loading', vLoading)
  }
}
