<template>
  <transition name="slide-up">
    <div v-if="rover" class="hud-panel rover-info-panel">
      <div class="hud-label panel-title" style="display:flex;align-items:center;gap:6px">
        <span>🤖</span>
        <span style="flex:1">{{ rover.name }}</span>
        <span style="color:var(--cyan);font-size:9px">Sv.{{ rover.level ?? 1 }}</span>
        <button class="hud-btn" style="padding:2px 8px;font-size:8px"
          @click="$emit('close')">✕</button>
      </div>
      <div class="hud-divider" />

      <!-- İstatistikler -->
      <div class="building-stats">
        <div class="building-stat-row">
          <span class="hud-label" style="color:var(--text-dim)">DURUM</span>
          <span class="hud-label" style="color:var(--cyan)">{{ getRoverStatusLabel(rover.status) }}</span>
        </div>
        <div class="building-stat-row">
          <span class="hud-label" style="color:var(--text-dim)">SAĞLIK</span>
          <span class="hud-label" :class="rover.health / rover.maxHealth < 0.3 ? 'text-red' : 'text-green'">
            {{ rover.health }}/{{ rover.maxHealth }}
          </span>
        </div>
        <div class="building-stat-row">
          <span class="hud-label" style="color:var(--text-dim)">KAPASİTE</span>
          <span class="hud-label">{{ rover.resourcesTotal ?? 0 }}/{{ rover.capacity }}</span>
        </div>
        <div class="building-stat-row">
          <span class="hud-label" style="color:var(--text-dim)">TOPLAMA HIZI</span>
          <span class="hud-label">{{ currentStats.collectRate }}/s</span>
        </div>
        <div class="building-stat-row">
          <span class="hud-label" style="color:var(--text-dim)">HIZ</span>
          <span class="hud-label">{{ currentStats.speed }}</span>
        </div>
        <div class="building-stat-row">
          <span class="hud-label" style="color:var(--text-dim)">GÜÇ TÜKETİM</span>
          <span class="hud-label text-red">-{{ currentStats.powerUse }} (görevde)</span>
        </div>
      </div>

      <!-- Aktif görev bilgisi -->
      <template v-if="rover.mission">
        <div class="hud-divider" style="margin:6px 0" />
        <div class="hud-label" style="font-size:8px;color:var(--text-dim);margin-bottom:4px">AKTİF GÖREV</div>
        <div class="building-stat-row">
          <span class="hud-label" style="color:var(--text-dim)">HEDEF</span>
          <span class="hud-label" style="color:var(--cyan)">{{ rover.mission.resourceType?.replace('_', ' ') }}</span>
        </div>
        <div class="building-stat-row">
          <span class="hud-label" style="color:var(--text-dim)">MESAFE</span>
          <span class="hud-label">{{ Math.round(rover.mission.distance) }} tile</span>
        </div>
      </template>

      <!-- Sonraki seviye bilgisi -->
      <template v-if="nextLevel">
        <div class="hud-divider" style="margin:6px 0" />
        <div class="hud-label" style="font-size:8px;color:var(--text-dim);margin-bottom:4px">
          Sv.{{ (rover.level ?? 1) + 1 }} YÜKSELTMESİ
        </div>
        <div v-for="(qty, mat) in nextLevel.upgradeCost" :key="mat"
          class="building-stat-row">
          <span class="hud-label" style="color:var(--text-dim)">{{ getItemIcon(mat) }} {{ getItemName(mat) }}</span>
          <span class="hud-label" :class="inventoryStore.has(mat, qty) ? 'text-green' : 'text-red'">
            {{ inventoryStore.items[mat] ?? 0 }}/{{ qty }}
          </span>
        </div>
        <button class="hud-btn hud-btn--confirm rover-action-btn"
          :disabled="!canAffordUpgrade"
          @click="roverStore.upgradeRover(rover.id)">
          ⬆ YÜKSELT Sv.{{ (rover.level ?? 1) + 1 }}
        </button>
      </template>

      <!-- Mod seçici -->
      <div class="hud-divider" style="margin:6px 0" />
      <div class="hud-label" style="font-size:8px;color:var(--text-dim);margin-bottom:4px;letter-spacing:1px">KONTROL MODU</div>
      <div class="rover-mode-bar">
        <button class="hud-btn rover-mode-btn"
          :class="{ 'rover-mode-btn--active': rover.mode !== 'manual' }"
          @click="roverStore.setRoverMode(rover.id, 'auto')">
          ⚙ OTONOM
        </button>
        <button class="hud-btn rover-mode-btn"
          :class="{ 'rover-mode-btn--active': rover.mode === 'manual' }"
          @click="roverStore.setRoverMode(rover.id, 'manual')">
          🕹 MANUEL
        </button>
      </div>

      <!-- Aksiyon butonları -->
      <div class="hud-divider" style="margin:8px 0" />
      <div class="rover-info-actions">
        <button v-if="rover.status === 'idle' && (rover.mode === 'manual' || !baseStore.computerRepaired)"
          class="hud-btn rover-btn rover-btn--deploy rover-action-btn"
          @click="gameStore.startDeploy(rover.id); $emit('close')">
          ▶ KONUŞLANDIR
        </button>
        <span v-if="rover.status === 'idle' && rover.mode !== 'manual' && baseStore.computerRepaired"
          class="hud-label" style="font-size:8px;color:var(--cyan-dim)">OTONOM BEKLEMEDE</span>
        <button v-if="['deploying','collecting'].includes(rover.status)"
          class="hud-btn rover-btn rover-action-btn"
          @click="roverStore.recall(rover.id)">
          ◀ GERİ ÇAĞ
        </button>
        <button v-if="rover.status === 'damaged'"
          class="hud-btn rover-btn rover-btn--repair rover-action-btn"
          @click="roverStore.repair(rover.id)">
          🔧 ONAR (3🔩)
        </button>
        <button v-if="rover.status === 'destroyed'"
          class="hud-btn hud-btn--danger rover-action-btn"
          @click="roverStore.dismiss(rover.id); $emit('close')">
          ✕ KALDIR
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore }      from '@/stores/gameStore.js'
import { useBaseStore }      from '@/stores/baseStore.js'
import { useRoverStore }     from '@/stores/roverStore.js'
import { useInventoryStore } from '@/stores/inventoryStore.js'
import { ROVER_DEF }         from '@/data/balance.js'
import { getItemIcon, getItemName } from '@/data/items.js'
import { getRoverStatusLabel } from '@/data/ui-labels.js'

