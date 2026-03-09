/**
 * Prosedürel harita üreteci
 */

import { NoiseGenerator } from '../utils/NoiseGenerator.js'
import { tileFromNoise, TILE } from './TileTypes.js'

export const MAP_SIZE = 64  // 64×64 tile harita

export class MapGenerator {
  constructor(seed) {
    this.seed = seed ?? (Math.random() * 99999 | 0)
    this.noise = new NoiseGenerator(this.seed)
  }

  generate() {
    const tiles = []
    const scale = 0.08  // zoom seviyesi — küçüldükçe daha "smooth"

    for (let y = 0; y < MAP_SIZE; y++) {
      tiles[y] = []
      for (let x = 0; x < MAP_SIZE; x++) {
        const n = this.noise.octave(x * scale, y * scale, 5, 0.55, 2.1)
        tiles[y][x] = tileFromNoise(n).id
      }
    }

    // Çökme alanı (spawn noktası) merkeze yerleştir
    const cx = MAP_SIZE / 2 | 0
    const cy = MAP_SIZE / 2 | 0
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        tiles[cy + dy][cx + dx] = TILE.CRASH_SITE.id
      }
    }

    // Tehlike bölgeleri ekle
    this._addHazards(tiles)

    return {
      seed: this.seed,
      width: MAP_SIZE,
      height: MAP_SIZE,
      tiles,
      spawnX: cx,
      spawnY: cy,
    }
  }

  _addHazards(tiles) {
    const rng = new NoiseGenerator(this.seed + 1)
    const scale = 0.15

    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        const cur = tiles[y][x]
        if (cur === TILE.CRYSTAL_WALL.id || cur === TILE.ROCK.id) continue

        const n = rng.noise(x * scale, y * scale)

        // Uzak koru — spawn'dan uzak yerlerde tehlike
        const dx = x - MAP_SIZE / 2, dy = y - MAP_SIZE / 2
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 8) continue  // spawn güvenli alan

        if (n > 0.6 && Math.random() < 0.04)  tiles[y][x] = TILE.LAVA.id
        else if (n < -0.6 && Math.random() < 0.05) tiles[y][x] = TILE.WATER.id
        else if (n > 0.4 && Math.random() < 0.03)  tiles[y][x] = TILE.TOXIC_POOL.id
      }
    }
  }
}
