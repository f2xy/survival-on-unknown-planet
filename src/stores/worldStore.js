import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { MapGenerator } from '@/game/world/MapGenerator.js'
import { DayNightCycle } from '@/game/world/DayNightCycle.js'
import { generateResourceNodes } from '@/game/world/ResourceNodes.js'

export const useWorldStore = defineStore('world', () => {
  const map       = ref(null)
  const seed      = ref(null)
  const dayNight  = ref(new DayNightCycle())
  const _nodeMap  = ref({})   // { nodeId: ResourceNode }

  const currentPhase   = computed(() => dayNight.value.phase)
  const darknessLevel  = computed(() => dayNight.value.darkness)
  const dayNumber      = computed(() => dayNight.value.dayNumber)
  const isNight        = computed(() => dayNight.value.isNight)
  const temperature    = computed(() => dayNight.value.temperature)
  const resourceNodes  = computed(() => _nodeMap.value)

  function generate(customSeed = null) {
    const gen    = new MapGenerator(customSeed)
    const result = gen.generate()
    seed.value   = result.seed
    map.value    = result

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
      seed: seed.value,
      tiles: map.value?.tiles ?? [],
      dayNight: dayNight.value.toJSON(),
      nodes: Object.values(_nodeMap.value),
    }
  }

  function fromJSON(data) {
    if (!data) return
    seed.value = data.seed
    map.value  = {
      seed: data.seed,
      width:  data.tiles[0]?.length ?? 64,
      height: data.tiles.length,
      tiles:  data.tiles,
      spawnX: 32, spawnY: 32,
    }
    if (data.dayNight) dayNight.value.fromJSON(data.dayNight)
    if (data.nodes) {
      const nm = {}
      for (const n of data.nodes) nm[n.id] = n
      _nodeMap.value = nm
    }
  }

  return {
    map, seed, dayNight,
    currentPhase, darknessLevel, dayNumber, isNight, temperature, resourceNodes,
    generate, updateTime, getTile, isPassable, getNodeList, toJSON, fromJSON,
  }
})
