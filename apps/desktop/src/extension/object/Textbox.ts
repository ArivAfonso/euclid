import { Textbox as OriginTextbox, classRegistry, Text } from "fabric"
import { EffectItem } from "@/types/common"
import type { Abortable } from 'fabric'
import { CENTER, RIGHT, LEFT, DEFAULT_SVG_FONT_SIZE } from "../constants"

export class Textbox extends OriginTextbox {

  public effects?: EffectItem[];

  constructor(text: string, options?: any) {
    super(text, options);
    this.effects = options.effects
  }

  enlargeSpaces() {
    let diffSpace,
      currentLineWidth,
      numberOfSpaces,
      accumulatedSpace,
      line,
      charBound,
      spaces;
    for (let i = 0, len = this._textLines.length; i < len; i++) {
      if (this.textAlign !== 'justify' && (i === len - 1 || this.isEndOfWrapping(i))) {
        continue;
      }
      accumulatedSpace = 0;
      line = this._textLines[i];
      currentLineWidth = this.getLineWidth(i);
      if (currentLineWidth < this.width && (spaces = this.textLines[i].split(''))) {
        
        numberOfSpaces = spaces.length - 1;
        diffSpace = (this.width - currentLineWidth) / numberOfSpaces;
        for (let j = 0; j <= line.length; j++) {
          charBound = this.__charBounds[i][j];
          charBound.width += diffSpace;
          charBound.kernedWidth += diffSpace;
          charBound.left += accumulatedSpace;
          accumulatedSpace += diffSpace;
        }
      }
    }
  }

  renderEffects() {
    // Effects are baked at render time (per-character), so the object must be
    // marked dirty for the change to be picked up from the render cache.
    this.set('dirty', true)
    this.canvas?.renderAll()
  }

  // Expand the render-cache canvas so offset strokes / shadows are not clipped.
  _getCacheCanvasDimensions() {
    const dims = super._getCacheCanvasDimensions()
    const pad = this._effectsCachePadding()
    if (pad > 0) {
      dims.width = Math.ceil(dims.width + pad * 2)
      dims.height = Math.ceil(dims.height + pad * 2)
      dims.x = dims.x + pad * 2
      dims.y = dims.y + pad * 2
    }
    return dims
  }

  private _effectsCachePadding(): number {
    if (!this.effects || this.effects.length === 0) return 0
    let pad = 0
    for (const item of this.effects) {
      if (item.visible === false) continue
      if (item.type === 1) {
        const blur = item.blur || 0
        pad = Math.max(pad, blur + Math.max(Math.abs(item.offsetX || 0), Math.abs(item.offsetY || 0)))
      } else {
        const halfWidth = (item.strokeWidth || 0) / 2
        const ox = item.isSkew ? Math.abs(item.offsetX || 0) : 0
        const oy = item.isSkew ? Math.abs(item.offsetY || 0) : 0
        pad = Math.max(pad, halfWidth + Math.max(ox, oy))
      }
    }
    return pad
  }

  _renderChar(method: "fillText" | "strokeText", ctx: CanvasRenderingContext2D, lineIndex: number, charIndex: number, _char: string, left: number, top: number): void {
    if (this.effects && this.effects.length > 0) {
      for (let i = this.effects.length - 1; i >= 0; i--) {
        const item = this.effects[i]
        if (item.visible === false) continue
        if (item.type === 1) {
          // Shadow layer: drawn on the fill pass so it sits behind the glyphs.
          if (method !== 'fillText') continue
          ctx.save();
          ctx.fillStyle = typeof this.fill === 'string' ? this.fill : '#000000';
          ctx.shadowColor = item.shadowColor || 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = item.blur || 0;
          ctx.shadowOffsetX = item.offsetX || 0;
          ctx.shadowOffsetY = item.offsetY || 0;
          ctx.fillText(_char, left, top);
          ctx.restore()
        } else {
          // Stroke layer with optional offset and corner join.
          ctx.save();
          if (item.isSkew) {
            ctx.translate(item.offsetX || 0, item.offsetY || 0);
          }
          ctx.strokeStyle = item.stroke;
          ctx.lineJoin = item.strokeLineJoin || 'miter';
          ctx.lineWidth = item.strokeWidth;
          ctx.strokeText(_char, left, top);
          ctx.restore()
        }
      }
    }
    super._renderChar(method, ctx, lineIndex, charIndex, _char, left, top)
  }

}

classRegistry.setClass(Textbox)
classRegistry.setSVGClass(Textbox)