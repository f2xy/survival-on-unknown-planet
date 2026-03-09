import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePlayerStore = defineStore('player', () => {
  // ── Konum ──
  const x = ref(32)  // tile x
  const y = ref(32)  // tile y

  // ── Hayatta kalma istatistikleri ──
  const health  = ref(100)
  const healthMax = ref(100)
  const hunger  = ref(100)
  const hungerMax = ref(100)
  const thirst  = ref(100)
  const thirstMax = ref(100)
  const oxygen  = ref(100)
  const oxygenMax = ref(100)
  const energy  = ref(100)
  const energyMax = ref(100)

  // ── Durum ──
  const isAlive  = ref(true)
  const isMoving = ref(false)
  const score    = ref(0)

  // ── Hesaplanmış ──
  const healthPct  = computed(() => (health.value  / healthMax.value)  * 100)
  const hungerPct  = computed(() => (hunger.value  / hungerMax.value)  * 100)
  const thirstPct  = computed(() => (thirst.value  / thirstMax.value)  * 100)
  const oxygenPct  = computed(() => (oxygen.value  / oxygenMax.value)  * 100)
  const energyPct  = computed(() => (energy.value  / energyMax.value)  * 100)

  const alerts = computed(() => {
    const list = []
    if (healthPct.value  < 30) list.push({ stat: 'health',  msg: 'Kritik Sağlık!', level: healthPct.value  < 15 ? 'critical' : 'warning' })
    if (hungerPct.value  < 25) list.push({ stat: 'hunger',  msg: 'Açsınız!',       level: hungerPct.value  < 10 ? 'critical' : 'warning' })
    if (thirstPct.value  < 25) list.push({ stat: 'thirst',  msg: 'Susadınız!',     level: thirstPct.value  < 10 ? 'critical' : 'warning' })
    if (oxygenPct.value  < 20) list.push({ stat: 'oxygen',  msg: 'Düşük Oksijen!', level: oxygenPct.value  < 10 ? 'critical' : 'warning' })
    if (energyPct.value  < 15) list.push({ stat: 'energy',  msg: 'Yorgunsunuz!',   level: 'warning' })
    return list
  })

  // ── Eylemler ──
  function updateStats(delta, ctx = {}) {
    if (!isAlive.value) return

    const drain = (ref, rate) => { ref.value = Math.max(0, ref.value - rate * delta) }
    const restore = (ref, rate, max) => { ref.value = Math.min(max.value, ref.value + rate * delta) }

    drain(hunger, 0.4)
    drain(thirst, 0.6)
    drain(oxygen, 0.2 * (ctx.toxic ? 2 : 1))
    if (ctx.moving) drain(energy, 0.3)
    else            restore(energy, 0.15, energyMax)

    // Kritik → sağlık düşüşü
    const isStarving  = hungerPct.value  < 20
    const isThirsty   = thirstPct.value  < 20
    const isHypoxic   = oxygenPct.value  < 15
    if (isStarving || isThirsty || isHypoxic) {
      const mult = (isStarving ? 1 : 0) + (isThirsty ? 1.5 : 0) + (isHypoxic ? 2 : 0)
      drain(health, 1.5 * mult)
    } else if (healthPct.value < 100) {
      restore(health, 0.5, healthMax)
    }

    if (health.value <= 0) die()
    score.value += delta * 10  // hayatta kaldıkça puan
  }

  function move(dx, dy) {
    x.value += dx
    y.value += dy
    isMoving.value = true
  }

  function consume(item) {
    if (!item?.effects) return
    const { health: h, hunger: hu, thirst: th, oxygen: o, energy: e } = item.effects
    if (h)  health.value  = Math.min(healthMax.value,  health.value  + h)
    if (hu) hunger.value  = Math.min(hungerMax.value,  hunger.value  + hu)
    if (th) thirst.value  = Math.min(thirstMax.value,  thirst.value  + th)
    if (o)  oxygen.value  = Math.min(oxygenMax.value,  oxygen.value  + o)
    if (e)  energy.value  = Math.min(energyMax.value,  energy.value  + e)
  }

  function die() {
    isAlive.value = false
    health.value = 0
  }

  function respawn(spawnX, spawnY) {
    x.value = spawnX
    y.value = spawnY
    health.value  = 50
    hunger.value  = 70
    thirst.value  = 70
    oxygen.value  = 100
    energy.value  = 60
    isAlive.value = true
    score.value = 0
  }

  function toJSON() {
    return {
      x: x.value, y: y.value,
      health: health.value, healthMax: healthMax.value,
      hunger: hunger.value, hungerMax: hungerMax.value,
      thirst: thirst.value, thirstMax: thirstMax.value,
      oxygen: oxygen.value, oxygenMax: oxygenMax.value,
      energy: energy.value, energyMax: energyMax.value,
      score: score.value,
    }
  }

  function fromJSON(data) {
    if (!data) return
    x.value = data.x ?? 32;         y.value = data.y ?? 32
    health.value = data.health ?? 100; healthMax.value = data.healthMax ?? 100
    hunger.value = data.hunger ?? 100; hungerMax.value = data.hungerMax ?? 100
    thirst.value = data.thirst ?? 100; thirstMax.value = data.thirstMax ?? 100
    oxygen.value = data.oxygen ?? 100; oxygenMax.value = data.oxygenMax ?? 100
    energy.value = data.energy ?? 100; energyMax.value = data.energyMax ?? 100
    score.value = data.score ?? 0
    isAlive.value = true
  }

  return {
    x, y,
    health, healthMax, hunger, hungerMax,
    thirst, thirstMax, oxygen, oxygenMax, energy, energyMax,
    isAlive, isMoving, score,
    healthPct, hungerPct, thirstPct, oxygenPct, energyPct,
    alerts,
    updateStats, move, consume, die, respawn, toJSON, fromJSON
  }
})
