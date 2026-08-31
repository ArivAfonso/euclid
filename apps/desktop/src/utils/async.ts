/**
 * A disposable object
 */
export interface IDisposable {
    /** Release process */
    dispose(): void
  }
  
  /**
   * Execute the callback the next time the browser is idle, returning an
   * {@link IDisposable} that will cancel the callback when disposed. This wraps
   * [requestIdleCallback] so it will fallback to [setTimeout] if the environment
   * doesn't support it.
   *
   * @param callback The callback to run when idle, this includes an
   * [IdleDeadline] that provides the time alloted for the idle callback by the
   * browser. Not respecting this deadline will result in a degraded user
   * experience.
   * @param timeout A timeout at which point to queue no longer wait for an idle
   * callback but queue it on the regular event loop (like setTimeout). Typically
   * this should not be used.
   *
   * [IdleDeadline]: https://developer.mozilla.org/en-US/docs/Web/API/IdleDeadline
   * [requestIdleCallback]: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
   * [setTimeout]: https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout
   */
  export let runWhenIdle: (callback: (idle: IdleDeadline) => void, timeout?: number) => IDisposable
  
  declare function requestIdleCallback(
    callback: (args: IdleDeadline) => void,
    options?: { timeout: number },
  ): number
  declare function cancelIdleCallback(handle: number): void
  
  if (typeof requestIdleCallback !== 'function' || typeof cancelIdleCallback !== 'function') {
    runWhenIdle = (runner) => {
      setTimeout(() => {
        if (disposed) {
          return
        }
        const end = Date.now() + 15 // one frame at 64fps
        runner(
          Object.freeze({
            didTimeout: true,
            timeRemaining() {
              return Math.max(0, end - Date.now())
            },
          }),
        )
      })
      let disposed = false
      return {
        dispose() {
          if (disposed) {
            return
          }
          disposed = true
        },
      }
    }
  } else {
    runWhenIdle = (runner, timeout?) => {
      const handle: number = requestIdleCallback(
        runner,
        typeof timeout === 'number' ? { timeout } : undefined,
      )
      let disposed = false
      return {
        dispose() {
          if (disposed) {
            return
          }
          disposed = true
          cancelIdleCallback(handle)
        },
      }
    }
  }
  
  /**
   * Yield control back to the browser's event loop, allowing pending UI work
   * (paints, event handlers, etc.) to be processed before continuing.
   * Uses MessageChannel for minimum delay (≈0ms) vs setTimeout(0) which is throttled to ≈4ms.
   */
  export const yieldToMain = (): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof MessageChannel !== 'undefined') {
        const channel = new MessageChannel()
        channel.port1.onmessage = () => resolve()
        channel.port2.postMessage(null)
      } else {
        setTimeout(resolve, 0)
      }
    })
  }
  
  /**
   * Yield control until the next paint frame.
   * Unlike yieldToMain (which only yields to the event loop), this guarantees
   * the browser has actually painted before the promise resolves.
   * Use this before running heavy synchronous work so the user sees UI updates
   * (like a "Saving..." indicator) before the freeze.
   */
  export const yieldToPaint = (): Promise<void> => {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        // Double rAF: the first fires before paint (layout complete),
        // the second fires after the paint has been committed.
        requestAnimationFrame(() => resolve())
      })
    })
  }
  
  /**
   * An implementation of the "idle-until-urgent"-strategy as introduced
   * Defer computation to run when the browser is idle, which can avoid executing computation operations when the browser is not idle, thus improving page performance.
   * here: https://philipwalton.com/articles/idle-until-urgent/
   */
  export class IdleValue<T> {
    private readonly _executor: () => void
    private readonly _handle: IDisposable
  
    private _didRun = false
    private _value?: T
    private _error: unknown
  
    constructor(executor: () => T) {
      this._executor = () => {
        try {
          this._value = executor()
        } catch (err) {
          this._error = err
        } finally {
          this._didRun = true
        }
      }
      this._handle = runWhenIdle(() => this._executor())
    }
  
    /** Used to dispose the object */
    dispose(): void {
      this._handle.dispose()
    }
  
    /** Used to get the computed value */
    get value(): T {
      if (!this._didRun) {
        this._handle.dispose()
        this._executor()
      }
      if (this._error) {
        throw this._error
      }
      return this._value!
    }
  
    /** Used to check if the object's value has been initialized */
    get isInitialized(): boolean {
      return this._didRun
    }
  }
  
  //#endregion
  