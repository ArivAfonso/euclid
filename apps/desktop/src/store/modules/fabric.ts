import { defineStore } from "pinia"
import {  Point } from "fabric/fabric-impl"
import { verticalLine, horizontalLine } from "@/types/elements"


export interface IFabricState {
  wrapperRef: null | HTMLDivElement
  canvasRef: null | HTMLCanvasElement
  zoom: number
  clip: number       // Bleed size
  safe: number       // Safe margin
  round: number      // Corner radius
  diagonal: number   // Diagonal line
  opacity: number    // Mask opacity 0-1
  showClip: boolean  // Show crop marks
  showSafe: boolean  // Show safe margin
  isDragging: boolean
  isDrawing: boolean
  isCropping: boolean
  isTexting: boolean
  isCtrlKey: boolean
  isModifed: boolean
  isChecked: boolean
  verticalLines: verticalLine[]
  horizontalLines: horizontalLine[]
  elementCoords: Point[]
  elementHover: string
  scalePercentage: number
  mouseX: number
  mouseY: number
}

export const useFabricStore = defineStore({
  id: "fabricStore",
  state: (): IFabricState => {
    return {
      wrapperRef: null,
      canvasRef: null,
      zoom: 1,
      clip: 2,
      safe: 5,
      round: 0,
      diagonal: 18,
      opacity: 0.1,
      showClip: false,
      showSafe: false,
      isDragging: false,
      isDrawing: false,
      isTexting: false,
      isCropping: false,
      isCtrlKey: false,
      isModifed: false,
      isChecked: false,
      verticalLines: [],
      horizontalLines: [],
      elementCoords: [],
      elementHover: '',
      scalePercentage: 80,
      mouseX: 0,
      mouseY: 0,
    }
  },
  getters: {

  },
  actions: {
    getWidth() {
      return this.wrapperRef?.offsetWidth || (window.innerWidth - 420)
    },
    getHeight() {
      return this.wrapperRef?.offsetHeight || (window.innerHeight - 40)
    },
    // setMouseFrom(data: { x?: number; y?: number; pressure?: number }) {
    //   Object.assign(this.mouseFrom, data)
    // },
    setZoom(val: number) {
      this.zoom = val
    },
    setCanvasPercentage(val: number) {
      this.scalePercentage = val
    },
    // setFreeDrawPoints(data: { x?: number; y?: number; pressure?: number }) {
    //   Object.assign(this.freeDrawPoints || {}, data)
    // },
    // Whether dragging
    setIsDraggingState(flag: boolean) {
      this.isDragging = flag
    },
  },
})
