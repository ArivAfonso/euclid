/*
 * @Author: June
 * @Description: 
 * @Date: 2024-04-12 21:10:10
 * @LastEditors: June
 * @LastEditTime: 2024-04-14 10:31:32
 */
import { Image as FabricImage } from 'fabric'
import { EffectItem } from '@/types/common'

/**
 * Stamp directions used to build the outline around an image.
 * The join type controls how the outline behaves at corners:
 * - miter: 8 directions (cardinal + diagonal) -> sharp, mitered corners
 * - bevel: 4 cardinal directions only -> corners are cut at 45deg
 * - round: many directions around the circle -> rounded corners
 */
const getStampDirections = (join: string): [number, number][] => {
  if (join === 'round') {
    const dirs: [number, number][] = []
    const count = 24
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count
      dirs.push([Math.cos(angle), Math.sin(angle)])
    }
    return dirs
  }
  if (join === 'bevel') {
    return [
      [-1, 0],
      [0, -1],
      [1, 0],
      [0, 1],
    ]
  }
  // miter (default)
  return [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
  ]
}

// Bake the outline (stroke) effect into the image source.
export const strokeImage = async (item: EffectItem, fabricImage: FabricImage, type = 'source-over') => {
  const stroke = item.stroke
  const strokeWidth = item.strokeWidth
  const strokeLineJoin = item.strokeLineJoin || 'miter'
  const offsetX = item.isSkew ? item.offsetX || 0 : 0
  const offsetY = item.isSkew ? item.offsetY || 0 : 0

  const w = fabricImage.width, h = fabricImage.height, src = fabricImage.getSrc()
  if (strokeWidth === 0) return
  const canvas: HTMLCanvasElement | null = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const pad = Math.ceil(strokeWidth * 2 + Math.max(Math.abs(offsetX), Math.abs(offsetY)))
  canvas.width = w + pad * 2
  canvas.height = h + pad * 2

  const directions = getStampDirections(strokeLineJoin)
  const img = await addImage(src)
  if (!img) return

  // Base position of the image content; the outline is stamped around it,
  // shifted by the offset so the layer can be displaced from the object.
  const cx = pad
  const cy = pad
  const ox = cx + offsetX
  const oy = cy + offsetY
  for (let i = 0; i < directions.length; i++) {
    const [dx, dy] = directions[i]
    ctx.drawImage(img, ox + dx * strokeWidth, oy + dy * strokeWidth, w, h)
  }
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = stroke
  ctx.lineJoin = strokeLineJoin
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.globalCompositeOperation = type as GlobalCompositeOperation
  ctx.drawImage(img, cx, cy, w, h)
  const res = canvas.toDataURL()
  await fabricImage.setSrc(res)
  fabricImage.canvas?.renderAll()
}

const addImage = async (src: string): Promise<HTMLImageElement | undefined> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject()
    img.src = src;
  })
}