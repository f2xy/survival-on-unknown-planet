<template>
  <div class="hud-panel hud-rovers">
    <div class="hud-label panel-title">
      <span class="ping-dot" :class="roverStore.activeRovers.length > 0 ? '' : 'ping-dot--orange'" />
      ROVER FİLOSU
    </div>
    <div class="hud-label" style="color:var(--text-dim);margin-bottom:6px">
      <template v-if="baseStore.computerRepaired">
        {{ roverStore.rovers.filter(r => r.status !== 'destroyed').length }}/{{ baseStore.maxRovers }}
        · <span style="color:var(--green);font-size:8px">OTONOM</span>
      </template>
      <template v-else>
        {{ roverStore.rovers.filter(r => r.status !== 'destroyed').length }} ROVER · MANUEL
      </template>
    </div>
    <div class="hud-divider" />

    <!-- Rover listesi -->
    <div class="rover-list">
      <div v-for="rover in activeRoverList" :key="rover.id" class="rover-card"
        :class="[`rover-card--${rover.status}`, selectedRover?.id === rover.id ? 'rover-card--selected' : '']"
        @click="toggleRoverInfo(rover)" style="cursor:pointer">
        <div class="rover-top">
          <span class="rover-type-icon">{{ getRoverIcon(rover.type) }}</span>
          <span class="hud-label rover-name">{{ rover.name }}</span>
          <span class="rover-status-badge hud-label">{{ getRoverStatusLabel(rover.status) }}</span>
        </div>
        <!-- Güç tüketimi — sadece görevdeyken -->
        <div v-if="['deploying','collecting','returning'].includes(rover.status)"
          class="rover-power-row hud-label">
          ⚡ -{{ getRoverPowerUse(rover) }} GÜÇ
        </div>

        <!-- İlerleme çubuğu -->
        <div v-if="showProgress(rover)" class="rover-progress-bar">
          <div class="rover-progress-fill" :style="{ width: roverProgress(rover) + '%' }" />
        </div>

        <!-- Sağlık -->
        <div class="rover-health-bar">
          <div class="rover-health-fill"
            :style="{ width: (rover.health / rover.maxHealth * 100) + '%' }"
            :class="rover.health / rover.maxHealth < 0.3 ? 'fill-red' : 'fill-green'" />
        </div>

        <!-- Tıklama ipucu -->
        <div class="rover-hint hud-label">
          {{ selectedRover?.id === rover.id ? '▲ KAPAT' : '▼ DETAY' }}
        </div>
      </div>

      <div v-if="activeRoverList.length === 0" class="no-rover hud-label">
        Rover üretin
      </div>
    </div>

    <!-- Rover üretim butonu -->
    <div class="hud-divider" />
    <button class="hud-btn build-btn" @click="$emit('openBuildRover')">+ ROVER ÜRETİM</button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useBaseStore }  from '@/stores/baseStore.js'
import { useRoverStore } from '@/stores/roverStore.js'
import { ROVER_DEF }     from '@/data/balance.js'
import { getRoverStatusLabel } from '@/data/ui-labels.js'

const emit = defineEmits(['openBuildRover', 'selectRover'])

const ROVER_TYPES = { ROVER: ROVER_DEF }

const baseStore  = useBaseStore()
const roverStore = useRoverStore()

const selectedRover = defineModel('selectedRover', { default: null })

const activeRoverList = computed(() =>
  roverStore.rovers.filter(r => r.status !== 'destroyed' || true)
)

function getRoverIcon(type) { return ROVER_TYPES[type]?.icon ?? '🤖' }

function getRoverPowerUse(rover) {
  const levels = ROVER_DEF.levels
  const stats = levels[Math.min(rover.level ?? 1, levels.length) - 1]
  return stats?.powerUse ?? 4
}

function toggleRoverInfo(rover) {
  selectedRover.value = selectedRover.value?.id === rover.id ? null : rover
}

function showProgress(rover) {
  return ['deploying', 'collecting', 'returning', 'building'].includes(rover.status)
}

function roverProgress(rover) {
  if (rover.status === 'building')    return rover.buildProgress ?? 0
  if (!rover.mission)                 return 0
  if (rover.status === 'deploying')   return rover.mission.travelProgress ?? 0
  if (rover.status === 'collecting')  return rover.mission.collectProgress ?? 0
  if (rover.status === 'returning')   return rover.mission.travelProgress ?? 0
  return 0
}
</script>

<style scoped>
.hud-rovers {
  position: absolute;
  top: 12px; right: 12px;
  width: 200px;
  padding: 12px;
  pointer-events: all;
}

.panel-title {
  display: flex; align-items: center; gap: 6px; margin-bottom: 6px;
}

.rover-list { display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; }

.rover-card {
  padding: 10px 10px 8px;
  border: 1px solid var(--border);
  border-left: 2px solid var(--border);
  background: var(--bg-glass);
  transition: background 0.15s;
}
.rover-card:hover { background: rgba(0,229,255,0.07); }

.rover-card--idle       { border-left-color: var(--cyan-dim); }
.rover-card--deploying,
.rover-card--collecting,
.rover-card--returning  { border-left-color: var(--green); }
.rover-card--damaged    { border-color: var(--orange-glow);          border-left-color: var(--orange); }
.rover-card--destroyed  { border-color: var(--red-glow); opacity:0.6; border-left-color: var(--red); }
.rover-card--building   { border-left-color: rgba(0,229,255,0.3); }
.rover-card--selected   {
  border-color: var(--cyan) !important;
  border-left-color: var(--cyan) !important;
  background: rgba(0,229,255,0.08) !important;
}

.rover-top { display: flex; align-items: center; gap: 7px; margin-bottom: 6px; }
.rover-type-icon { font-size: 14px; line-height: 1; }
.rover-name { flex: 1; font-size: 9px; }
.rover-status-badge {
  font-size: 7px;
  color: var(--cyan-dim);
  padding: 1px 5px;
  border: 1px solid rgba(0,229,255,0.15);
  background: rgba(0,229,255,0.05);
}
.rover-power-row { font-size: 8px; color: var(--red); margin: 0 0 5px; }

.rover-progress-bar, .rover-health-bar {
  height: 4px;
  background: rgba(0,0,0,0.55);
  margin-bottom: 5px;
  overflow: hidden;
}
.rover-progress-fill { height: 100%; background: var(--cyan); box-shadow: none; transition: width 0.3s; }
.rover-health-fill   { height: 100%; box-shadow: none; transition: width 0.3s; }
.fill-green { background: var(--green); }
.fill-red   { background: var(--red); }

.rover-hint {
  font-size: 7px;
  color: var(--text-dim);
  margin-top: 4px;
  text-align: right;
  letter-spacing: 1px;
}

.no-rover { color: var(--text-dim); font-size: 9px; text-align: center; padding: 12px 0; }

.build-btn {
  width: 100%; padding: 8px; font-size: 9px; margin-top: 4px;
}
</style>
