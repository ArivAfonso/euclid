import { Image, ImageSource, classRegistry, util } from 'fabric';
import 'gifler';

// gifler is a CommonJS bundle that attaches itself to window.gifler
declare global {
  interface Window {
    gifler: any
  }
}

interface GiflerFrame {
  buffer: HTMLCanvasElement
  x: number
  y: number
  width: number
  height: number
}

interface GiflerAnimator {
  width: number
  height: number
  start(): void
  stop(): void
  reset(): void
  onDrawFrame?: (ctx: CanvasRenderingContext2D, frame: GiflerFrame) => void
  animateInCanvas(canvas: HTMLCanvasElement, setDimension?: boolean): void
}

interface GiflerHandle {
  get(callback: (animator: GiflerAnimator) => void): GiflerHandle
  xhr: XMLHttpRequest
}

export class GifImage extends Image {
	static type = 'GifImage'
	public gifCanvas: HTMLCanvasElement | undefined = undefined
	public gifAutoplay: boolean = true
	public isPlaying: boolean = true
	public rx: number = 0
	public ry: number = 0
	public playbackSpeed: number = 1
	private gifAnimator: GiflerAnimator | undefined = undefined
	private giflerHandle: GiflerHandle | undefined = undefined
	private srcToken: number = 0
	public isStarted: boolean = false

  constructor(element: ImageSource, options?: any) {
    super(element, options)
    this.gifCanvas = document.createElement('canvas');
    // Animated frames must always be re-rendered, so never cache this object.
    this.objectCaching = false
    if (typeof options?.gifAutoplay === 'boolean') {
      this.gifAutoplay = options.gifAutoplay
    }
    if (typeof options?.playbackSpeed === 'number') {
      this.playbackSpeed = Math.max(0.1, Math.min(4, options.playbackSpeed))
    }
    this.isPlaying = this.gifAutoplay
    // Stop the animator (and allow a clean restart) when the object leaves the canvas.
    this.on('removed', this.stopAnimation.bind(this))
  }

