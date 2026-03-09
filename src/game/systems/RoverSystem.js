/**
 * Rover sistemi — tek tip rover, seviye tabanlı istatistikler
 */

export const ROVER_STATUS = {
  IDLE:       'idle',
  DEPLOYING:  'deploying',    // hedefe gidiyor
  COLLECTING: 'collecting',   // kaynakta topluyor
  RETURNING:  'returning',    // üsse dönüyor
  DAMAGED:    'damaged',      // arızalı — onarım bekliyor
  DESTROYED:  'destroyed',    // yok edildi
  BUILDING:   'building',     // inşa halinde
}

export const ROVER_DEF = {
  id: 'ROVER',
  name: 'Rover',
  icon: '🤖',
  buildCost: { scrap_metal: 8, crystal_shard: 3 },
  buildTime: 20,
  breakdownChance: 0.006,
  attackVulnerability: 0.5,
  levels: [
    { level: 1, speed: 3,   capacity: 15, durability: 80,  collectRate: 5,  powerUse: 4  },
    { level: 2, speed: 4,   capacity: 25, durability: 130, collectRate: 8,  powerUse: 7,  upgradeCost: { scrap_metal: 15, crystal_shard: 5 } },
    { level: 3, speed: 5.5, capacity: 40, durability: 200, collectRate: 12, powerUse: 11, upgradeCost: { scrap_metal: 30, alien_crystal: 8 } },
  ],
}

// HUD icon uyumluluğu için alias
export const ROVER_TYPES = { ROVER: ROVER_DEF }

export function getRoverStats(level = 1) {
  return ROVER_DEF.levels[Math.min(level, ROVER_DEF.levels.length) - 1]
}

// Olası yol olayları
const EVENTS = [
  {
    id: 'breakdown',
    label: 'Mekanik Arıza',
    probability: () => ROVER_DEF.breakdownChance,
    apply(rover) {
      rover.status = ROVER_STATUS.DAMAGED
      rover.health = Math.max(1, rover.health - 20)
    },
    message: (rover) => `${rover.name} arızalandı! Onarım gerekiyor.`,
  },
  {
    id: 'alien_attack',
    label: 'Alien Saldırısı',
    probability: () => 0.003 * ROVER_DEF.attackVulnerability,
    apply(rover) {
      const damage = 20 + Math.random() * 30 | 0
      rover.health -= damage
      if (rover.health <= 0) {
        rover.health = 0
        rover.status = ROVER_STATUS.DESTROYED
        rover.mission = null
      } else {
        rover.status = ROVER_STATUS.DAMAGED
      }
    },
    message: (rover) => rover.status === ROVER_STATUS.DESTROYED
      ? `${rover.name} alien saldırısında yok edildi!`
      : `${rover.name} alien saldırısına uğradı, hasar aldı!`,
  },
  {
    id: 'extra_find',
    label: 'Ek Kaynak Bulundu',
    probability: () => 0.005,
    apply(rover) {
      if (rover.mission) rover.mission.bonusResources = (rover.mission.bonusResources ?? 0) + 5
    },
    message: (rover) => `${rover.name} ekstra kaynak buldu!`,
  },
]

/**
 * Yeni rover instance oluştur
 */
export function createRover(id, name) {
  const stats = getRoverStats(1)
  return {
    id: id ?? `r_${Date.now()}_${Math.random().toString(36).slice(2,5)}`,
    type: 'ROVER',
    level: 1,
    name: name ?? generateName(),
    status: ROVER_STATUS.IDLE,
    mode: 'auto',          // 'auto' | 'manual'
    health: stats.durability,
    maxHealth: stats.durability,
    capacity: stats.capacity,
    resources: {},
    resourcesTotal: 0,
    mission: null,
    buildProgress: 0,
    buildTimeLeft: ROVER_DEF.buildTime,
  }
}

/**
 * Rover görevini her tick güncelle
 */
