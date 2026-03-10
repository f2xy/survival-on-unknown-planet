/**
 * Harita (tile) render sistemi
 * İzometrik tile'ları ve tehlike glow efektlerini çizer
 */

import { ISO } from '../../utils/IsometricUtils.js'
import { TILE } from '../../world/TileTypes.js'
import { lerpColor, drawGlow } from './ColorUtils.js'

const TILE_TOP  = { 0:'#020810',1:'#0d2137',2:'#1a2a1a',3:'#12502a',4:'#3d2a10',5:'#0e3350',6:'#262e34',7:'#0d3d55',8:'#4a1500',9:'#1a3a00',10:'#3a2828' }
const TILE_SIDE = { 0:'#020810',1:'#0a1a2a',2:'#0f1a0f',3:'#0b3318',4:'#2a1c08',5:'#092238',6:'#1c2226',7:'#0a2a3a',8:'#3a1000',9:'#102800',10:'#2a1a1a' }

const hw = ISO.TILE_W / 2
const hh = ISO.TILE_H / 2

export class MapRenderer {
  constructor(ctx) {
    this.ctx = ctx
  }

  draw(map, camera, visibleRange, animTick = 0) {
    const { ctx } = this
    const wallH = 10

    for (let y = visibleRange.y0; y <= visibleRange.y1; y++) {
      for (let x = visibleRange.x0; x <= visibleRange.x1; x++) {
        const id = map.tiles[y][x]
        const sc = ISO.toScreen(x, y, camera.x, camera.y)
        let topColor = TILE_TOP[id] ?? '#111'
        if (id === TILE.WATER.id) topColor = lerpColor('#0a2a3a', '#0d3d55', (Math.sin(animTick * 0.04) + 1) / 2)
        if (id === TILE.LAVA.id)  topColor = lerpColor('#4a1500', '#7a2000', (Math.sin(animTick * 0.07) + 1) / 2)

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

          const darkerSid = 'rgb(' +
            (parseInt(sid.slice(1,3),16)*0.7|0) + ',' +
            (parseInt(sid.slice(3,5),16)*0.7|0) + ',' +
            (parseInt(sid.slice(5,7),16)*0.7|0) + ')'
          ctx.fillStyle = darkerSid
          ctx.beginPath()
          ctx.moveTo(sc.x, sc.y + hh); ctx.lineTo(sc.x + hw, sc.y)
          ctx.lineTo(sc.x + hw, sc.y + wallH); ctx.lineTo(sc.x, sc.y + hh + wallH)
          ctx.closePath(); ctx.fill()
        }

        if (id === TILE.LAVA.id)       drawGlow(ctx, sc.x, sc.y + hh/2, '#ff4400', 0.2  + Math.sin(animTick*0.05)*0.12, 30)
        if (id === TILE.TOXIC_POOL.id) drawGlow(ctx, sc.x, sc.y + hh/2, '#00ff44', 0.12 + Math.sin(animTick*0.03)*0.06, 24)
      }
    }
  }
}
