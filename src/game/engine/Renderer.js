import { ISO } from '../utils/IsometricUtils.js'
import { TILE } from '../world/TileTypes.js'
import { BUILDING_TYPES } from '../systems/BaseSystem.js'
import { RESOURCE_TYPES } from '../world/ResourceNodes.js'

// Bina sprite görselleri — modül yüklenince ön belleğe al
const _imgs = {}
;(function preloadBuildingImages() {
  const img = new Image()
  img.src = '/assets/rescue_capsule.png'
  _imgs.rescueCapsule = img
})()

const TILE_TOP  = { 0:'#020810',1:'#0d2137',2:'#1a2a1a',3:'#12502a',4:'#3d2a10',5:'#0e3350',6:'#262e34',7:'#0d3d55',8:'#4a1500',9:'#1a3a00',10:'#3a2828' }
const TILE_SIDE = { 0:'#020810',1:'#0a1a2a',2:'#0f1a0f',3:'#0b3318',4:'#2a1c08',5:'#092238',6:'#1c2226',7:'#0a2a3a',8:'#3a1000',9:'#102800',10:'#2a1a1a' }

const hw = ISO.TILE_W / 2
const hh = ISO.TILE_H / 2

/** İzometrik bina footprint köşelerini hesapla (tile grid'e tam oturur) */
function isoFootprint(sc, W, H) {
  return {
    back:  { x: sc.x,                  y: sc.y - hh },
    right: { x: sc.x + W * hw,         y: sc.y + (W - 1) * hh },
    front: { x: sc.x + (W - H) * hw,   y: sc.y + (W + H - 1) * hh },
    left:  { x: sc.x - H * hw,         y: sc.y + (H - 1) * hh },
    cx:    sc.x + (W - H) * hw / 2,   // yatay merkez
  }
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx    = canvas.getContext('2d')
    this.camera = { x: 0, y: 0 }
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
    const { ctx, camera } = this
    const range = this._visibleRange(map)
    const wallH = 10

    for (let y = range.y0; y <= range.y1; y++) {
      for (let x = range.x0; x <= range.x1; x++) {
        const id = map.tiles[y][x]
        const sc = ISO.toScreen(x, y, camera.x, camera.y)
        let topColor = TILE_TOP[id] ?? '#111'
        if (id === TILE.WATER.id) topColor = this._lerpColor('#0a2a3a', '#0d3d55', (Math.sin(animTick * 0.04) + 1) / 2)
        if (id === TILE.LAVA.id)  topColor = this._lerpColor('#4a1500', '#7a2000', (Math.sin(animTick * 0.07) + 1) / 2)

        // Üst yüz
        ctx.fillStyle = topColor
        ctx.beginPath()
        ctx.moveTo(sc.x,      sc.y - hh)
        ctx.lineTo(sc.x + hw, sc.y)
        ctx.lineTo(sc.x,      sc.y + hh)
        ctx.lineTo(sc.x - hw, sc.y)
        ctx.closePath()
        ctx.fill()

        // Duvarlar
        if (id !== 0) {
          const sid = TILE_SIDE[id] ?? '#0a0a0a'
          ctx.fillStyle = sid
          ctx.beginPath()
          ctx.moveTo(sc.x - hw, sc.y); ctx.lineTo(sc.x, sc.y + hh)
          ctx.lineTo(sc.x, sc.y + hh + wallH); ctx.lineTo(sc.x - hw, sc.y + wallH)
          ctx.closePath(); ctx.fill()
          ctx.fillStyle = this._darken(sid, 0.7)
          ctx.beginPath()
          ctx.moveTo(sc.x, sc.y + hh); ctx.lineTo(sc.x + hw, sc.y)
          ctx.lineTo(sc.x + hw, sc.y + wallH); ctx.lineTo(sc.x, sc.y + hh + wallH)
          ctx.closePath(); ctx.fill()
        }

        if (id === TILE.LAVA.id)       this._drawGlow(ctx, sc.x, sc.y + hh/2, '#ff4400', 0.2  + Math.sin(animTick*0.05)*0.12, 30)
        if (id === TILE.TOXIC_POOL.id) this._drawGlow(ctx, sc.x, sc.y + hh/2, '#00ff44', 0.12 + Math.sin(animTick*0.03)*0.06, 24)
      }
    }
  }

  // ── Kaynak düğümleri ──
  drawResourceNodes(nodes, animTick = 0, deployMode = false) {
    const { ctx, camera } = this
    for (const node of nodes) {
      if (node.remaining <= 0) continue
      const sc  = ISO.toScreen(node.tx, node.ty, camera.x, camera.y)
      const def = RESOURCE_TYPES[node.type]
      if (!def) continue

      const pulse = Math.sin(animTick * 0.06 + node.tx * 0.3) * 2
      const size  = deployMode ? 9 + pulse : 5 + pulse * 0.5
      ctx.shadowColor = def.glowColor
      ctx.shadowBlur  = deployMode ? 18 : 8

      ctx.fillStyle = def.color
      ctx.beginPath()
      ctx.moveTo(sc.x,            sc.y - size)
      ctx.lineTo(sc.x + size*0.6, sc.y)
      ctx.lineTo(sc.x,            sc.y + size)
      ctx.lineTo(sc.x - size*0.6, sc.y)
      ctx.closePath()
      ctx.fill()

      if (deployMode) {
        ctx.strokeStyle = def.color; ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.arc(sc.x, sc.y, 14 + pulse, 0, Math.PI * 2); ctx.stroke()
      }

      const pct = node.remaining / node.totalAmount
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(sc.x - 10, sc.y + size + 3, 20, 2)
      ctx.fillStyle = def.color;         ctx.fillRect(sc.x - 10, sc.y + size + 3, 20 * pct, 2)
      ctx.shadowBlur = 0
    }
  }

  // ── Bağlantılar ──
  drawConnections(buildings, connections, animTick = 0) {
    const { ctx, camera } = this
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
      // Binaların merkez noktaları
      const c1 = ISO.toScreen(b1.tx + (def1?.tileW ?? 1)/2, b1.ty + (def1?.tileH ?? 1)/2, camera.x, camera.y)
      const c2 = ISO.toScreen(b2.tx + (def2?.tileW ?? 1)/2, b2.ty + (def2?.tileH ?? 1)/2, camera.x, camera.y)
      ctx.beginPath(); ctx.moveTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y); ctx.stroke()
    }
    ctx.setLineDash([]); ctx.restore()
  }

  // ── Binalar (derinlik sırası) ──
  drawBuildings(buildings, connectedIds, animTick = 0, selectedId = null) {
    const sorted = [...buildings].sort((a, b) => ISO.depthSort(a, b))
    for (const b of sorted) this._drawBuilding(b, connectedIds.has(b.id), animTick, b.id === selectedId)
  }

  // ── Tek bina — dome veya flat ──
  _drawBuilding(building, isConnected, animTick, isSelected) {
    const { ctx, camera } = this
    const def = BUILDING_TYPES[building.type]
    if (!def) return

    const W  = def.tileW, H = def.tileH
    const sc = ISO.toScreen(building.tx, building.ty, camera.x, camera.y)
    const fp = isoFootprint(sc, W, H)   // footprint: back, right, front, left, cx
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

  // ── Dome (yarım küre) çizimi ──
  _drawDome(ctx, fp, def, building, bh, isSelected, animTick) {
    const { back, right, front, left, cx } = fp
    const apex = { x: cx, y: back.y - bh }

    // -- Taban (footprint) --
    ctx.fillStyle = this._darken(def.color.top, 0.38)
    ctx.beginPath()
    ctx.moveTo(back.x, back.y); ctx.lineTo(right.x, right.y)
    ctx.lineTo(front.x, front.y); ctx.lineTo(left.x, left.y)
    ctx.closePath(); ctx.fill()

    // -- Sol-arka yüz (shadow) --
    ctx.fillStyle = def.color.sideL
    ctx.beginPath()
    ctx.moveTo(apex.x, apex.y)
    ctx.quadraticCurveTo(
      left.x, back.y,          // kontrol: sola doğru, apex hizasında
      left.x, left.y           // bitiş: sol köşe
    )
    ctx.quadraticCurveTo(
      (left.x + back.x) / 2, (left.y + back.y) / 2 + 4,
      back.x, back.y
    )
    ctx.closePath(); ctx.fill()

    // -- Sağ-arka yüz (orta ton) --
    ctx.fillStyle = this._lerpColor(def.color.sideR, def.color.top, 0.4)
    ctx.beginPath()
    ctx.moveTo(apex.x, apex.y)
    ctx.quadraticCurveTo(
      right.x, back.y,
      right.x, right.y
    )
    ctx.quadraticCurveTo(
      (right.x + back.x) / 2, (right.y + back.y) / 2 + 4,
      back.x, back.y
    )
    ctx.closePath(); ctx.fill()

    // -- Sol-ön yüz (orta karanlık) --
    ctx.fillStyle = this._lerpColor(def.color.sideL, def.color.top, 0.25)
    ctx.beginPath()
    ctx.moveTo(apex.x, apex.y)
    ctx.lineTo(left.x, left.y)
    ctx.quadraticCurveTo(
      (left.x + front.x) / 2, front.y,
      front.x, front.y
    )
    ctx.quadraticCurveTo(
      (front.x + apex.x) / 2, front.y - bh * 0.5,
      apex.x, apex.y
    )
    ctx.closePath(); ctx.fill()

    // -- Sağ-ön yüz (en aydınlık) --
    ctx.fillStyle = def.color.top
    ctx.beginPath()
    ctx.moveTo(apex.x, apex.y)
    ctx.lineTo(right.x, right.y)
    ctx.quadraticCurveTo(
      (right.x + front.x) / 2, front.y,
      front.x, front.y
    )
    ctx.quadraticCurveTo(
      (front.x + apex.x) / 2, front.y - bh * 0.5,
      apex.x, apex.y
    )
    ctx.closePath(); ctx.fill()

    // -- Tepe aksan --
    const coreGlow = BUILDING_TYPES[building.type]?.isCore
    const glowR = coreGlow ? (10 + Math.sin(animTick * 0.04) * 3) : 5
    ctx.strokeStyle = def.color.accent
    ctx.lineWidth   = coreGlow ? 1.5 : 0.8
    ctx.shadowColor = def.color.accent
    ctx.shadowBlur  = coreGlow ? (12 + Math.sin(animTick * 0.04) * 4) : 4
    ctx.beginPath(); ctx.arc(apex.x, apex.y, glowR, 0, Math.PI * 2); ctx.stroke()
    ctx.shadowBlur = 0

    // -- Seçim halkası --
    if (isSelected) {
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

  // ── Kurtarma Kapsülü — SVG sprite + canvas animasyon overlay ──
  _drawRescueCapsule(ctx, fp, def, building, bh, isSelected, animTick) {
    const { back, right, front, left, cx } = fp
    const baseH  = bh * 0.42
    const apex   = { x: cx, y: back.y - bh }
    const antTip = { x: cx, y: apex.y - 28 }   // SVG'de ana direk ucu y=10 → apex.y-28
    const bBk = { x: back.x,  y: back.y  - baseH }
    const bRt = { x: right.x, y: right.y - baseH }
    const bFt = { x: front.x, y: front.y - baseH }
    const bLt = { x: left.x,  y: left.y  - baseH }

    // ── 1. Animasyonlu zemin parlaması (görsel arkasında kalır) ──
    const gCx = (back.x + front.x) / 2
    const gCy = (back.y + front.y) / 2 + 4
    this._drawGlow(ctx, gCx, gCy, '#00e5ff', 0.08 + Math.sin(animTick * 0.04) * 0.05, 72)

    // ── 2. SVG sprite ──
    // SVG içindeki sc referans noktası (110, 90); back = (sc.x, sc.y-16)
    const img = _imgs.rescueCapsule
    if (img?.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, back.x - 110, back.y + 16 - 90, 220, 200)
    } else {
      // Görsel henüz yüklenmemişse basit dome çiz
      this._drawDome(ctx, fp, def, building, bh, isSelected, animTick)
      return
    }

    // ── 3. Animasyonlu overlay'ler ──

    // Ekvatör bandı — dönen parlayan nokta
    const bandPts = [bBk, bRt, bFt, bLt, bBk]
    const bPhase  = (animTick * 0.02) % 1
    const bSeg    = Math.floor(bPhase * 4)
    const bT      = (bPhase * 4) % 1
    const bDotX   = bandPts[bSeg].x + (bandPts[bSeg + 1].x - bandPts[bSeg].x) * bT
    const bDotY   = bandPts[bSeg].y + (bandPts[bSeg + 1].y - bandPts[bSeg].y) * bT
    ctx.fillStyle = def.color.accent; ctx.shadowColor = def.color.accent; ctx.shadowBlur = 10
    ctx.beginPath(); ctx.arc(bDotX, bDotY, 2.5, 0, Math.PI * 2); ctx.fill()
    ctx.shadowBlur = 0

    // Silindir tarama ışığı (sağ-ön yüzde yukarı-aşağı)
    const scanR = 0.5 + Math.sin(animTick * 0.025) * 0.38
    ctx.strokeStyle = 'rgba(0,229,255,0.22)'; ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(right.x + (bRt.x - right.x) * scanR, right.y + (bRt.y - right.y) * scanR)
    ctx.lineTo(front.x + (bFt.x - front.x) * scanR, front.y + (bFt.y - front.y) * scanR)
    ctx.stroke()

    // Pencere nabzı — SVG pencereleri ile hizalı (SVG offset: w1=+58,+54  w2=+38,+68)
    const drawX = back.x - 110, drawY = back.y + 16 - 90
    const pw = [
      [drawX + 168, drawY + 128, -0.47],   // SVG translate(168,128) rotate(-27°)
      [drawX + 148, drawY + 142, -0.47],   // SVG translate(148,142) rotate(-27°)
    ]
    for (const [px, py, ang] of pw) {
      const wP = Math.sin(animTick * 0.06 + px * 0.08) * 0.15
      ctx.shadowColor = def.color.accent; ctx.shadowBlur = 6 + wP * 22
      ctx.strokeStyle = `rgba(0,229,255,${0.3 + wP})`; ctx.lineWidth = 1.2
      ctx.beginPath(); ctx.ellipse(px, py, 16, 6, ang, 0, Math.PI * 2); ctx.stroke()
    }
    ctx.shadowBlur = 0

    // Apex nabız halkası (SVG kapak r=10 üstüne)
    const pulse = Math.sin(animTick * 0.05)
    ctx.shadowColor = def.color.accent; ctx.shadowBlur = 24 + pulse * 10
    ctx.strokeStyle = `rgba(128,240,255,${0.3 + pulse * 0.12})`; ctx.lineWidth = 1.6
    ctx.beginPath(); ctx.arc(apex.x, apex.y, 13 + pulse * 2.5, 0, Math.PI * 2); ctx.stroke()
    ctx.shadowBlur = 0

    // Anten ucu yanıp sönmesi
    const blinkA = 0.5 + Math.sin(animTick * 0.12) * 0.5
    ctx.fillStyle = `rgba(128,240,255,${blinkA})`
    ctx.shadowColor = def.color.accent; ctx.shadowBlur = 8 + Math.sin(animTick * 0.12) * 6
    ctx.beginPath(); ctx.arc(antTip.x, antTip.y, 3, 0, Math.PI * 2); ctx.fill()
    ctx.shadowBlur = 0

    // Sinyal halkaları (genişleyen, soluklaşan)
    for (let i = 0; i < 3; i++) {
      const prog  = ((animTick * 0.022 + i / 3) % 1)
      const ringR = 3 + prog * 28
      const alpha = (1 - prog) * 0.52
      ctx.strokeStyle = `rgba(0,229,255,${alpha})`; ctx.lineWidth = 1
      ctx.beginPath()
      ctx.ellipse(antTip.x, antTip.y, ringR, ringR * 0.3, 0, 0, Math.PI * 2)
      ctx.stroke()
    }

    // ── 4. Seçim halkası ──
    if (isSelected) {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4]); ctx.lineDashOffset = -(animTick * 0.5) % 8
      ctx.beginPath()
      ctx.moveTo(back.x, back.y); ctx.lineTo(right.x, right.y)
      ctx.lineTo(front.x, front.y); ctx.lineTo(left.x, left.y)
      ctx.closePath(); ctx.stroke()
      ctx.setLineDash([])
    }
  }

  // ── Düz panel (güneş paneli, enkaz) ──
  _drawFlat(ctx, fp, def, building, bh, isSelected, animTick) {
    const { back, right, front, left, cx } = fp

    // Taban diamond
    ctx.fillStyle = def.color.top
    ctx.beginPath()
    ctx.moveTo(back.x, back.y); ctx.lineTo(right.x, right.y)
    ctx.lineTo(front.x, front.y); ctx.lineTo(left.x, left.y)
    ctx.closePath(); ctx.fill()

    // Düz yan duvarlar (ince)
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

    // Üst yüz (bh yukarıda)
    ctx.fillStyle = def.color.top
    ctx.beginPath()
    ctx.moveTo(back.x, back.y - bh); ctx.lineTo(right.x, right.y - bh)
    ctx.lineTo(front.x, front.y - bh); ctx.lineTo(left.x, left.y - bh)
    ctx.closePath(); ctx.fill()

    // Güneş paneli grid çizgileri
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

    // Enkaz çatlak efekti
    if (building.type === 'CRASHED_SHIP') {
      ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(back.x + hw * 0.3, back.y + hh * 0.5 - bh)
      ctx.lineTo(right.x - hw * 0.2, right.y - hh * 0.3 - bh)
      ctx.moveTo(left.x + hw * 0.4, left.y - hh * 0.2 - bh)
      ctx.lineTo(front.x - hw * 0.1, front.y - hh * 0.6 - bh)
      ctx.stroke()
    }

    // Seçim halkası
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

  // ── Gece karartması ──
  drawNightOverlay(darkness) {
    if (!darkness || darkness <= 0) return
    this.ctx.fillStyle = 'rgba(0,5,25,' + darkness.toFixed(2) + ')'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  // ── Tıklama tespiti ──
  findNodeAtScreen(sx, sy, nodes, threshold = 18) {
    for (const node of nodes) {
      if (node.remaining <= 0) continue
      const sc = ISO.toScreen(node.tx, node.ty, this.camera.x, this.camera.y)
      const dx = sx - sc.x, dy = sy - sc.y
      if (dx*dx + dy*dy <= threshold*threshold) return node
    }
    return null
  }

  findBuildingAtScreen(sx, sy, buildings) {
    // Tile'a çevir — hangi binanın footprint'i içinde?
    const tile = ISO.toTile(sx, sy, this.camera.x, this.camera.y)
    const tx = Math.round(tile.tx), ty = Math.round(tile.ty)

    // Derinlik sırasının tersinde kontrol (en öndeki bina önce)
    const sorted = [...buildings].sort((a, b) => ISO.depthSort(b, a))
    for (const b of sorted) {
      const def = BUILDING_TYPES[b.type]
      if (!def) continue
      if (tx >= b.tx && tx < b.tx + def.tileW && ty >= b.ty && ty < b.ty + def.tileH) return b
    }

    // Tile tespiti başarısız olursa ekran mesafesine bak
    for (const b of sorted) {
      const def = BUILDING_TYPES[b.type]
      if (!def) continue
      const sc = ISO.toScreen(b.tx, b.ty, this.camera.x, this.camera.y)
      const fp = isoFootprint(sc, def.tileW, def.tileH)
      const dx = sx - fp.cx, dy = sy - (fp.back.y + fp.front.y) / 2
      if (dx*dx + dy*dy <= (def.tileW * hw) * (def.tileW * hw)) return b
    }
    return null
  }

  // ── Yardımcılar ──
  _darken(hex, f) {
    return 'rgb(' + (parseInt(hex.slice(1,3),16)*f|0) + ',' + (parseInt(hex.slice(3,5),16)*f|0) + ',' + (parseInt(hex.slice(5,7),16)*f|0) + ')'
  }

  _lerpColor(a, b, t) {
    const ar=parseInt(a.slice(1,3),16), ag=parseInt(a.slice(3,5),16), ab=parseInt(a.slice(5,7),16)
    const br=parseInt(b.slice(1,3),16), bg=parseInt(b.slice(3,5),16), bb=parseInt(b.slice(5,7),16)
    return 'rgb(' + (ar+(br-ar)*t|0) + ',' + (ag+(bg-ag)*t|0) + ',' + (ab+(bb-ab)*t|0) + ')'
  }

  _drawGlow(ctx, x, y, color, alpha, r) {
    r = r || 28
    const cr=parseInt(color.slice(1,3),16), cg=parseInt(color.slice(3,5),16), cb=parseInt(color.slice(5,7),16)
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r)
    grd.addColorStop(0, 'rgba(' + cr + ',' + cg + ',' + cb + ',' + alpha + ')')
    grd.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grd
    ctx.beginPath(); ctx.ellipse(x, y, r, r*0.5, 0, 0, Math.PI*2); ctx.fill()
  }
}
