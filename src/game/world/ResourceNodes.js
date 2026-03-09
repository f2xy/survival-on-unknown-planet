/**
 * Kaynak düğümleri — haritada dağılmış toplanabilir kaynaklar
 */

import { NoiseGenerator } from '../utils/NoiseGenerator.js'
import { TILE } from './TileTypes.js'

export const RESOURCE_TYPES = {
  scrap_metal:   { name: 'Hurda Metal',    color: '#888888', glowColor: 'rgba(136,136,136,0.5)', tileAffinity: [TILE.METAL_PLATE.id, TILE.CRASH_SITE.id] },
  crystal_shard: { name: 'Kristal Kırık', color: '#00aaff', glowColor: 'rgba(0,170,255,0.5)',   tileAffinity: [TILE.CRYSTAL_WALL.id, TILE.CRYSTAL_FLOOR.id] },
  alien_plant:   { name: 'Alien Bitkisi', color: '#00cc44', glowColor: 'rgba(0,204,68,0.5)',    tileAffinity: [TILE.ALIEN_GRASS.id] },
  alien_crystal: { name: 'Alien Kristali',color: '#aa44ff', glowColor: 'rgba(170,68,255,0.5)',  tileAffinity: [TILE.CRYSTAL_FLOOR.id, TILE.CRYSTAL_WALL.id] },
  rock:          { name: 'Kaya',          color: '#aaaaaa', glowColor: 'rgba(170,170,170,0.4)', tileAffinity: [TILE.ROCK.id, TILE.DUST.id] },
}

/**
 * Harita için kaynak düğümleri üret
 * @param {object} map - MapGenerator'dan gelen harita
 * @param {number} seed
 * @returns {ResourceNode[]}
 */
export function generateResourceNodes(map, seed) {
  const rng    = new NoiseGenerator(seed + 42)
  const nodes  = []
  let idCount  = 0

  const spawnX = map.spawnX
  const spawnY = map.spawnY
  const SAFE_RADIUS = 10  // spawn etrafı boş

  // Haritayı grid'e böl, her bölgede bir kaynak
  const CELL = 8  // her 8x8 tile'da bir kaynak kümesi

  for (let gy = 0; gy < map.height; gy += CELL) {
    for (let gx = 0; gx < map.width; gx += CELL) {
      // Bölge içinde rastgele pozisyon
      const tx = gx + (Math.abs(rng.noise(gx * 0.3, gy * 0.3) * CELL) | 0)
      const ty = gy + (Math.abs(rng.noise(gx * 0.3 + 1, gy * 0.3 + 1) * CELL) | 0)

      if (tx >= map.width || ty >= map.height) continue

      // Spawn güvenli alan kontrolü
      const dx = tx - spawnX, dy = ty - spawnY
      if (Math.sqrt(dx * dx + dy * dy) < SAFE_RADIUS) continue

      const tileId = map.tiles[ty]?.[tx]
      if (!tileId) continue

      // Tile'a göre kaynak tipi seç
      const resourceType = selectResourceType(tileId, rng, gx, gy)
      if (!resourceType) continue

      const amount = 30 + Math.abs(rng.noise(gx * 0.5, gy * 0.5)) * 70 | 0

      nodes.push({
        id: `node_${++idCount}`,
        type: resourceType,
        tx, ty,
        totalAmount: amount,
        remaining: amount,
      })
    }
  }

  return nodes
}

function selectResourceType(tileId, rng, x, y) {
  // Tile affinitesine göre ağırlıklı seçim
  const candidates = []

  for (const [type, def] of Object.entries(RESOURCE_TYPES)) {
    if (def.tileAffinity.includes(tileId)) candidates.push({ type, weight: 3 })
    else candidates.push({ type, weight: 0.5 })
  }

  // Belirli tile'larda hiç kaynak çıkmasın
  if ([TILE.VOID.id, TILE.WATER.id, TILE.LAVA.id, TILE.TOXIC_POOL.id].includes(tileId)) return null

  // Rastgele seçim
  const total = candidates.reduce((s, c) => s + c.weight, 0)
  let rand = Math.abs(rng.noise(x * 0.7, y * 0.7 + 5)) * total
  for (const c of candidates) {
    rand -= c.weight
    if (rand <= 0) return c.type
  }
  return candidates[0].type
}
