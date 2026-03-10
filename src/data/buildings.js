/**
 * Bina tanımları — oyundaki tüm inşa edilebilir/mevcut yapılar
 *
 * Her bina tipi şu alanları içerir:
 *   id                {string}  Benzersiz tanımlayıcı (key ile aynı)
 *   name              {string}  Türkçe görünen ad
 *   desc              {string}  Açıklama
 *   icon              {string}  Emoji ikon
 *   tileW, tileH      {number}  Tile cinsinden boyut
 *   drawH             {number}  Render yüksekliği (px)
 *   color             {object}  { top, sideL, sideR, accent } — render renkleri
 *   isCore            {boolean} Merkez bina mı (Kurtarma Kapsülü)
 *   isDecoration      {boolean} Dekoratif mi (Gemi Enkazı)
 *   isStarting        {boolean} Başlangıç binası mı (inşa menüsünde görünmez)
 *   flat              {boolean} Düz panel mi (dome yerine flat render)
 *   buildCost         {object}  İnşa maliyeti { itemId: miktar } veya null
 *   powerGen          {number}  Güç üretimi
 *   powerUse          {number}  Güç tüketimi
 *   storageCapacity   {number}  Depolama kapasitesi bonusu
 *   connectionRadius  {number}  Bağlantı menzili (tile)
 *   maxLevel          {number}  Maksimum yükseltme seviyesi
 *   upgrades          {array}   Yükseltme tanımları [{ level, cost, bonus }]
 *   repairCost        {object}  Tamir maliyeti (MAIN_COMPUTER için)
 *   isSalvageable     {boolean} Sökülebilir mi
 *   salvageYield      {object}  Sökme verimi { itemId: miktar }
 */
export const BUILDING_TYPES = {
  RESCUE_CAPSULE: {
    id: 'RESCUE_CAPSULE',
    name: 'Kurtarma Kapsülü',
    desc: 'Yaşam ünitesinin merkez birimi. Tüm bağlantıların kalbi.',
    icon: '🛸',
    tileW: 3, tileH: 3,
    drawH: 36,
    color: { top: '#00e5ff', sideL: '#0077aa', sideR: '#005580', accent: '#80f0ff' },
    isCore: true,
    buildCost: null,
    powerGen: 20,
    connectionRadius: 10,
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
    isStarting: true,
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
    drawH: 5,
    flat: true,
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

/** Bina ikonunu döndürür */
export function getBuildingIcon(type) { return BUILDING_TYPES[type]?.icon ?? '🏗' }

/** Bina adını döndürür */
export function getBuildingName(type) { return BUILDING_TYPES[type]?.name ?? type }

/** Bina açıklamasını döndürür */
export function getBuildingDesc(type) { return BUILDING_TYPES[type]?.desc ?? '' }

/** Bina depolama kapasitesini hesaplar (seviye dahil) */
export function getBuildingStorageCap(building) {
  const def = BUILDING_TYPES[building.type]
  return def?.storageCapacity ? def.storageCapacity * (building.level ?? 1) : 0
}

/**
 * İnşa edilebilir bina tiplerini döndürür (core, dekorasyon, başlangıç binaları hariç)
 */
export function getBuildableTypes() {
  return Object.fromEntries(
    Object.entries(BUILDING_TYPES).filter(([, def]) =>
      !def.isCore && !def.isDecoration && !def.isStarting
    )
  )
}
