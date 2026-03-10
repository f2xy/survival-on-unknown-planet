/**
 * Bina render sistemi
 * Dome, flat ve özel binalar (Kurtarma Kapsülü) için izometrik çizim
 */

import { ISO } from '../../utils/IsometricUtils.js'
import { BUILDING_TYPES } from '@/data/buildings.js'
import { darken, lerpColor, drawGlow } from './ColorUtils.js'

const hw = ISO.TILE_W / 2
const hh = ISO.TILE_H / 2

// Bina sprite görselleri — modül yüklenince ön belleğe al
const _imgs = {}
;(function preloadBuildingImages() {
  const img = new Image()
  img.src = '/assets/rescue_capsule.png'
  _imgs.rescueCapsule = img
})()

/** İzometrik bina footprint köşelerini hesapla */
function isoFootprint(sc, W, H) {
  return {
    back:  { x: sc.x,                  y: sc.y - hh },
    right: { x: sc.x + W * hw,         y: sc.y + (W - 1) * hh },
    front: { x: sc.x + (W - H) * hw,   y: sc.y + (W + H - 1) * hh },
    left:  { x: sc.x - H * hw,         y: sc.y + (H - 1) * hh },
    cx:    sc.x + (W - H) * hw / 2,
  }
}

export { isoFootprint }

export class BuildingRenderer {
  constructor(ctx) {
    this.ctx = ctx
  }

