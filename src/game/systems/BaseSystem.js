/**
 * Baz yapı sistemi — bina tanımları ve yerleştirme kuralları
 */

export const BUILDING_TYPES = {
  RESCUE_CAPSULE: {
    id: 'RESCUE_CAPSULE',
    name: 'Kurtarma Kapsülü',
    desc: 'Yaşam ünitesinin merkez birimi. Tüm bağlantıların kalbi.',
    icon: '🛸',
    tileW: 3, tileH: 3,   // tile cinsinden boyut
    drawH: 36,             // render yüksekliği (px)
    color: { top: '#00e5ff', sideL: '#0077aa', sideR: '#005580', accent: '#80f0ff' },
    isCore: true,
    buildCost: null,
    powerGen: 20,
    connectionRadius: 10,   // kaç tile uzağa bağlantı kurabilir
    maxLevel: 3,
    upgrades: [
      { level: 2, cost: { scrap_metal: 20, crystal_shard: 10 }, bonus: { storageCapacity: 100, powerGen: 10 } },
      { level: 3, cost: { scrap_metal: 40, alien_crystal: 15 }, bonus: { storageCapacity: 200, powerGen: 20 } },
    ],
  },

  CRASHED_SHIP: {
    id: 'CRASHED_SHIP',
    name: 'Gemi Enkazı',
    desc: 'Düşen geminin enkazı. Salvage kaynağı.',
    icon: '💥',
    tileW: 4, tileH: 2,
    drawH: 20,
    color: { top: '#3a2a1a', sideL: '#2a1a0a', sideR: '#1a0e06', accent: '#8a6a4a' },
    isDecoration: true,
    isSalvageable: true,
    buildCost: null,
    salvageYield: { scrap_metal: 30, crystal_shard: 5 },
  },

  POWER_GENERATOR: {
    id: 'POWER_GENERATOR',
    name: 'Güç Üreteci',
    desc: 'Diğer birimlere güç sağlar. Enerji üretimi.',
    icon: '⚡',
    tileW: 2, tileH: 2,
    drawH: 28,
    color: { top: '#ffc400', sideL: '#aa8800', sideR: '#886600', accent: '#ffe066' },
    buildCost: { scrap_metal: 15, crystal_shard: 5 },
    powerGen: 80,
    powerUse: 5,
    maxLevel: 3,
    upgrades: [
      { level: 2, cost: { scrap_metal: 20, alien_crystal: 5 }, bonus: { powerGen: 60 } },
      { level: 3, cost: { scrap_metal: 35, alien_crystal: 12 }, bonus: { powerGen: 100 } },
    ],
  },

  STORAGE_MODULE: {
    id: 'STORAGE_MODULE',
    name: 'Depolama Modülü',
    desc: 'Kaynak depolama kapasitesini artırır.',
    icon: '📦',
    tileW: 2, tileH: 2,
    drawH: 22,
    color: { top: '#607080', sideL: '#404a54', sideR: '#303840', accent: '#8090a0' },
    buildCost: { scrap_metal: 10, rock: 8 },
    powerUse: 3,
    storageCapacity: 150,
    maxLevel: 3,
    upgrades: [
      { level: 2, cost: { scrap_metal: 15, rock: 10 }, bonus: { storageCapacity: 200 } },
      { level: 3, cost: { scrap_metal: 25, alien_crystal: 5 }, bonus: { storageCapacity: 350 } },
    ],
  },

  MAIN_COMPUTER: {
    id: 'MAIN_COMPUTER',
    name: 'Ana Bilgisayar',
    desc: 'Roverları yönetir ve otomatik kaynak toplamayı sağlar.',
    icon: '🖥',
    tileW: 2, tileH: 2,
    drawH: 32,
    color: { top: '#003355', sideL: '#001a2e', sideR: '#001020', accent: '#00e5ff' },
    isStarting: true,        // inşa terminalinde görünmez
    buildCost: null,
    powerUse: 15,
    repairCost: { scrap_metal: 15, crystal_shard: 5, alien_crystal: 3 },
    maxLevel: 3,
    upgrades: [
      { level: 2, cost: { scrap_metal: 25, crystal_shard: 10, alien_crystal: 5  }, bonus: { roverSlots: 2, powerUse: 8 } },
      { level: 3, cost: { scrap_metal: 40, crystal_shard: 15, alien_crystal: 12 }, bonus: { roverSlots: 2, powerUse: 12 } },
    ],
  },

  LIFE_SUPPORT: {
    id: 'LIFE_SUPPORT',
    name: 'Yaşam Desteği',
    desc: 'Kapsül eko-sistemini güçlendirir.',
    icon: '🌿',
    tileW: 2, tileH: 2,
    drawH: 26,
    color: { top: '#006622', sideL: '#004416', sideR: '#003310', accent: '#44ff88' },
    buildCost: { scrap_metal: 12, alien_plant: 8 },
    powerUse: 10,
    lifeSupportBonus: 50,
    maxLevel: 3,
    upgrades: [
      { level: 2, cost: { scrap_metal: 18, alien_plant: 15 }, bonus: { lifeSupportBonus: 75 } },
      { level: 3, cost: { scrap_metal: 30, alien_crystal: 8 }, bonus: { lifeSupportBonus: 125 } },
    ],
  },

  RESEARCH_LAB: {
    id: 'RESEARCH_LAB',
    name: 'Araştırma Laboratuvarı',
    desc: 'Yeni teknoloji ve rover yükseltmeleri araştırır.',
    icon: '🔬',
    tileW: 2, tileH: 2,
    drawH: 30,
    color: { top: '#7700cc', sideL: '#4a0088', sideR: '#330066', accent: '#cc88ff' },
    buildCost: { scrap_metal: 25, alien_crystal: 10, crystal_shard: 10 },
    powerUse: 20,
    maxLevel: 2,
    upgrades: [
      { level: 2, cost: { scrap_metal: 40, alien_crystal: 20 }, bonus: { researchSpeed: 2 } },
    ],
  },

  SOLAR_PANEL: {
    id: 'SOLAR_PANEL',
    name: 'Güneş Paneli',
    desc: 'Güneş enerjisini elektriğe dönüştürür. Gündüz daha verimli.',
    icon: '☀️',
    tileW: 2, tileH: 2,
    drawH: 5,            // çok yassı — düz panel
    flat: true,          // dome değil, düz çizilir
    color: { top: '#001a33', sideL: '#000d1a', sideR: '#000a14', accent: '#3377ff' },
    buildCost: { scrap_metal: 8, crystal_shard: 4 },
    powerGen: 45,
    powerUse: 0,
    maxLevel: 3,
    upgrades: [
      { level: 2, cost: { scrap_metal: 10, alien_crystal: 3 }, bonus: { powerGen: 30 } },
      { level: 3, cost: { scrap_metal: 18, alien_crystal: 8 }, bonus: { powerGen: 50 } },
    ],
  },
}

/**
 * İki bina arasında mesafe hesapla (tile cinsinden)
 */
export function buildingDistance(b1, b2) {
  const dx = b1.tx - b2.tx
  const dy = b1.ty - b2.ty
  return Math.sqrt(dx * dx + dy * dy)
}

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
    salvaged: false,         // CRASHED_SHIP için
    constructing: false,
    constructProgress: ['RESCUE_CAPSULE', 'CRASHED_SHIP', 'MAIN_COMPUTER'].includes(type) ? 100 : 0,
    repaired: type === 'MAIN_COMPUTER' ? false : undefined,
  }
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
 * Tüm binalara bağlı bağlantı grafiği (BFS)
 * core'a ulaşmayan binalar "bağlantısız" sayılır
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
          BUILDING_TYPES[b.type]?.connectionRadius ?? 8,
          BUILDING_TYPES[c.type]?.connectionRadius ?? 8
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
