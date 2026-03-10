/**
 * Ana Renderer — alt renderer modüllerini koordine eder
 *
 * Sorumluluklar:
 *  - Canvas yönetimi (boyutlandırma, temizleme, kamera)
 *  - Alt rendererlara delege (MapRenderer, BuildingRenderer, ResourceRenderer)
 *  - Tıklama tespiti (PickingSystem)
 *  - Gece overlay'i
 */

import { ISO } from '../utils/IsometricUtils.js'
import { MapRenderer }      from './renderers/MapRenderer.js'
import { BuildingRenderer }  from './renderers/BuildingRenderer.js'
import { ResourceRenderer }  from './renderers/ResourceRenderer.js'
import { PickingSystem }     from './renderers/PickingSystem.js'

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx    = canvas.getContext('2d')
    this.camera = { x: 0, y: 0 }

    // Alt rendererlar
    this.mapRenderer      = new MapRenderer(this.ctx)
    this.buildingRenderer = new BuildingRenderer(this.ctx)
    this.resourceRenderer = new ResourceRenderer(this.ctx)
    this.pickingSystem    = new PickingSystem()
  }

  resize(w, h) { this.canvas.width = w; this.canvas.height = h }

  centerOn(tx, ty) {
    const sc = ISO.toScreen(tx, ty)
    this.camera.x = this.canvas.width  / 2 - sc.x
    this.camera.y = this.canvas.height / 2 - sc.y
  }

  pan(dx, dy) { this.camera.x += dx; this.camera.y += dy }

  clear() {
    this.ctx.fillStyle = '#020810'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  // ── Görünür tile aralığı ──
  _visibleRange(map) {
    const cw = this.canvas.width, ch = this.canvas.height
    const mg = 3
    const tl = ISO.toTile(0,  0,  this.camera.x, this.camera.y)
    const tr = ISO.toTile(cw, 0,  this.camera.x, this.camera.y)
    const bl = ISO.toTile(0,  ch, this.camera.x, this.camera.y)
    const br = ISO.toTile(cw, ch, this.camera.x, this.camera.y)
    const txs = [tl.tx, tr.tx, bl.tx, br.tx]
    const tys = [tl.ty, tr.ty, bl.ty, br.ty]
    return {
      x0: Math.max(0,            Math.min(...txs) - mg),
      y0: Math.max(0,            Math.min(...tys) - mg),
      x1: Math.min(map.width  - 1, Math.max(...txs) + mg),
      y1: Math.min(map.height - 1, Math.max(...tys) + mg),
    }
  }

  // ── Harita ──
  drawMap(map, animTick = 0) {
    const range = this._visibleRange(map)
    this.mapRenderer.draw(map, this.camera, range, animTick)
  }

  // ── Kaynak düğümleri ──
  drawResourceNodes(nodes, animTick = 0, deployMode = false) {
    this.resourceRenderer.draw(nodes, this.camera, animTick, deployMode)
  }

  // ── Bağlantılar ──
  drawConnections(buildings, connections, animTick = 0) {
    this.buildingRenderer.drawConnections(buildings, connections, this.camera, animTick)
  }

  // ── Binalar ──
  drawBuildings(buildings, connectedIds, animTick = 0, selectedId = null) {
    this.buildingRenderer.drawAll(buildings, connectedIds, this.camera, animTick, selectedId)
  }

  // ── Gece karartması ──
  drawNightOverlay(darkness) {
    if (!darkness || darkness <= 0) return
    this.ctx.fillStyle = 'rgba(0,5,25,' + darkness.toFixed(2) + ')'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  // ── Tıklama tespiti (delegasyon) ──
  findNodeAtScreen(sx, sy, nodes, threshold = 18) {
    return this.pickingSystem.findNodeAtScreen(sx, sy, nodes, this.camera, threshold)
  }

  findBuildingAtScreen(sx, sy, buildings) {
    return this.pickingSystem.findBuildingAtScreen(sx, sy, buildings, this.camera)
  }
}