export function updateRover(rover, delta, resourceNodes) {
  if (!rover.mission) return {}
  if (rover.status === ROVER_STATUS.DAMAGED || rover.status === ROVER_STATUS.DESTROYED) return {}

  const stats  = getRoverStats(rover.level ?? 1)
  const mission = rover.mission
  const result = {}

  // ── İnşa aşaması ──
  if (rover.status === ROVER_STATUS.BUILDING) {
    rover.buildProgress += (delta / ROVER_DEF.buildTime) * 100
    if (rover.buildProgress >= 100) {
      rover.buildProgress = 100
      rover.status = ROVER_STATUS.IDLE
      rover.mission = null
      result.builtDone = true
    }
    return result
  }

  // ── Gitme ──
  if (rover.status === ROVER_STATUS.DEPLOYING) {
    mission.travelProgress += (stats.speed / mission.distance) * delta * 100
    if (mission.travelProgress >= 100) {
      mission.travelProgress = 100
      rover.status = ROVER_STATUS.COLLECTING
      mission.collectProgress = 0
    } else {
      const evt = checkEvent(rover, delta)
      if (evt) { result.event = evt; return result }
    }
  }

  // ── Toplama ──
  if (rover.status === ROVER_STATUS.COLLECTING) {
    const node = resourceNodes[mission.nodeId]
    if (!node || node.remaining <= 0) {
      rover.status = ROVER_STATUS.RETURNING
      mission.travelProgress = 0
      return result
    }

    const collectAmount = Math.min(stats.collectRate * delta, node.remaining, rover.capacity - rover.resourcesTotal)
    node.remaining -= collectAmount
    rover.resources[node.type] = (rover.resources[node.type] ?? 0) + collectAmount
    rover.resourcesTotal += collectAmount
    mission.collectProgress = (rover.resourcesTotal / rover.capacity) * 100

    if (rover.resourcesTotal >= rover.capacity) {
      rover.status = ROVER_STATUS.RETURNING
      mission.travelProgress = 0
    }
  }

  // ── Dönüş ──
  if (rover.status === ROVER_STATUS.RETURNING) {
    mission.travelProgress += (stats.speed / mission.distance) * delta * 100
    if (mission.travelProgress >= 100) {
      result.completed = true
      result.resources  = { ...rover.resources }
      rover.resources   = {}
      rover.resourcesTotal = 0
      rover.mission     = null
      rover.status      = ROVER_STATUS.IDLE
    } else {
      const evt = checkEvent(rover, delta)
      if (evt) { result.event = evt; return result }
    }
  }

  return result
}

/**
 * Rover'ı bir kaynak düğümüne gönder
 */
export function deployRover(rover, node, baseX, baseY) {
  if (rover.status !== ROVER_STATUS.IDLE) return false
  const dx = node.tx - baseX, dy = node.ty - baseY
  const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy))
  rover.status = ROVER_STATUS.DEPLOYING
  rover.mission = {
    nodeId: node.id,
    targetX: node.tx,
    targetY: node.ty,
    resourceType: node.type,
    distance: dist,
    travelProgress: 0,
    collectProgress: 0,
    bonusResources: 0,
  }
  return true
}

/**
 * Rover'ı geri çağır
 */
export function recallRover(rover) {
  if ([ROVER_STATUS.DEPLOYING, ROVER_STATUS.COLLECTING].includes(rover.status)) {
    rover.status = ROVER_STATUS.RETURNING
    if (rover.mission) rover.mission.travelProgress = 0
  }
}

function checkEvent(rover, delta) {
  for (const evt of EVENTS) {
    if (Math.random() < evt.probability(rover) * delta) {
      evt.apply(rover)
      return { id: evt.id, message: evt.message(rover), type: evt.id === 'extra_find' ? 'success' : 'error' }
    }
  }
  return null
}

let _nameIdx = 0
const NAMES = ['Alfa', 'Beta', 'Gama', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Teta', 'Iota', 'Kappa']
function generateName() { return NAMES[_nameIdx++ % NAMES.length] }
