/**
 * Baz yapı sistemi — bina oluşturma ve yardımcı fonksiyonlar
 *
 * Bina tanımları artık @/data/buildings.js'de merkezileştirilmiştir.
 * Güç şebekesi hesaplamaları @/game/systems/PowerGrid.js'dedir.
 *
 * Bu dosya geriye dönük uyumluluk re-exportları + createBuilding fabrika fonksiyonunu içerir.
 */

import { BUILDING_TYPES } from '@/data/buildings.js'

// Merkezi tanımlardan re-export (mevcut importları bozmamak için)
export { BUILDING_TYPES } from '@/data/buildings.js'

// Güç şebekesi fonksiyonlarını re-export
export {
  buildingDistance,
  getBuildingPowerGen,
  getBuildingPowerUse,
  buildingPowerDelta,
  computeConnectedSet,
  computeConnections,
} from './PowerGrid.js'

/**
 * Yeni bir bina instance oluştur
 */
export function createBuilding(type, tx, ty, id) {
  const def = BUILDING_TYPES[type]
  if (!def) throw new Error(`Bilinmeyen bina tipi: ${type}`)
  return {
    id: id ?? `b_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    tx, ty,
    level: 1,
    health: 100,
    maxHealth: 100,
    salvaged: false,
    constructing: false,
    constructProgress: ['RESCUE_CAPSULE', 'CRASHED_SHIP', 'MAIN_COMPUTER'].includes(type) ? 100 : 0,
    repaired: type === 'MAIN_COMPUTER' ? false : undefined,
  }
}
