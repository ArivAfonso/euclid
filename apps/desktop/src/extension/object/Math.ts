import { Object as FabricObject, Image, classRegistry, ImageSource } from "fabric"
import { MathProps } from "@/types/canvas"

export class Math extends Image {
  constructor(element: ImageSource, options?: FabricObject<MathProps>) {
    super(element, { filters: [], ...options })
  }
}

classRegistry.setClass(Math, 'Math')
