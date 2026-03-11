/**
 * Prosedürel harita üreteci — gezegen parametrelerine duyarlı arazi oluşturma.
 *
 * Gezegen özelliklerine göre:
 *  - Sıcak, atmosfersiz gezegen → daha fazla lav ve kaya
 *  - Soğuk gezegen              → daha fazla kristal ve buz benzeri yüzey
 *  - Toksik atmosfer            → daha fazla toksik havuz
 *  - N₂/O₂ atmosfer            → daha fazla alien bitki
 */

import { NoiseGenerator } from '../utils/NoiseGenerator.js'
import { tileFromNoise, TILE } from './TileTypes.js'

export const MAP_SIZE = 64  // 64×64 tile harita

export class MapGenerator {
  /**
   * @param {number|null} seed
   * @param {object|null} planet - PlanetGenerator çıktısı (isteğe bağlı)
   */
  constructor(seed, planet = null) {
    this.seed   = seed ?? (Math.random() * 99999 | 0)
    this.noise  = new NoiseGenerator(this.seed)
    this.planet = planet
  }

  generate() {
    const tiles = []
    const scale = 0.08  // zoom seviyesi

    // Gezegen tipi arazi özelleştirme
    const planetProfile = this._buildPlanetProfile()

    for (let y = 0; y < MAP_SIZE; y++) {
      tiles[y] = []
      for (let x = 0; x < MAP_SIZE; x++) {
        const n = this.noise.octave(x * scale, y * scale, 5, 0.55, 2.1)
        tiles[y][x] = tileFromNoise(n, planetProfile).id
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

    // Tehlike bölgeleri — gezegen profiline göre yoğunlaştır
    this._addHazards(tiles, planetProfile)

    return {
      seed:    this.seed,
      planet:  this.planet,
      width:   MAP_SIZE,
      height:  MAP_SIZE,
      tiles,
      spawnX:  cx,
      spawnY:  cy,
    }
  }

  /**
   * Gezegen özelliklerinden arazi profili üretir.
   * Her değer 0-1 normalize skala, arazi üretim ağırlıklarını etkiler.
   */
  _buildPlanetProfile() {
    const p = this.planet
    if (!p) return { heat: 0.5, cold: 0.5, toxic: 0.3, lush: 0.2, barren: 0.3 }

    const baseTemp   = p.thermal.baseTemp    // °C
    const hasOxygen  = p.atmosphere.oxygenRatio > 0.10
    const isToxic    = p.atmosphere.toxicDamage
    const hasAtmos   = p.atmosphere.type !== 'NONE'

    // Isı faktörü: çok sıcak = 1, çok soğuk = 0
    const heat  = Math.max(0, Math.min(1, (baseTemp + 50) / 150))
    // Soğuk faktörü: tersine
    const cold  = 1 - heat
    // Toksik oran
    const toxic = isToxic ? 0.7 : (hasAtmos ? 0.2 : 0.1)
    // Yeşillik/bitki oran
    const lush  = hasOxygen ? 0.6 : 0.1
    // Çıplak/kaya oran
    const barren = hasAtmos ? 0.2 : 0.7

    return { heat, cold, toxic, lush, barren }
  }

  _addHazards(tiles, profile) {
    const rng = new NoiseGenerator(this.seed + 1)
    const scale = 0.15

    // Gezegen profiline göre tehlike eşikleri
    const lavaChance  = 0.02 + profile.heat  * 0.08   // sıcak gezegen → daha fazla lav
    const waterChance = 0.03 + profile.cold  * 0.06   // soğuk gezegen → daha fazla su/buz
    const toxicChance = 0.02 + profile.toxic * 0.06   // toksik atmosfer → daha fazla havuz

    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        const cur = tiles[y][x]
        if (cur === TILE.CRYSTAL_WALL.id || cur === TILE.ROCK.id) continue

        const n = rng.noise(x * scale, y * scale)

        const dx = x - MAP_SIZE / 2, dy = y - MAP_SIZE / 2
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 8) continue  // spawn güvenli alanı

        if      (n > 0.60 && Math.random() < lavaChance)  tiles[y][x] = TILE.LAVA.id
        else if (n < -0.60 && Math.random() < waterChance) tiles[y][x] = TILE.WATER.id
        else if (n > 0.40 && Math.random() < toxicChance)  tiles[y][x] = TILE.TOXIC_POOL.id
      }
    }
  }
}
