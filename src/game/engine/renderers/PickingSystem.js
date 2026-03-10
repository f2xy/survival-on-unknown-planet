/**
 * Tıklama tespiti (picking) sistemi
 * Ekran koordinatlarından bina ve kaynak düğümü seçimi
 */

import { ISO } from '../../utils/IsometricUtils.js'
import { BUILDING_TYPES } from '@/data/buildings.js'
import { isoFootprint } from './BuildingRenderer.js'

const hw = ISO.TILE_W / 2

export class PickingSystem {
  constructor() {}

  /** Belirli ekran koordinatında kaynak düğümü bul */
  findNodeAtScreen(sx, sy, nodes, camera, threshold = 18) {
    for (const node of nodes) {
      if (node.remaining <= 0) continue
      const sc = ISO.toScreen(node.tx, node.ty, camera.x, camera.y)
      const dx = sx - sc.x, dy = sy - sc.y
      if (dx*dx + dy*dy <= threshold*threshold) return node
    }
    return null
  }

  /** Belirli ekran koordinatında bina bul */
  findBuildingAtScreen(sx, sy, buildings, camera) {
    // Tile'a çevir
    const tile = ISO.toTile(sx, sy, camera.x, camera.y)
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
      const sc = ISO.toScreen(b.tx, b.ty, camera.x, camera.y)
      const fp = isoFootprint(sc, def.tileW, def.tileH)
      const dx = sx - fp.cx, dy = sy - (fp.back.y + fp.front.y) / 2
      if (dx*dx + dy*dy <= (def.tileW * hw) * (def.tileW * hw)) return b
    }
    return null
  }
}
