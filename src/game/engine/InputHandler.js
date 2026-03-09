/**
 * Klavye & fare girdi yöneticisi — kamera pan + tıklama
 */

export class InputHandler {
  constructor() {
    this.keys  = new Set()
    this.mouse = { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 }
    this._onKey   = this._onKey.bind(this)
    this._onKeyUp = this._onKeyUp.bind(this)
    this._onMouse = this._onMouse.bind(this)
    this._onClick = this._onClick.bind(this)
    this._canvas  = null
  }

  attach() {
    window.addEventListener('keydown',   this._onKey)
    window.addEventListener('keyup',     this._onKeyUp)
    window.addEventListener('mousemove', this._onMouse)
  }

  attachCanvas(canvas) {
    this._canvas = canvas
    canvas.addEventListener('click', this._onClick)
  }

  detach() {
    window.removeEventListener('keydown',   this._onKey)
    window.removeEventListener('keyup',     this._onKeyUp)
    window.removeEventListener('mousemove', this._onMouse)
    if (this._canvas) this._canvas.removeEventListener('click', this._onClick)
  }

  _onKey(e) {
    this.keys.add(e.code)
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault()
  }

  _onKeyUp(e) { this.keys.delete(e.code) }

  _onMouse(e) { this.mouse.x = e.clientX; this.mouse.y = e.clientY }

  _onClick(e) {
    this.mouse.clicked = true
    this.mouse.clickX  = e.clientX
    this.mouse.clickY  = e.clientY
  }

  isDown(code) { return this.keys.has(code) }

  consumeClick() {
    if (!this.mouse.clicked) return null
    this.mouse.clicked = false
    return { x: this.mouse.clickX, y: this.mouse.clickY }
  }

  /** Kamera hareket vektörü (px/s) */
  get cameraDelta() {
    const S = 300
    let dx = 0, dy = 0
    if (this.isDown('KeyW') || this.isDown('ArrowUp'))    dy += S
    if (this.isDown('KeyS') || this.isDown('ArrowDown'))  dy -= S
    if (this.isDown('KeyA') || this.isDown('ArrowLeft'))  dx += S
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) dx -= S
    return { dx, dy }
  }
}
