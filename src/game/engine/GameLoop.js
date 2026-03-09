/**
 * Ana oyun döngüsü (requestAnimationFrame tabanlı)
 */

export class GameLoop {
  constructor(updateFn, renderFn) {
    this.updateFn = updateFn
    this.renderFn = renderFn
    this._running = false
    this._lastTime = 0
    this._animId = null
    this._tick = 0
  }

  start() {
    if (this._running) return
    this._running = true
    this._lastTime = performance.now()
    this._animId = requestAnimationFrame(this._loop.bind(this))
  }

  stop() {
    this._running = false
    if (this._animId) {
      cancelAnimationFrame(this._animId)
      this._animId = null
    }
  }

  _loop(now) {
    if (!this._running) return

    const rawDelta = (now - this._lastTime) / 1000  // saniye
    const delta = Math.min(rawDelta, 0.05)           // max 50ms (lag spike koruması)
    this._lastTime = now
    this._tick++

    this.updateFn(delta, this._tick)
    this.renderFn(delta, this._tick)

    this._animId = requestAnimationFrame(this._loop.bind(this))
  }

  get isRunning() { return this._running }
  get tick() { return this._tick }
}