const props = defineProps({
  rover: { type: Object, default: null },
})
defineEmits(['close'])

const gameStore      = useGameStore()
const baseStore      = useBaseStore()
const roverStore     = useRoverStore()
const inventoryStore = useInventoryStore()

function getRoverStats(level = 1) {
  return ROVER_DEF.levels[Math.min(level, ROVER_DEF.levels.length) - 1]
}

const currentStats = computed(() => getRoverStats(props.rover?.level ?? 1))

const nextLevel = computed(() => {
  if (!props.rover) return null
  const next = ROVER_DEF.levels[props.rover.level ?? 1]
  return next?.upgradeCost ? next : null
})

const canAffordUpgrade = computed(() => {
  if (!nextLevel.value || !props.rover || props.rover.status !== 'idle') return false
  return Object.entries(nextLevel.value.upgradeCost).every(([item, qty]) => inventoryStore.has(item, qty))
})
</script>

<style scoped>
.rover-info-panel {
  position: absolute;
  top: 12px;
  right: 228px;
  min-width: 210px;
  max-width: 240px;
  max-height: calc(100vh - 80px);
  overflow-y: auto;
  z-index: 100;
  pointer-events: all;
}

.panel-title { margin-bottom: 6px; }

.building-stats { display: flex; flex-direction: column; gap: 4px; }
.building-stat-row {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 8px;
}

.text-green { color: var(--green); }
.text-red   { color: var(--red); }

.rover-mode-bar { display: flex; gap: 4px; margin-bottom: 4px; }
.rover-mode-btn {
  flex: 1; padding: 4px 2px; font-size: 8px; letter-spacing: 0.5px;
  opacity: 0.5;
}
.rover-mode-btn--active {
  opacity: 1;
  color: var(--cyan);
  border-color: var(--cyan);
  box-shadow: 0 0 6px var(--cyan-glow);
}

.rover-info-actions { display: flex; flex-direction: column; gap: 5px; }
.rover-action-btn { width: 100%; font-size: 8px; padding: 5px; }

.rover-btn { padding: 3px 7px; font-size: 8px; }
.rover-btn--deploy  { color: var(--green);  border-color: var(--green-glow); }
.rover-btn--repair  { color: var(--orange); border-color: var(--orange-glow); }
</style>
