/**
 * Kaynak düğümü render sistemi
 * Haritadaki toplanabilir kaynakların izometrik çizimi
 */

import { ISO } from '../../utils/IsometricUtils.js'
import { RESOURCE_TYPES } from '../../world/ResourceNodes.js'

export class ResourceRenderer {
  constructor(ctx) {
    this.ctx = ctx
  }

  draw(nodes, camera, animTick = 0, deployMode = false) {
    const { ctx } = this
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
}
