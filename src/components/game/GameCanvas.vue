<template>
  <div class="game-canvas-wrapper">
    <canvas ref="canvas" class="game-canvas" />

    <!-- Deploy modu banner -->
    <transition name="slide-up">
      <div v-if="gameStore.isDeploy" class="deploy-banner">
        <span class="ping-dot ping-dot--orange" />
        <span class="hud-label">HEDEF SEÇ — Bir kaynak noktasına tıklayın</span>
        <button class="hud-btn hud-btn--danger deploy-cancel" @click="gameStore.cancelDeploy">İPTAL</button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useGameStore, GAME_STATE } from '@/stores/gameStore.js'
import { useWorldStore }     from '@/stores/worldStore.js'
import { useBaseStore }      from '@/stores/baseStore.js'
import { useRoverStore }     from '@/stores/roverStore.js'
import { useInventoryStore } from '@/stores/inventoryStore.js'
import { GameLoop }   from '@/game/engine/GameLoop.js'
import { Renderer }   from '@/game/engine/Renderer.js'
import { InputHandler } from '@/game/engine/InputHandler.js'

const canvas      = ref(null)
const gameStore   = useGameStore()
const worldStore  = useWorldStore()
const baseStore   = useBaseStore()
const roverStore  = useRoverStore()
const inventoryStore = useInventoryStore()

let loop     = null
let renderer = null
let input    = null
let saveInterval = null

// ── Güncelleme mantığı ──
function update(delta) {
  if (gameStore.isPaused || gameStore.isInMenu) return

  // Kamera pan
  const { dx, dy } = input.cameraDelta
  if (dx !== 0 || dy !== 0) renderer.pan(dx * delta, dy * delta)

  // Bina inşaat ilerlemesi
  baseStore.updateConstruction(delta)

  // Rover tick
  roverStore.tick(delta)

  // Gece/gündüz
  worldStore.updateTime(delta)

  // Deploy modu: tıklamayı kontrol et
  if (gameStore.isDeploy) {
    const click = input.consumeClick()
    if (click) {
      const nodes = worldStore.getNodeList()
      const node  = renderer.findNodeAtScreen(click.x, click.y, nodes)
      if (node) {
        const roverId = gameStore.pendingDeployRoverId
        roverStore.deploy(roverId, node.id)
        gameStore.cancelDeploy()
      }
    }
    return
  }

  // Normal mod: bina tıklaması
  if (gameStore.isPlaying) {
    const click = input.consumeClick()
    if (click) {
      const building = renderer.findBuildingAtScreen(click.x, click.y, baseStore.buildings)
      baseStore.selectedBuilding = building ?? null
    }
  }
}

// ── Render mantığı ──
function render(delta, tick) {
  if (!renderer || !worldStore.map) return

  renderer.clear()
  renderer.drawMap(worldStore.map, tick)
  renderer.drawResourceNodes(worldStore.getNodeList(), tick, gameStore.isDeploy)
  renderer.drawConnections(baseStore.buildings, baseStore.connections, tick)
  renderer.drawBuildings(baseStore.buildings, baseStore.connectedIds, tick)
  renderer.drawNightOverlay(worldStore.darknessLevel)
}

// ── Klavye kısayolları ──
function handleKey(e) {
  if (gameStore.isInMenu) return
  if (e.code === 'Escape') {
    if (gameStore.isDeploy)  gameStore.cancelDeploy()
    else if (gameStore.isBuild) gameStore.resume()
    else if (gameStore.isPaused) gameStore.resume()
    else gameStore.pause()
  }
  if (e.code === 'KeyB' && gameStore.isPlaying) gameStore.openBuild()
  if (e.code === 'F5')  { e.preventDefault(); gameStore.saveGame() }
  if (e.code === 'Home' && renderer) {
    // Üsse dön
    const pos = baseStore.getCorePosition()
    renderer.centerOn(pos.tx, pos.ty)
  }
}

function resizeCanvas() {
  if (!canvas.value || !renderer) return
  renderer.resize(canvas.value.clientWidth, canvas.value.clientHeight)
}

onMounted(() => {
  renderer = new Renderer(canvas.value)
  resizeCanvas()

  // Başlangıç kamera konumu — core binaya odaklan
  const pos = baseStore.getCorePosition()
  renderer.centerOn(pos.tx, pos.ty)

  input = new InputHandler()
  input.attach()
  input.attachCanvas(canvas.value)

  loop = new GameLoop(update, render)
  loop.start()

  window.addEventListener('keydown', handleKey)
  window.addEventListener('resize',  resizeCanvas)

  saveInterval = setInterval(() => {
    if (gameStore.isPlaying) gameStore.saveGame()
  }, 60_000)
})

onUnmounted(() => {
  loop?.stop()
  input?.detach()
  window.removeEventListener('keydown', handleKey)
  window.removeEventListener('resize',  resizeCanvas)
  if (saveInterval) clearInterval(saveInterval)
})

// Core pozisyonu değişince kamerayı güncelle (yeni oyun başlangıcı)
watch(() => baseStore.buildings.length, (len) => {
  if (len > 0 && renderer) {
    const pos = baseStore.getCorePosition()
    renderer.centerOn(pos.tx, pos.ty)
  }
})

watch(() => gameStore.state, (s) => {
  if (s === GAME_STATE.PLAYING) loop?.start()
  else if (s === GAME_STATE.PAUSED) loop?.stop()
})
</script>

<style scoped>
.game-canvas-wrapper {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.game-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
}

.deploy-banner {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: var(--bg-panel);
  border: 1px solid var(--orange-glow);
  backdrop-filter: blur(6px);
  z-index: 200;
  animation: deploy-pulse 1.5s ease-in-out infinite;
}

@keyframes deploy-pulse {
  0%, 100% { border-color: var(--orange-glow); }
  50%       { border-color: var(--orange); }
}

.deploy-cancel {
  padding: 4px 12px;
  font-size: 9px;
}
</style>
