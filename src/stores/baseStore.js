import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { BUILDING_TYPES } from '@/data/buildings.js'
import { BASE_STORAGE_CAPACITY, BUILD_RATE, DEFAULT_CONNECTION_RADIUS, COMPUTER_ROVER_LIMITS } from '@/data/balance.js'
import { createBuilding } from '@/game/systems/BaseSystem.js'
import { getBuildingPowerGen, getBuildingPowerUse, computeConnectedSet, computeConnections, buildingDistance } from '@/game/systems/PowerGrid.js'
import { useInventoryStore } from './inventoryStore.js'
import { useGameStore }      from './gameStore.js'

export const useBaseStore = defineStore('base', () => {
  const buildings        = ref([])
  const connections      = ref([])
  const selectedBuilding = ref(null)

  // ── Hesaplanmış ────────────────────────────────────────────────────────────

  const connectedIds = computed(() => computeConnectedSet(buildings.value))

  const totalPowerGen = computed(() => {
    let gen = 0
    for (const b of buildings.value) {
      if (!connectedIds.value.has(b.id)) continue
      gen += getBuildingPowerGen(b)
    }
    return gen
  })

  const totalPowerUse = computed(() => {
    let use = 0
    for (const b of buildings.value) {
      if (!connectedIds.value.has(b.id)) continue
      if (b.type === 'MAIN_COMPUTER' && !b.repaired) continue
      use += getBuildingPowerUse(b)
    }
    return use
  })

  // Bina güç dengesi (rover tüketimi dahil değil — roverStore'dan eklenir)
  const powerBalance = computed(() => totalPowerGen.value - totalPowerUse.value)

  // Güç üreten bağlı binalar (HUD listesi için)
  const powerSources = computed(() =>
    buildings.value
      .filter(b => connectedIds.value.has(b.id) && getBuildingPowerGen(b) > 0)
      .map(b => ({ ...b, gen: getBuildingPowerGen(b) }))
  )

  const storageCapacity = computed(() => {
    let cap = BASE_STORAGE_CAPACITY
    for (const b of buildings.value) {
      if (!connectedIds.value.has(b.id)) continue
      const def = BUILDING_TYPES[b.type]
      cap += (def?.storageCapacity ?? 0) * b.level
    }
    return cap
  })

  // ── Ana Bilgisayar ─────────────────────────────────────────────────────────

  const computerBuilding = computed(() =>
    buildings.value.find(b => b.type === 'MAIN_COMPUTER')
  )

  const computerRepaired = computed(() =>
    computerBuilding.value?.repaired === true
  )

  /** 1-3 arası; bilgisayar tamir edilmemişse 0 */
  const computerLevel = computed(() =>
    computerRepaired.value ? (computerBuilding.value?.level ?? 1) : 0
  )

  /** Bilgisayar seviyesine göre maksimum rover sayısı */
  const maxRovers = computed(() => {
    if (!computerRepaired.value) return 0
    return COMPUTER_ROVER_LIMITS[computerLevel.value - 1] ?? 2
  })

  /**
   * Ana Bilgisayarı yükselt — maliyeti envanterden düşer
   */
  function upgradeComputer() {
    const inventory = useInventoryStore()
    const game = useGameStore()
    const comp = computerBuilding.value

    if (!comp || !comp.repaired) return false
    const def = BUILDING_TYPES.MAIN_COMPUTER
    if (comp.level >= (def.maxLevel ?? 3)) {
      game.notify('Ana Bilgisayar maksimum seviyede!', 'warning')
      return false
    }

    const upgrade = def.upgrades?.find(u => u.level === comp.level + 1)
    if (!upgrade) return false

    for (const [item, qty] of Object.entries(upgrade.cost)) {
      if (!inventory.has(item, qty)) {
        game.notify('Yükseltme için yetersiz kaynak!', 'error')
        return false
      }
    }
    for (const [item, qty] of Object.entries(upgrade.cost)) inventory.remove(item, qty)

    comp.level++
    const newMax = COMPUTER_ROVER_LIMITS[comp.level - 1] ?? 6
    game.notify(`Ana Bilgisayar Sv.${comp.level} — Maks rover: ${newMax}`, 'success')
    return true
  }

  /**
   * Ana Bilgisayarı tamir et — maliyeti envanterden düşer
   */
  function repairComputer() {
    const inventory = useInventoryStore()
    const game = useGameStore()
    const comp = computerBuilding.value

    if (!comp || comp.repaired) return false

    const cost = BUILDING_TYPES.MAIN_COMPUTER.repairCost
    for (const [item, qty] of Object.entries(cost)) {
      if (!inventory.has(item, qty)) {
        game.notify('Tamir için yetersiz kaynak!', 'error')
        return false
      }
    }
    for (const [item, qty] of Object.entries(cost)) inventory.remove(item, qty)

    comp.repaired = true
    game.notify('Ana Bilgisayar tamir edildi! Roverlar otonom moda geçiyor...', 'success')
    return true
  }

  // ── Init ────────────────────────────────────────────────────────────────────

  function init(spawnX, spawnY) {
    buildings.value   = []
    connections.value = []

    const capsule = createBuilding('RESCUE_CAPSULE', spawnX - 1, spawnY - 1, 'b_core')
    capsule.constructProgress = 100
    buildings.value.push(capsule)

    const wreck = createBuilding('CRASHED_SHIP', spawnX + 4, spawnY - 2, 'b_wreck')
    wreck.constructProgress = 100
    buildings.value.push(wreck)

    // Ana Bilgisayar — başlangıçta hasarlı
    const computer = createBuilding('MAIN_COMPUTER', spawnX - 1, spawnY + 3, 'b_computer')
    computer.constructProgress = 100
    computer.repaired = false
    buildings.value.push(computer)

    _updateConnections()
  }

  // ── Bina işlemleri ─────────────────────────────────────────────────────────

  function placeBuilding(type, tx, ty) {
    const building = createBuilding(type, tx, ty)
    buildings.value.push(building)
    _updateConnections()
    return building
  }

  function updateConstruction(delta) {
    for (const b of buildings.value) {
      if (b.constructProgress < 100) {
        b.constructProgress = Math.min(100, b.constructProgress + BUILD_RATE * delta)
      }
    }
  }

  function upgradeBuilding(id) {
    const b   = buildings.value.find(b => b.id === id)
    const def = b ? BUILDING_TYPES[b.type] : null
    if (!b || !def || b.level >= (def.maxLevel ?? 1)) return false
    b.level++
    return true
  }

  function salvageCrashedShip() {
    const wreck = buildings.value.find(b => b.type === 'CRASHED_SHIP' && !b.salvaged)
    if (!wreck) return null
    wreck.salvaged = true
    return BUILDING_TYPES.CRASHED_SHIP.salvageYield
  }

  function canPlace(type, tx, ty) {
    const def = BUILDING_TYPES[type]
    if (!def || def.isCore || def.isDecoration || def.isStarting) return false

    for (const b of buildings.value) {
      if (Math.abs(b.tx - tx) < 3 && Math.abs(b.ty - ty) < 3) return false
    }

    for (const b of buildings.value) {
      if (!connectedIds.value.has(b.id) && b.type !== 'RESCUE_CAPSULE') continue
      const maxR = BUILDING_TYPES[b.type]?.connectionRadius ?? DEFAULT_CONNECTION_RADIUS
      if (buildingDistance({ tx, ty }, b) <= maxR) return true
    }
    return false
  }

  function _updateConnections() {
    connections.value = computeConnections(buildings.value)
  }

  function getCorePosition() {
    const core = buildings.value.find(b => BUILDING_TYPES[b.type]?.isCore)
    return core ? { tx: core.tx + 1, ty: core.ty + 1 } : { tx: 32, ty: 32 }
  }

  function toJSON() {
    return { buildings: buildings.value.map(b => ({ ...b })), connections: [...connections.value] }
  }

  function fromJSON(data) {
    if (!data) return
    buildings.value   = data.buildings ?? []
    connections.value = data.connections ?? []

    // Geriye dönük uyumluluk: eski kayıtta MAIN_COMPUTER yoksa ekle
    if (!buildings.value.find(b => b.type === 'MAIN_COMPUTER')) {
      const core = buildings.value.find(b => BUILDING_TYPES[b.type]?.isCore)
      const sx = core ? core.tx + 1 : 32
      const sy = core ? core.ty + 1 : 32
      const computer = createBuilding('MAIN_COMPUTER', sx - 1, sy + 3, 'b_computer')
      computer.constructProgress = 100
      computer.repaired = false
      buildings.value.push(computer)
    }

    _updateConnections()
  }

  return {
    buildings, connections, selectedBuilding, connectedIds,
    totalPowerGen, totalPowerUse, powerBalance, powerSources, storageCapacity,
    computerBuilding, computerRepaired, computerLevel, maxRovers,
    repairComputer, upgradeComputer,
    init, placeBuilding, updateConstruction, upgradeBuilding,
    salvageCrashedShip, canPlace, getCorePosition, toJSON, fromJSON,
  }
})
