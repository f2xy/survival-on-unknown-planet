/**
 * Oyun dengesi sabitleri — tüm sayısal değerler tek merkezde
 *
 * Yeni özellik eklerken veya dengeleme yaparken bu dosyayı referans alın.
 * Hiçbir sihirli sayı (magic number) kod içinde dağınık olmamalı.
 */

// ── Hayatta Kalma ──────────────────────────────────────────────────────────

/** Saniyede düşüş miktarları (normal koşullar) */
export const DRAIN_RATES = {
  hunger:  0.4,   // ~250s'de biter
  thirst:  0.6,   // ~167s'de biter
  oxygen:  0.2,   // ~500s — gezegen atmosferi kısmi oksijen
  energy:  0.3,   // hareket halinde
}

/** Açlık/susuzluk/hipoksi sağlık düşüş hızı (sn başına) */
export const HEALTH_DRAIN_RATE = 1.5

/** Doğal iyileşme hızı (sn başına) */
export const HEALTH_REGEN_RATE = 0.5

/** Enerji geri kazanım hızı (hareketsizken, sn başına) */
export const ENERGY_REGEN_RATE = 0.15

/** Kritik eşikler (yüzde) */
export const CRITICAL_THRESHOLDS = {
  health:  { warning: 30, critical: 15 },
  hunger:  { warning: 25, critical: 10, healthDrain: 20 },
  thirst:  { warning: 25, critical: 10, healthDrain: 20 },
  oxygen:  { warning: 20, critical: 10, healthDrain: 15 },
  energy:  { warning: 15 },
}

/** Hayatta kalma stat varsayılanları */
export const SURVIVAL_DEFAULTS = {
  health:  { value: 100, max: 100 },
  hunger:  { value: 100, max: 100 },
  thirst:  { value: 100, max: 100 },
  oxygen:  { value: 100, max: 100 },
  energy:  { value: 100, max: 100 },
}

// ── Rover ──────────────────────────────────────────────────────────────────

/** Rover temel tanımı */
export const ROVER_DEF = {
  id: 'ROVER',
  name: 'Rover',
  icon: '🤖',
  buildCost: { scrap_metal: 8, crystal_shard: 3 },
  buildTime: 20,           // saniye
  breakdownChance: 0.006,  // sn başına arıza olasılığı
  attackVulnerability: 0.5,
  levels: [
    { level: 1, speed: 3,   capacity: 15, durability: 80,  collectRate: 5,  powerUse: 4  },
    { level: 2, speed: 4,   capacity: 25, durability: 130, collectRate: 8,  powerUse: 7,  upgradeCost: { scrap_metal: 15, crystal_shard: 5 } },
    { level: 3, speed: 5.5, capacity: 40, durability: 200, collectRate: 12, powerUse: 11, upgradeCost: { scrap_metal: 30, alien_crystal: 8 } },
  ],
}

/** Rover onarım maliyeti */
export const ROVER_REPAIR_COST = { scrap_metal: 3 }

/** Rover onarım iyileşme miktarı */
export const ROVER_REPAIR_HEAL = 40

/** Acil kurtarma sistemi — tüm roverlar hasarlıyken tetiklenir */
export const EMERGENCY_RECOVERY = {
  waitSeconds: 15,    // bekleme süresi
  healAmount:  25,    // iyileşme miktarı
}

/** Bilgisayar seviyesine göre maksimum rover sayıları */
export const COMPUTER_ROVER_LIMITS = [2, 4, 6]

// ── Üs (Base) ──────────────────────────────────────────────────────────────

/** Varsayılan depolama kapasitesi (bina bonusu olmadan) */
export const BASE_STORAGE_CAPACITY = 200

/** Varsayılan bağlantı menzili (tile) */
export const DEFAULT_CONNECTION_RADIUS = 8

/** Bina inşaat hızı (sn başına ilerleme yüzdesi) */
export const BUILD_RATE = 20

// ── Dünya ──────────────────────────────────────────────────────────────────

/** Harita boyutu (tile) */
export const MAP_SIZE = 64

/** Tam gün süresi (saniye) */
export const DAY_DURATION = 600

/** Kaynak düğümü grid hücre boyutu */
export const RESOURCE_CELL_SIZE = 8

/** Spawn güvenli alan yarıçapı */
export const SPAWN_SAFE_RADIUS = 10

// ── Bilgisayar Stratejileri ────────────────────────────────────────────────

export const COMPUTER_STRATEGIES = [
  { id: 'balanced', icon: '⚖',  label: 'DENGELİ',  desc: 'Az olan kaynaklar önce toplanır' },
  { id: 'repair',   icon: '🔩', label: 'TAMİR',    desc: 'Hurda metal öncelikli' },
  { id: 'explore',  icon: '💎', label: 'KEŞİF',    desc: 'Alien kaynaklar öncelikli' },
]

/** Tüm kaynak türleri — öncelik sıralaması için */
export const ALL_RESOURCE_TYPES = ['scrap_metal', 'crystal_shard', 'alien_plant', 'alien_crystal', 'rock']

// ── Başlangıç Envanteri ────────────────────────────────────────────────────

export const STARTING_INVENTORY = {
  scrap_metal: 15,
  rock: 10,
  alien_plant: 5,
  crystal_shard: 3,
}