  /**
   * Returns true if the given source looks like an animated GIF
   */
  static isGif(src: string): boolean {
    if (typeof src !== 'string') return false
    return (
      /^data:image\/gif/i.test(src) ||
      /image\/gif/i.test(src) ||
      /\.gif(\?|#|$)/i.test(src)
    )
  }

  /**
   * Called by gifler for every decoded frame. The frame is painted onto
   * gifCanvas (which gifler has already sized to the full GIF dimensions),
   * then the object's element is pointed at gifCanvas so the next canvas
   * render paints the new frame.
   */
	drawFrame(ctx: CanvasRenderingContext2D, frame: GiflerFrame) {
    if (!this.gifCanvas) return
    ctx.drawImage(frame.buffer, frame.x, frame.y)
    // Swap the element fabric renders with while keeping _originalElement
    // (the original GIF source) intact for serialization.
    ;(this as any)._element = this.gifCanvas
    this.dirty = true
    this.canvas?.requestRenderAll();
	}

	_render(ctx: CanvasRenderingContext2D) {
    // Rounded corners: clip the GIF to a rounded rectangle when rx/ry is set.
    const width = this.width || 0
    const height = this.height || 0
    const rx = this.rx
    const ry = this.ry
    const hasRadius = (rx !== undefined && rx > 0) || (ry !== undefined && ry > 0)
    if (hasRadius && width > 0 && height > 0) {
      const r = Math.min(rx ?? ry ?? 0, width / 2, height / 2)
      ctx.save()
      ctx.beginPath()
      if (typeof (ctx as any).roundRect === 'function') {
        ;(ctx as any).roundRect(-width / 2, -height / 2, width, height, r)
      } else {
        ctx.moveTo(-width / 2 + r, -height / 2)
        ctx.lineTo(width / 2 - r, -height / 2)
        ctx.arcTo(width / 2, -height / 2, width / 2, -height / 2 + r, r)
        ctx.lineTo(width / 2, height / 2 - r)
        ctx.arcTo(width / 2, height / 2, width / 2 - r, height / 2, r)
        ctx.lineTo(-width / 2 + r, height / 2)
        ctx.arcTo(-width / 2, height / 2, -width / 2, height / 2 - r, r)
        ctx.lineTo(-width / 2, -height / 2 + r)
        ctx.arcTo(-width / 2, -height / 2, -width / 2 + r, -height / 2, r)
        ctx.closePath()
      }
      ctx.clip()
      super._render(ctx)
      ctx.restore()
    } else {
      super._render(ctx)
    }
		if (!this.isStarted && this.isPlaying) {
			this.isStarted = true;
			this.startAnimation()
		}
	}

  private startAnimation() {
    if (this.gifAnimator || !this.gifCanvas || !window.gifler) return
    this.isStarted = true
    const token = ++this.srcToken
    try {
      this.giflerHandle = window.gifler(this.getSrc())
      this.giflerHandle.get((animator: GiflerAnimator) => {
        // A newer source was requested while this one was still loading.
        if (token !== this.srcToken || !this.gifCanvas) {
          animator.stop()
          return
        }
        this.gifAnimator = animator
        animator.onDrawFrame = (ctx, frame) => this.drawFrame(ctx, frame)
        animator.animateInCanvas(this.gifCanvas, true)
        this.applyPlaybackSpeed(animator)
        if (!this.isPlaying) {
          animator.stop()
        }
      })
    } catch (error) {
      console.error('Failed to start GIF animation', error)
      this.isStarted = false
    }
  }

  /** Pause the animation (freezes on the current frame). */
  pause() {
    this.isPlaying = false
    if (this.gifAnimator) {
      try {
        this.gifAnimator.stop()
      } catch (error) {
        // ignore
      }
    }
  }

  /** Resume the animation from where it was paused. */
  resume() {
    this.isPlaying = true
    if (this.gifAnimator) {
      try {
        this.gifAnimator.start()
      } catch (error) {
        // ignore
      }
    } else {
      // Animator hasn't loaded yet - let the next render kick it off.
      this.isStarted = false
    }
    this.canvas?.requestRenderAll()
  }

  /** Restart the animation from the first frame. */
  restart() {
    this.isPlaying = true
    if (this.gifAnimator) {
      try {
        this.gifAnimator.reset()
        this.gifAnimator.start()
      } catch (error) {
        // ignore
      }
    } else {
      this.isStarted = false
      this.canvas?.requestRenderAll()
    }
  }

  /** Toggle between playing and paused. */
  togglePlay() {
    if (this.isPlaying) this.pause()
    else this.resume()
  }

  /** Set the playback speed multiplier (0.1x - 4x). 1 = original GIF speed. */
  setPlaybackSpeed(speed: number) {
    const s = Math.max(0.1, Math.min(4, Number(speed) || 1))
    this.playbackSpeed = s
    if (this.gifAnimator) {
      this.applyPlaybackSpeed(this.gifAnimator)
    }
  }

  /**
   * Scale each frame's delay relative to its original value so the animation
   * runs faster (speed > 1) or slower (speed < 1). gifler reads
   * `frame.delay` (in centiseconds) for every frame advance.
   */
  private applyPlaybackSpeed(animator: GiflerAnimator) {
    if (this.playbackSpeed === 1) return
    const frames = (animator as any)._frames
    if (!Array.isArray(frames)) return
    frames.forEach((frame: any) => {
      if (frame && typeof frame.delay === 'number') {
        if (frame._originalDelay === undefined) frame._originalDelay = frame.delay
        frame.delay = frame._originalDelay / this.playbackSpeed
      }
    })
  }

  /** Replace the GIF source and restart animation with the new one. */
  async replaceGif(src: string) {
    this.stopAnimation()
    try {
      await this.setSrc(src)
    } catch (error) {
      console.error('Failed to load replacement GIF', error)
      return
    }
    this.gifAutoplay = true
    this.isPlaying = true
    this.dirty = true
    this.setCoords()
    this.startAnimation()
    this.canvas?.requestRenderAll()
  }

  stopAnimation() {
    if (this.gifAnimator) {
      try {
        this.gifAnimator.stop()
      } catch (error) {
        // ignore stop errors
      }
      this.gifAnimator = undefined
    }
    this.isStarted = false
  }

  dispose() {
    this.stopAnimation()
    super.dispose()
  }

	static fromURL(url: string, options: any = {}): Promise<GifImage> {
    return util.loadImage(url, { crossOrigin: options.crossOrigin }).then((img) => new this(img, options));
  }
}

classRegistry.setClass(GifImage)