  /** Bağlantı çizgilerini çizer */
  drawConnections(buildings, connections, camera, animTick = 0) {
    const { ctx } = this
    ctx.save()
    ctx.strokeStyle    = 'rgba(0,229,255,0.18)'
    ctx.lineWidth      = 1.5
    ctx.setLineDash([5, 5])
    ctx.lineDashOffset = -(animTick * 0.3) % 10
    for (const conn of connections) {
      const b1 = buildings.find(b => b.id === conn.from)
      const b2 = buildings.find(b => b.id === conn.to)
      if (!b1 || !b2) continue
      const def1 = BUILDING_TYPES[b1.type], def2 = BUILDING_TYPES[b2.type]
      const c1 = ISO.toScreen(b1.tx + (def1?.tileW ?? 1)/2, b1.ty + (def1?.tileH ?? 1)/2, camera.x, camera.y)
      const c2 = ISO.toScreen(b2.tx + (def2?.tileW ?? 1)/2, b2.ty + (def2?.tileH ?? 1)/2, camera.x, camera.y)
      ctx.beginPath(); ctx.moveTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y); ctx.stroke()
    }
    ctx.setLineDash([]); ctx.restore()
  }

  /** Tüm binaları derinlik sırasıyla çizer */
  drawAll(buildings, connectedIds, camera, animTick = 0, selectedId = null) {
    const sorted = [...buildings].sort((a, b) => ISO.depthSort(a, b))
    for (const b of sorted) this._drawBuilding(b, connectedIds.has(b.id), camera, animTick, b.id === selectedId)
  }

  _drawBuilding(building, isConnected, camera, animTick, isSelected) {
    const { ctx } = this
    const def = BUILDING_TYPES[building.type]
    if (!def) return

    const W  = def.tileW, H = def.tileH
    const sc = ISO.toScreen(building.tx, building.ty, camera.x, camera.y)
    const fp = isoFootprint(sc, W, H)
    const bh = def.drawH ?? 24
    const cp = building.constructProgress / 100
    ctx.globalAlpha = isConnected ? cp : cp * 0.45

    // Zemin gölgesi
    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.beginPath()
    ctx.moveTo(fp.back.x + 2, fp.back.y + 5)
    ctx.lineTo(fp.right.x + 2, fp.right.y + 5)
    ctx.lineTo(fp.front.x + 2, fp.front.y + 5)
    ctx.lineTo(fp.left.x + 2, fp.left.y + 5)
    ctx.closePath(); ctx.fill()

    if (def.flat || def.isDecoration) {
      this._drawFlat(ctx, fp, def, building, bh, isSelected, animTick)
    } else if (building.type === 'RESCUE_CAPSULE') {
      this._drawRescueCapsule(ctx, fp, def, building, bh, isSelected, animTick)
    } else {
      this._drawDome(ctx, fp, def, building, bh, isSelected, animTick)
    }

    // İnşa ilerleme çubuğu
    if (building.constructProgress < 100) {
      ctx.globalAlpha = 1
      const barY = fp.back.y - bh - 18
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(fp.cx - 22, barY, 44, 5)
      ctx.fillStyle = '#00e5ff';         ctx.fillRect(fp.cx - 22, barY, 44 * cp, 5)
      ctx.fillStyle = '#00e5ff'; ctx.font = '8px Orbitron,monospace'
      ctx.fillText(Math.round(cp * 100) + '%', fp.cx - 8, barY - 3)
    }

    ctx.globalAlpha = 1
  }

  _drawDome(ctx, fp, def, building, bh, isSelected, animTick) {
    const { back, right, front, left, cx } = fp
    const apex = { x: cx, y: back.y - bh }

    ctx.fillStyle = darken(def.color.top, 0.38)
    ctx.beginPath()
    ctx.moveTo(back.x, back.y); ctx.lineTo(right.x, right.y)
    ctx.lineTo(front.x, front.y); ctx.lineTo(left.x, left.y)
    ctx.closePath(); ctx.fill()

    ctx.fillStyle = def.color.sideL
    ctx.beginPath()
    ctx.moveTo(apex.x, apex.y)
    ctx.quadraticCurveTo(left.x, back.y, left.x, left.y)
    ctx.quadraticCurveTo((left.x + back.x) / 2, (left.y + back.y) / 2 + 4, back.x, back.y)
    ctx.closePath(); ctx.fill()

    ctx.fillStyle = lerpColor(def.color.sideR, def.color.top, 0.4)
    ctx.beginPath()
    ctx.moveTo(apex.x, apex.y)
    ctx.quadraticCurveTo(right.x, back.y, right.x, right.y)
    ctx.quadraticCurveTo((right.x + back.x) / 2, (right.y + back.y) / 2 + 4, back.x, back.y)
    ctx.closePath(); ctx.fill()

    ctx.fillStyle = lerpColor(def.color.sideL, def.color.top, 0.25)
    ctx.beginPath()
    ctx.moveTo(apex.x, apex.y); ctx.lineTo(left.x, left.y)
    ctx.quadraticCurveTo((left.x + front.x) / 2, front.y, front.x, front.y)
    ctx.quadraticCurveTo((front.x + apex.x) / 2, front.y - bh * 0.5, apex.x, apex.y)
    ctx.closePath(); ctx.fill()

    ctx.fillStyle = def.color.top
    ctx.beginPath()
    ctx.moveTo(apex.x, apex.y); ctx.lineTo(right.x, right.y)
    ctx.quadraticCurveTo((right.x + front.x) / 2, front.y, front.x, front.y)
    ctx.quadraticCurveTo((front.x + apex.x) / 2, front.y - bh * 0.5, apex.x, apex.y)
    ctx.closePath(); ctx.fill()

    const coreGlow = BUILDING_TYPES[building.type]?.isCore
    const glowR = coreGlow ? (10 + Math.sin(animTick * 0.04) * 3) : 5
    ctx.strokeStyle = def.color.accent
    ctx.lineWidth   = coreGlow ? 1.5 : 0.8
    ctx.shadowColor = def.color.accent
    ctx.shadowBlur  = coreGlow ? (12 + Math.sin(animTick * 0.04) * 4) : 4
    ctx.beginPath(); ctx.arc(apex.x, apex.y, glowR, 0, Math.PI * 2); ctx.stroke()
    ctx.shadowBlur = 0

    if (isSelected) this._drawSelection(ctx, fp, animTick)
  }

  _drawRescueCapsule(ctx, fp, def, building, bh, isSelected, animTick) {
    const { back, right, front, left, cx } = fp
    const baseH  = bh * 0.42
    const apex   = { x: cx, y: back.y - bh }
    const antTip = { x: cx, y: apex.y - 28 }
    const bBk = { x: back.x,  y: back.y  - baseH }
    const bRt = { x: right.x, y: right.y - baseH }
    const bFt = { x: front.x, y: front.y - baseH }
    const bLt = { x: left.x,  y: left.y  - baseH }

    const gCx = (back.x + front.x) / 2
    const gCy = (back.y + front.y) / 2 + 4
    drawGlow(ctx, gCx, gCy, '#00e5ff', 0.08 + Math.sin(animTick * 0.04) * 0.05, 72)

    const img = _imgs.rescueCapsule
    if (img?.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, back.x - 110, back.y + 16 - 90, 220, 200)
    } else {
      this._drawDome(ctx, fp, def, building, bh, isSelected, animTick)
      return
    }

    // Ekvatör bandı dönen parlayan nokta
    const bandPts = [bBk, bRt, bFt, bLt, bBk]
    const bPhase  = (animTick * 0.02) % 1
    const bSeg    = Math.floor(bPhase * 4)
    const bT      = (bPhase * 4) % 1
    const bDotX   = bandPts[bSeg].x + (bandPts[bSeg + 1].x - bandPts[bSeg].x) * bT
    const bDotY   = bandPts[bSeg].y + (bandPts[bSeg + 1].y - bandPts[bSeg].y) * bT
    ctx.fillStyle = def.color.accent; ctx.shadowColor = def.color.accent; ctx.shadowBlur = 10
    ctx.beginPath(); ctx.arc(bDotX, bDotY, 2.5, 0, Math.PI * 2); ctx.fill()
    ctx.shadowBlur = 0

    const scanR = 0.5 + Math.sin(animTick * 0.025) * 0.38
    ctx.strokeStyle = 'rgba(0,229,255,0.22)'; ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(right.x + (bRt.x - right.x) * scanR, right.y + (bRt.y - right.y) * scanR)
    ctx.lineTo(front.x + (bFt.x - front.x) * scanR, front.y + (bFt.y - front.y) * scanR)
    ctx.stroke()

    const drawX = back.x - 110, drawY = back.y + 16 - 90
    const pw = [
      [drawX + 168, drawY + 128, -0.47],
      [drawX + 148, drawY + 142, -0.47],
    ]
    for (const [px, py, ang] of pw) {
      const wP = Math.sin(animTick * 0.06 + px * 0.08) * 0.15
      ctx.shadowColor = def.color.accent; ctx.shadowBlur = 6 + wP * 22
      ctx.strokeStyle = `rgba(0,229,255,${0.3 + wP})`; ctx.lineWidth = 1.2
      ctx.beginPath(); ctx.ellipse(px, py, 16, 6, ang, 0, Math.PI * 2); ctx.stroke()
    }
    ctx.shadowBlur = 0

    const pulse = Math.sin(animTick * 0.05)
    ctx.shadowColor = def.color.accent; ctx.shadowBlur = 24 + pulse * 10
    ctx.strokeStyle = `rgba(128,240,255,${0.3 + pulse * 0.12})`; ctx.lineWidth = 1.6
    ctx.beginPath(); ctx.arc(apex.x, apex.y, 13 + pulse * 2.5, 0, Math.PI * 2); ctx.stroke()
    ctx.shadowBlur = 0

    const blinkA = 0.5 + Math.sin(animTick * 0.12) * 0.5
    ctx.fillStyle = `rgba(128,240,255,${blinkA})`
    ctx.shadowColor = def.color.accent; ctx.shadowBlur = 8 + Math.sin(animTick * 0.12) * 6
    ctx.beginPath(); ctx.arc(antTip.x, antTip.y, 3, 0, Math.PI * 2); ctx.fill()
    ctx.shadowBlur = 0

    for (let i = 0; i < 3; i++) {
      const prog  = ((animTick * 0.022 + i / 3) % 1)
      const ringR = 3 + prog * 28
      const alpha = (1 - prog) * 0.52
      ctx.strokeStyle = `rgba(0,229,255,${alpha})`; ctx.lineWidth = 1
      ctx.beginPath()
      ctx.ellipse(antTip.x, antTip.y, ringR, ringR * 0.3, 0, 0, Math.PI * 2)
      ctx.stroke()
    }

    if (isSelected) this._drawSelection(ctx, fp, animTick)
  }

  _drawFlat(ctx, fp, def, building, bh, isSelected, animTick) {
    const { back, right, front, left } = fp

    ctx.fillStyle = def.color.top
    ctx.beginPath()
    ctx.moveTo(back.x, back.y); ctx.lineTo(right.x, right.y)
    ctx.lineTo(front.x, front.y); ctx.lineTo(left.x, left.y)
    ctx.closePath(); ctx.fill()

    ctx.fillStyle = def.color.sideL
    ctx.beginPath()
    ctx.moveTo(left.x, left.y); ctx.lineTo(front.x, front.y)
    ctx.lineTo(front.x, front.y + bh); ctx.lineTo(left.x, left.y + bh)
    ctx.closePath(); ctx.fill()

    ctx.fillStyle = def.color.sideR
    ctx.beginPath()
    ctx.moveTo(right.x, right.y); ctx.lineTo(front.x, front.y)
    ctx.lineTo(front.x, front.y + bh); ctx.lineTo(right.x, right.y + bh)
    ctx.closePath(); ctx.fill()

    ctx.fillStyle = def.color.top
    ctx.beginPath()
    ctx.moveTo(back.x, back.y - bh); ctx.lineTo(right.x, right.y - bh)
    ctx.lineTo(front.x, front.y - bh); ctx.lineTo(left.x, left.y - bh)
    ctx.closePath(); ctx.fill()

    if (building.type === 'SOLAR_PANEL') {
      ctx.strokeStyle = def.color.accent
      ctx.lineWidth   = 0.6
      ctx.globalAlpha *= 0.6
      const mid1x = (back.x + right.x) / 2, mid1y = (back.y + right.y) / 2 - bh
      const mid2x = (front.x + left.x) / 2, mid2y = (front.y + left.y) / 2 - bh
      const mid3x = (back.x + left.x) / 2,  mid3y = (back.y + left.y) / 2 - bh
      const mid4x = (front.x + right.x) / 2, mid4y = (front.y + right.y) / 2 - bh
      ctx.beginPath()
      ctx.moveTo(mid1x, mid1y); ctx.lineTo(mid2x, mid2y)
      ctx.moveTo(mid3x, mid3y); ctx.lineTo(mid4x, mid4y)
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    if (building.type === 'CRASHED_SHIP') {
      ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(back.x + hw * 0.3, back.y + hh * 0.5 - bh)
      ctx.lineTo(right.x - hw * 0.2, right.y - hh * 0.3 - bh)
      ctx.moveTo(left.x + hw * 0.4, left.y - hh * 0.2 - bh)
      ctx.lineTo(front.x - hw * 0.1, front.y - hh * 0.6 - bh)
      ctx.stroke()
    }

    if (isSelected) {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4]); ctx.lineDashOffset = -(animTick * 0.5) % 8
      ctx.beginPath()
      ctx.moveTo(back.x, back.y - bh); ctx.lineTo(right.x, right.y - bh)
      ctx.lineTo(front.x, front.y - bh); ctx.lineTo(left.x, left.y - bh)
      ctx.closePath(); ctx.stroke()
      ctx.setLineDash([])
    }
  }

  _drawSelection(ctx, fp, animTick) {
    const { back, right, front, left } = fp
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth   = 1.5
    ctx.setLineDash([4, 4])
    ctx.lineDashOffset = -(animTick * 0.5) % 8
    ctx.beginPath()
    ctx.moveTo(back.x, back.y); ctx.lineTo(right.x, right.y)
    ctx.lineTo(front.x, front.y); ctx.lineTo(left.x, left.y)
    ctx.closePath(); ctx.stroke()
    ctx.setLineDash([])
  }
}
