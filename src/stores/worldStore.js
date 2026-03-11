import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { MapGenerator } from '@/game/world/MapGenerator.js'
import { DayNightCycle } from '@/game/world/DayNightCycle.js'
import { PlanetGenerator } from '@/game/world/PlanetGenerator.js'
import { generateResourceNodes } from '@/game/world/ResourceNodes.js'

export const useWorldStore = defineStore('world', () => {
  const map       = ref(null)
  const seed      = ref(null)
  const planet    = ref(null)          // PlanetGenerator çıktısı
  const dayNight  = ref(new DayNightCycle())
  const _nodeMap  = ref({})   // { nodeId: ResourceNode }

  const currentPhase   = computed(() => dayNight.value.phase)
  const darknessLevel  = computed(() => dayNight.value.darkness)
  const dayNumber      = computed(() => dayNight.value.dayNumber)
  const isNight        = computed(() => dayNight.value.isNight)
  const temperature    = computed(() => dayNight.value.temperature)
  const resourceNodes  = computed(() => _nodeMap.value)

  // Gezegen computed özellikleri
  const planetName     = computed(() => planet.value?.name ?? '???')
  const starType       = computed(() => planet.value?.star ?? null)
  const planetPhysical = computed(() => planet.value?.physical ?? null)
  const planetAtmos    = computed(() => planet.value?.atmosphere ?? null)
  const planetOrbit    = computed(() => planet.value?.orbit ?? null)
  const planetThermal  = computed(() => planet.value?.thermal ?? null)
  const planetRad      = computed(() => planet.value?.radiation ?? null)
  const planetEffects  = computed(() => planet.value?.effects ?? null)

  function generate(customSeed = null) {
    // 1. Gezegeni üret
    const planetSeed = customSeed ?? (Math.random() * 0xffffff | 0)
    const pg = new PlanetGenerator(planetSeed)
    planet.value = pg.generate()

    // 2. Haritayı gezegen tipine göre üret
    const gen    = new MapGenerator(planetSeed, planet.value)
    const result = gen.generate()
    seed.value   = result.seed
    map.value    = result

    // 3. Gece/gündüz döngüsünü gezegen termal değerleriyle başlat
    dayNight.value = new DayNightCycle(planet.value.thermal)

    // 4. Kaynak düğümlerini yerleştir
    const nodes = generateResourceNodes(result, result.seed)
    const nm    = {}
    for (const n of nodes) nm[n.id] = n
    _nodeMap.value = nm

    return result
  }

  function updateTime(delta) {
    dayNight.value.update(delta)
  }

  function getTile(tx, ty) {
    if (!map.value) return null
    const { tiles, width, height } = map.value
    if (tx < 0 || ty < 0 || tx >= width || ty >= height) return null
    return tiles[ty][tx]
  }

  function isPassable(tx, ty) {
    const tileId = getTile(Math.round(tx), Math.round(ty))
    if (tileId === null) return false
    return ![0, 1, 2, 7, 8, 9].includes(tileId)
  }

  function getNodeList() {
    return Object.values(_nodeMap.value)
  }

  function toJSON() {
    return {
      seed:    seed.value,
      planet:  planet.value,
      tiles:   map.value?.tiles ?? [],
      dayNight: dayNight.value.toJSON(),
      nodes:   Object.values(_nodeMap.value),
    }
  }

  function fromJSON(data) {
    if (!data) return
    seed.value   = data.seed
    planet.value = data.planet ?? null
    map.value  = {
      seed:   data.seed,
      planet: planet.value,
      width:  data.tiles[0]?.length ?? 64,
      height: data.tiles.length,
      tiles:  data.tiles,
      spawnX: 32, spawnY: 32,
    }
    dayNight.value = new DayNightCycle(planet.value?.thermal ?? null)
    if (data.dayNight) dayNight.value.fromJSON(data.dayNight)
    if (data.nodes) {
      const nm = {}
      for (const n of data.nodes) nm[n.id] = n
      _nodeMap.value = nm
    }
  }

  return {
    map, seed, planet, dayNight,
    currentPhase, darknessLevel, dayNumber, isNight, temperature, resourceNodes,
    planetName, starType, planetPhysical, planetAtmos, planetOrbit, planetThermal, planetRad, planetEffects,
    generate, updateTime, getTile, isPassable, getNodeList, toJSON, fromJSON,
  }
})
