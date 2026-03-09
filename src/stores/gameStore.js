import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useWorldStore }     from './worldStore.js'
import { useInventoryStore } from './inventoryStore.js'
import { useBaseStore }      from './baseStore.js'
import { useRoverStore }     from './roverStore.js'
import { SaveSystem }        from '@/game/utils/SaveSystem.js'

export const GAME_STATE = {
  MENU:    'menu',
  PLAYING: 'playing',
  PAUSED:  'paused',
  BUILD:   'build',    // inşa modu (dialog açık)
  DEPLOY:  'deploy',   // rover konuşlandırma modu (node seçimi)
}

export const useGameStore = defineStore('game', () => {
  const state        = ref(GAME_STATE.MENU)
  const hasSave      = ref(SaveSystem.hasSave())
  const saveInfo     = ref(SaveSystem.getSaveInfo())
  const notifications = ref([])
  const survivedDays  = ref(0)
  // Deploy modunda bekleyen rover ID
  const pendingDeployRoverId = ref(null)

  let _notifId = 0

  const isPaused  = computed(() => state.value === GAME_STATE.PAUSED)
  const isPlaying = computed(() => state.value === GAME_STATE.PLAYING)
  const isInMenu  = computed(() => state.value === GAME_STATE.MENU)
  const isBuild   = computed(() => state.value === GAME_STATE.BUILD)
  const isDeploy  = computed(() => state.value === GAME_STATE.DEPLOY)

  function startNewGame() {
    const world     = useWorldStore()
    const inventory = useInventoryStore()
    const base      = useBaseStore()
    const rovers    = useRoverStore()

    const map = world.generate()
    base.init(map.spawnX, map.spawnY)
    inventory.fromJSON({ scrap_metal: 15, rock: 10, alien_plant: 5, crystal_shard: 3 })
    rovers.fromJSON({ rovers: [] })
    survivedDays.value = 0

    // Başlangıç keşif roveri — bilgisayar tamiri beklenmeksizin elle yönetilir
    rovers.addFreeRover()

    state.value = GAME_STATE.PLAYING
    notify('Kurtarma kapsülü aktif — Ana Bilgisayar hasarlı!', 'warning')
    notify('İlk görev: Bilgisayarı tamir et → roverlar otonom moda geçer.', 'info')
  }

  function loadGame() {
    const data = SaveSystem.load()
    if (!data) return false

    const world     = useWorldStore()
    const inventory = useInventoryStore()
    const base      = useBaseStore()
    const rovers    = useRoverStore()

    world.fromJSON(data.world)
    base.fromJSON(data.base)
    inventory.fromJSON(data.inventory)
    rovers.fromJSON(data.rovers)
    survivedDays.value = data.survivedDays ?? 0

    state.value = GAME_STATE.PLAYING
    notify('Üs yeniden aktif edildi.', 'success')
    return true
  }

  function saveGame() {
    const world     = useWorldStore()
    const inventory = useInventoryStore()
    const base      = useBaseStore()
    const rovers    = useRoverStore()

    const ok = SaveSystem.save({
      world:        world.toJSON(),
      base:         base.toJSON(),
      inventory:    inventory.toJSON(),
      rovers:       rovers.toJSON(),
      survivedDays: survivedDays.value,
    })

    if (ok) {
      hasSave.value  = true
      saveInfo.value = SaveSystem.getSaveInfo()
      notify('Üs verileri kaydedildi.', 'success')
    } else {
      notify('Kayıt başarısız!', 'error')
    }
    return ok
  }

  function pause()  { if (state.value === GAME_STATE.PLAYING) state.value = GAME_STATE.PAUSED }
  function resume() { if ([GAME_STATE.PAUSED, GAME_STATE.BUILD, GAME_STATE.DEPLOY].includes(state.value)) state.value = GAME_STATE.PLAYING }
  function openBuild()   { if (state.value === GAME_STATE.PLAYING) state.value = GAME_STATE.BUILD }

  // Rover konuşlandırma modu: haritada node tıklamayı bekle
  function startDeploy(roverId) {
    pendingDeployRoverId.value = roverId
    state.value = GAME_STATE.DEPLOY
    notify('Hedef kaynak noktasına tıklayın.', 'info')
  }
  function cancelDeploy() {
    pendingDeployRoverId.value = null
    state.value = GAME_STATE.PLAYING
  }

  function returnToMenu() { state.value = GAME_STATE.MENU }

  function notify(msg, type = 'info', ttl = 4000) {
    const id = ++_notifId
    notifications.value.push({ id, msg, type, ttl })
    setTimeout(() => { notifications.value = notifications.value.filter(n => n.id !== id) }, ttl)
  }

  return {
    state, hasSave, saveInfo, notifications, survivedDays, pendingDeployRoverId,
    isPaused, isPlaying, isInMenu, isBuild, isDeploy,
    startNewGame, loadGame, saveGame,
    pause, resume, openBuild, startDeploy, cancelDeploy, returnToMenu, notify,
  }
})
