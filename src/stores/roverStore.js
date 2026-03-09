import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  ROVER_STATUS, ROVER_DEF, ROVER_TYPES, getRoverStats,
  createRover, updateRover, deployRover as _deploy, recallRover as _recall,
} from '@/game/systems/RoverSystem.js'
import { useBaseStore }      from './baseStore.js'
import { useWorldStore }     from './worldStore.js'
import { useInventoryStore } from './inventoryStore.js'
import { useGameStore }      from './gameStore.js'

export { ROVER_STATUS, ROVER_DEF, ROVER_TYPES, getRoverStats }

// Bilgisayar stratejileri
export const COMPUTER_STRATEGIES = [
  { id: 'balanced', icon: '⚖',  label: 'DENGELİ',  desc: 'Az olan kaynaklar önce toplanır' },
  { id: 'repair',   icon: '🔩', label: 'TAMİR',    desc: 'Hurda metal öncelikli' },
  { id: 'explore',  icon: '💎', label: 'KEŞİF',    desc: 'Alien kaynaklar öncelikli' },
]

// Tüm kaynak türleri — öncelik sıralaması için
const ALL_RESOURCE_TYPES = ['scrap_metal', 'crystal_shard', 'alien_plant', 'alien_crystal', 'rock']

export const useRoverStore = defineStore('rover', () => {
  const rovers           = ref([])
  const computerStrategy = ref('balanced')   // 'balanced' | 'repair' | 'explore'

  // Kilitlenme sayacı (iç değişken)
  let _stuckSeconds = 0

  const idleRovers     = computed(() => rovers.value.filter(r => r.status === ROVER_STATUS.IDLE))
  const activeRovers   = computed(() => rovers.value.filter(r =>
    [ROVER_STATUS.DEPLOYING, ROVER_STATUS.COLLECTING, ROVER_STATUS.RETURNING].includes(r.status)))
  const damagedRovers  = computed(() => rovers.value.filter(r => r.status === ROVER_STATUS.DAMAGED))
  const buildingRovers = computed(() => rovers.value.filter(r => r.status === ROVER_STATUS.BUILDING))

  /** Sadece görevdeki roverlerin güç tüketimi (idle/hasar/inşa = tüketmez) */
  const totalPowerDraw = computed(() =>
    rovers.value
      .filter(r => [ROVER_STATUS.DEPLOYING, ROVER_STATUS.COLLECTING, ROVER_STATUS.RETURNING].includes(r.status))
      .reduce((sum, r) => sum + (getRoverStats(r.level ?? 1).powerUse ?? 4), 0)
  )

  /** Aktif strateji tanımını döndürür */
  const currentStrategy = computed(() =>
    COMPUTER_STRATEGIES.find(s => s.id === computerStrategy.value) ?? COMPUTER_STRATEGIES[0]
  )

  function setComputerStrategy(mode) {
    computerStrategy.value = mode
    const s = COMPUTER_STRATEGIES.find(s => s.id === mode)
    useGameStore().notify(`Strateji: ${s?.label ?? mode}`, 'info')
  }

  /**
   * Yeni rover inşa et
   */
  function buildRover() {
    const base      = useBaseStore()
    const inventory = useInventoryStore()
    const game      = useGameStore()

    if (!base.computerRepaired) {
      game.notify('Ana Bilgisayar tamir edilmeli!', 'error'); return false
    }
    const activeCount = rovers.value.filter(r => r.status !== ROVER_STATUS.DESTROYED).length
    if (activeCount >= base.maxRovers) {
      game.notify(`Bilgisayar kapasitesi dolu! (max ${base.maxRovers} rover)`, 'error'); return false
    }
    for (const [item, qty] of Object.entries(ROVER_DEF.buildCost)) {
      if (!inventory.has(item, qty)) { game.notify('Yetersiz kaynak!', 'error'); return false }
    }
    for (const [item, qty] of Object.entries(ROVER_DEF.buildCost)) inventory.remove(item, qty)

    const rover = createRover()
    rover.status = ROVER_STATUS.BUILDING
    rovers.value.push(rover)
    game.notify(`${rover.name} inşa başladı...`, 'info')
    return true
  }

  /**
   * Rover'ı yükselt (seviye +1)
   */
  function upgradeRover(roverId) {
    const rover     = rovers.value.find(r => r.id === roverId)
    const inventory = useInventoryStore()
    const game      = useGameStore()

    if (!rover || rover.status !== ROVER_STATUS.IDLE) return false

    const currentLevel  = rover.level ?? 1
    const nextLevelData = ROVER_DEF.levels[currentLevel]
    if (!nextLevelData) { game.notify('Maksimum seviye!', 'warning'); return false }

    const cost = nextLevelData.upgradeCost
    for (const [item, qty] of Object.entries(cost)) {
      if (!inventory.has(item, qty)) { game.notify('Yükseltme için yetersiz kaynak!', 'error'); return false }
    }
    for (const [item, qty] of Object.entries(cost)) inventory.remove(item, qty)

    rover.level = currentLevel + 1
    const stats = getRoverStats(rover.level)
    rover.maxHealth = stats.durability
    rover.capacity  = stats.capacity
    rover.health = Math.min(rover.health, rover.maxHealth)

    game.notify(`${rover.name} Seviye ${rover.level}'e yükseltildi!`, 'success')
    return true
  }

  /**
   * Rover'ı kaynak düğümüne gönder (manuel)
   */
  function deploy(roverId, nodeId) {
    const world = useWorldStore()
    const base  = useBaseStore()
    const game  = useGameStore()

    const rover = rovers.value.find(r => r.id === roverId)
    const node  = world.resourceNodes[nodeId]
    if (!rover || !node) return false

    if (node.remaining <= 0) { game.notify('Kaynak tükendi!', 'warning'); return false }

    const inventory = useInventoryStore()
    if (inventory.totalCount >= base.storageCapacity) {
      game.notify('Depo dolu! Önce yer aç.', 'warning'); return false
    }

    const { tx, ty } = base.getCorePosition()
    const ok = _deploy(rover, node, tx, ty)
    if (ok) game.notify(`${rover.name} göreve çıktı → ${node.type}`, 'info')
    return ok
  }

  /**
   * Rover'ı geri çağır
   */
  function recall(roverId) {
    const rover = rovers.value.find(r => r.id === roverId)
    if (!rover) return
    _recall(rover)
    useGameStore().notify(`${rover.name} geri çağrıldı.`, 'info')
  }

  /**
   * Rover'ı onar
   */
  function repair(roverId) {
    const inventory = useInventoryStore()
    const game      = useGameStore()
    const rover     = rovers.value.find(r => r.id === roverId)
    if (!rover || rover.status !== ROVER_STATUS.DAMAGED) return false

    const cost = { scrap_metal: 3 }
    for (const [item, qty] of Object.entries(cost)) {
      if (!inventory.has(item, qty)) { game.notify('Onarım için yetersiz hurda metal!', 'error'); return false }
    }
    for (const [item, qty] of Object.entries(cost)) inventory.remove(item, qty)

    rover.health = Math.min(rover.maxHealth, rover.health + 40)
    rover.status = rover.mission ? ROVER_STATUS.DEPLOYING : ROVER_STATUS.IDLE
    _stuckSeconds = 0
    game.notify(`${rover.name} onarıldı.`, 'success')
    return true
  }

  /**
   * Yok edilen rover'ı listeden kaldır
   */
  function dismiss(roverId) {
    const idx = rovers.value.findIndex(r => r.id === roverId)
    if (idx !== -1) rovers.value.splice(idx, 1)
  }

  /**
   * Her frame güncelle
   */
  function tick(delta) {
    const world     = useWorldStore()
    const inventory = useInventoryStore()
    const game      = useGameStore()
    const base      = useBaseStore()

    // ── Otonom mod ────────────────────────────────────────────────────────────
    if (base.computerRepaired) {
      const { tx: bx, ty: by } = base.getCorePosition()
      const targeted = new Set(
        rovers.value.filter(r => r.mission?.nodeId).map(r => r.mission.nodeId)
      )
      const priorities = _computePriorities(inventory)

      const storageFree = base.storageCapacity - inventory.totalCount
      if (storageFree > 0) {
        for (const rover of rovers.value) {
          if (rover.status !== ROVER_STATUS.IDLE) continue
          if (rover.mode === 'manual') continue   // manuel mod → otonom atama yok
          _autoAssignRover(rover, world.resourceNodes, bx, by, targeted, priorities)
        }
      }

      // ── Kilitlenme tespiti: tüm roverlar hasarlı → acil kısmi tamir ────────
      const activeRoversArr = rovers.value.filter(r => r.status !== ROVER_STATUS.DESTROYED)
      const allDamaged = activeRoversArr.length > 0 &&
        activeRoversArr.every(r => r.status === ROVER_STATUS.DAMAGED)

      if (allDamaged) {
        _stuckSeconds += delta
        if (_stuckSeconds >= 15) {
          _stuckSeconds = 0
          const rover = rovers.value.find(r => r.status === ROVER_STATUS.DAMAGED)
          if (rover) {
            rover.health = Math.min(rover.maxHealth, rover.health + 25)
            rover.status = ROVER_STATUS.IDLE
            game.notify(`⚙ ${rover.name}: Acil sistem kurtarması gerçekleşti.`, 'warning')
          }
        }
      } else {
        _stuckSeconds = 0
      }
    }

    // ── Rover tick döngüsü ────────────────────────────────────────────────────
    for (const rover of rovers.value) {
      if (rover.status === ROVER_STATUS.BUILDING) {
        rover.buildTimeLeft -= delta
        rover.buildProgress = Math.max(0, ((ROVER_DEF.buildTime - rover.buildTimeLeft) / ROVER_DEF.buildTime) * 100)
        if (rover.buildTimeLeft <= 0) {
          rover.buildTimeLeft = 0
          rover.buildProgress = 100
          rover.status = ROVER_STATUS.IDLE
          game.notify(`${rover.name} hazır!`, 'success')
        }
        continue
      }

      if (!rover.mission) continue

      const result = updateRover(rover, delta, world.resourceNodes)

      if (result.completed) {
        let storageFull = false
        for (const [rType, amount] of Object.entries(result.resources)) {
          const ok = inventory.add(rType, Math.round(amount))
          if (!ok) storageFull = true
        }
        if (result.resources) {
          const summary = Object.entries(result.resources)
            .map(([t, a]) => `${Math.round(a)} ${t.replace('_', ' ')}`)
            .join(', ')
          game.notify(`${rover.name} döndü → ${summary}`, 'success')
        }
        if (storageFull) {
          game.notify('Depo dolu! Kaynaklar alınamadı.', 'warning')
        }
      }

      if (result.event) {
        game.notify(result.event.message, result.event.type)
      }
    }
  }

  /**
   * Rover modunu değiştir: 'auto' | 'manual'
   */
  function setRoverMode(roverId, mode) {
    const rover = rovers.value.find(r => r.id === roverId)
    if (!rover) return
    rover.mode = mode
    useGameStore().notify(`${rover.name}: ${mode === 'manual' ? 'Manuel Mod' : 'Otonom Mod'}`, 'info')
  }

  /** Kaynak harcamadan doğrudan rover ekle (başlangıç hediyesi) */
  function addFreeRover() {
    const rover = createRover()
    rovers.value.push(rover)
    return rover
  }

  // ── Otonom yönetim yardımcıları ───────────────────────────────────────────

  /**
   * Strateji + envanter durumuna göre kaynak öncelik listesi hesaplar
   */
  function _computePriorities(inventory) {
    // Sabit strateji modları
    if (computerStrategy.value === 'repair') {
      return ['scrap_metal', 'crystal_shard', 'rock', 'alien_plant', 'alien_crystal']
    }
    if (computerStrategy.value === 'explore') {
      return ['alien_crystal', 'alien_plant', 'crystal_shard', 'scrap_metal', 'rock']
    }

    // 'balanced': envanter seviyesine göre otomatik sıralama
    const scores = {}
    for (const t of ALL_RESOURCE_TYPES) {
      scores[t] = inventory.items[t] ?? 0
    }

    // Hasarlı rover varsa ve hurda metal azsa → hurda metale büyük öncelik
    const hasDamaged = rovers.value.some(r => r.status === ROVER_STATUS.DAMAGED)
    const scrapCount = inventory.items['scrap_metal'] ?? 0
    if (hasDamaged && scrapCount < 6) {
      scores['scrap_metal'] -= 200  // en düşük score = en yüksek öncelik
    }

    return [...ALL_RESOURCE_TYPES].sort((a, b) => scores[a] - scores[b])
  }

  /**
   * Öncelik skoru en yüksek düğüme rover atar
   * Skor = öncelik bonusu (büyük) - mesafe cezası (küçük)
   */
  function _autoAssignRover(rover, resourceNodes, baseX, baseY, targeted, priorities) {
    let bestNode  = null
    let bestScore = -Infinity

    for (const node of Object.values(resourceNodes)) {
      if (node.remaining <= 0) continue
      if (targeted.has(node.id)) continue

      const dx   = node.tx - baseX
      const dy   = node.ty - baseY
      const dist = Math.sqrt(dx * dx + dy * dy)

      // Öncelik sırası (0 = en önde) → yüksek bonus
      const rank  = priorities.indexOf(node.type)
      const bonus = rank >= 0 ? (priorities.length - rank) * 60 : 0
      const score = bonus - dist

      if (score > bestScore) {
        bestScore = score
        bestNode  = node
      }
    }

    if (bestNode) {
      targeted.add(bestNode.id)
      _deploy(rover, bestNode, baseX, baseY)
    }
  }

  function toJSON() {
    return {
      rovers: rovers.value.map(r => ({ ...r, mission: r.mission ? { ...r.mission } : null })),
      computerStrategy: computerStrategy.value,
    }
  }

  function fromJSON(data) {
    if (!data) return
    rovers.value = data.rovers ?? []
    if (data.computerStrategy) computerStrategy.value = data.computerStrategy
  }

  return {
    rovers, idleRovers, activeRovers, damagedRovers, buildingRovers,
    computerStrategy, currentStrategy, totalPowerDraw,
    setComputerStrategy,
    buildRover, addFreeRover, upgradeRover, deploy, recall, repair, dismiss, setRoverMode, tick, toJSON, fromJSON,
  }
})
