/**
 * Güç Şebekesi Hesaplama Sistemi
 *
 * Sorumluluklar:
 *  - Bina güç üretimi/tüketimi hesaplama (seviye dahil)
 *  - Bağlantı grafiği oluşturma (BFS)
 *  - Core'a bağlı bina seti hesaplama
 *
 * Bu modül saf fonksiyonlardan oluşur — state değiştirmez.
 * BaseStore tarafından kullanılır.
 */

import { BUILDING_TYPES } from '@/data/buildings.js'
import { DEFAULT_CONNECTION_RADIUS } from '@/data/balance.js'

/**
 * İki bina arasında mesafe hesapla (tile cinsinden)
 */
export function buildingDistance(b1, b2) {
  const dx = b1.tx - b2.tx
  const dy = b1.ty - b2.ty
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Binanın seviyeye göre toplam güç üretimi
 */
export function getBuildingPowerGen(building) {
  const def = BUILDING_TYPES[building.type]
  if (!def) return 0
  let gen = def.powerGen ?? 0
  for (let lvl = 2; lvl <= (building.level ?? 1); lvl++) {
    const upg = def.upgrades?.find(u => u.level === lvl)
    if (upg?.bonus?.powerGen) gen += upg.bonus.powerGen
  }
  return gen
}

/**
 * Binanın seviyeye göre toplam güç tüketimi
 */
export function getBuildingPowerUse(building) {
  const def = BUILDING_TYPES[building.type]
  if (!def) return 0
  let use = def.powerUse ?? 0
  for (let lvl = 2; lvl <= (building.level ?? 1); lvl++) {
    const upg = def.upgrades?.find(u => u.level === lvl)
    if (upg?.bonus?.powerUse) use += upg.bonus.powerUse
  }
  return use
}

/**
 * Binanın net güç dengesi (üretim - tüketim), seviye dahil
 */
export function buildingPowerDelta(building) {
  return getBuildingPowerGen(building) - getBuildingPowerUse(building)
}

/**
 * Core'a bağlı binalar setini hesapla (BFS)
 * Core'a ulaşmayan binalar "bağlantısız" sayılır
 *
 * @param {Array} buildings - Tüm binalar
 * @returns {Set} Bağlı bina ID'leri
 */
export function computeConnectedSet(buildings) {
  const core = buildings.find(b => BUILDING_TYPES[b.type]?.isCore)
  if (!core) return new Set()

  const connected = new Set([core.id])
  let changed = true
  while (changed) {
    changed = false
    for (const b of buildings) {
      if (connected.has(b.id)) continue
      for (const c of buildings) {
        if (!connected.has(c.id)) continue
        const maxR = Math.max(
          BUILDING_TYPES[b.type]?.connectionRadius ?? DEFAULT_CONNECTION_RADIUS,
          BUILDING_TYPES[c.type]?.connectionRadius ?? DEFAULT_CONNECTION_RADIUS
        )
        if (buildingDistance(b, c) <= maxR) {
          connected.add(b.id)
          changed = true
          break
        }
      }
    }
  }
  return connected
}

/**
 * Tüm binaların bağlantı listesini hesapla
 *
 * @param {Array} buildings - Tüm binalar
 * @returns {Array} [{ from, to }] bağlantı listesi
 */
export function computeConnections(buildings) {
  const conns = []
  for (let i = 0; i < buildings.length; i++) {
    for (let j = i + 1; j < buildings.length; j++) {
      const maxR = Math.max(
        BUILDING_TYPES[buildings[i].type]?.connectionRadius ?? DEFAULT_CONNECTION_RADIUS,
        BUILDING_TYPES[buildings[j].type]?.connectionRadius ?? DEFAULT_CONNECTION_RADIUS
      )
      if (buildingDistance(buildings[i], buildings[j]) <= maxR) {
        conns.push({ from: buildings[i].id, to: buildings[j].id })
      }
    }
  }
  return conns
}
