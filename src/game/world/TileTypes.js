/**
 * Tile tanımları
 * noiseRange: [min, max] — hangi noise değerinde bu tile oluşur
 */

export const TILE = {
  // ── Geçilemez ──
  VOID:          { id: 0, name: 'void',          passable: false, color: '#020810', noiseRange: null },
  CRYSTAL_WALL:  { id: 1, name: 'crystal_wall',  passable: false, color: '#0d2137', noiseRange: [-1, -0.45] },
  ROCK:          { id: 2, name: 'rock',          passable: false, color: '#1a2a1a', noiseRange: [0.45, 1] },

  // ── Zemin ──
  ALIEN_GRASS:   { id: 3, name: 'alien_grass',   passable: true,  color: '#0e3b1e', noiseRange: [-0.45, -0.1] },
  DUST:          { id: 4, name: 'dust',          passable: true,  color: '#2d1f0e', noiseRange: [-0.1, 0.15] },
  CRYSTAL_FLOOR: { id: 5, name: 'crystal_floor', passable: true,  color: '#0a2233', noiseRange: [0.15, 0.35] },
  METAL_PLATE:   { id: 6, name: 'metal_plate',   passable: true,  color: '#1c2226', noiseRange: [0.35, 0.45] },

  // ── Özel ──
  WATER:         { id: 7, name: 'water',         passable: false, color: '#0a2a3a', hazard: 'cold' },
  LAVA:          { id: 8, name: 'lava',          passable: false, color: '#4a1500', hazard: 'fire' },
  TOXIC_POOL:    { id: 9, name: 'toxic_pool',    passable: false, color: '#1a3a00', hazard: 'toxic' },
  CRASH_SITE:    { id: 10, name: 'crash_site',   passable: true,  color: '#2a2020', special: 'spawn' },
}

/**
 * Noise değerine göre tile seç.
 * @param {number} n - -1..1 arası noise değeri
 * @param {object} [profile] - { heat, cold, lush, barren } — gezegen profili
 */
export function tileFromNoise(n, profile = null) {
  if (!profile) {
    // Varsayılan davranış
    if (n < -0.45)  return TILE.CRYSTAL_WALL
    if (n < -0.1)   return TILE.ALIEN_GRASS
    if (n < 0.15)   return TILE.DUST
    if (n < 0.35)   return TILE.CRYSTAL_FLOOR
    if (n < 0.45)   return TILE.METAL_PLATE
    return TILE.ROCK
  }

  // Gezegen profiline göre dinamik eşikler
  // Sıcak gezegen → kaya/toz eşiği yüksek, bitki eşiği düşük
  // Soğuk gezegen → kristal eşiği yüksek, toz azalır
  // Çıplak gezegen → daha fazla kaya

  const grassCutoff = -0.45 + profile.lush  * 0.30   // lush→ [-0.45, -0.15]
  const dustCutoff  = -0.10 + profile.heat  * 0.15   // heat→  [-0.10,  0.05]
  const crystCutoff =  0.15 + profile.cold  * 0.15   // cold→  [0.15,  0.30]
  const metalCutoff =  0.35 - profile.barren * 0.10  // barren → daha az metal

  if (n < -0.45)           return TILE.CRYSTAL_WALL
  if (n < grassCutoff)     return TILE.ALIEN_GRASS
  if (n < dustCutoff)      return TILE.DUST
  if (n < crystCutoff)     return TILE.CRYSTAL_FLOOR
  if (n < metalCutoff)     return TILE.METAL_PLATE
  return TILE.ROCK
}

/**
 * Tile ID → Tile tanımı
 */
const _byId = Object.values(TILE).reduce((acc, t) => { acc[t.id] = t; return acc }, {})
export function tileById(id) { return _byId[id] ?? TILE.VOID }
