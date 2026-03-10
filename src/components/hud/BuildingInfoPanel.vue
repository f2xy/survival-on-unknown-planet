<template>
  <transition name="slide-up">
    <div v-if="building" class="hud-panel building-info-panel">
      <div class="hud-label panel-title" style="display:flex;align-items:center;gap:6px">
        <span>{{ getBuildingIcon(building.type) }}</span>
        <span style="flex:1">{{ getBuildingName(building.type) }}</span>
        <span style="color:var(--cyan);font-size:9px">Sv.{{ building.level ?? 1 }}</span>
        <button class="hud-btn" style="padding:2px 8px;font-size:8px"
          @click="$emit('close')">✕</button>
      </div>
      <div class="hud-divider" />

      <!-- Açıklama -->
      <div class="hud-label" style="color:var(--text-dim);margin-bottom:6px;font-size:8px">
        {{ getBuildingDesc(building.type) }}
      </div>

      <!-- İstatistikler -->
      <div class="building-stats">
        <div v-if="powerGen > 0" class="building-stat-row">
          <span class="hud-label" style="color:var(--text-dim)">GÜÇ ÜRETİM</span>
          <span class="hud-label text-green">+{{ powerGen }}</span>
        </div>
        <div v-if="powerUse > 0" class="building-stat-row">
          <span class="hud-label" style="color:var(--text-dim)">GÜÇ TÜKETİM</span>
          <span class="hud-label text-red">-{{ powerUse }}</span>
        </div>
        <div v-if="storageCap > 0" class="building-stat-row">
          <span class="hud-label" style="color:var(--text-dim)">DEPO KAPASITESI</span>
          <span class="hud-label" style="color:var(--cyan)">+{{ storageCap }}</span>
        </div>
        <div class="building-stat-row">
          <span class="hud-label" style="color:var(--text-dim)">BAĞLANTI</span>
          <span class="hud-label" :class="isConnected ? 'text-green' : 'text-red'">
            {{ isConnected ? 'BAĞLI' : 'BAĞLANTISIZ' }}
          </span>
        </div>
        <div class="building-stat-row">
          <span class="hud-label" style="color:var(--text-dim)">SAĞLIK</span>
          <span class="hud-label">{{ building.health ?? 100 }}/{{ building.maxHealth ?? 100 }}</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'
import { useBaseStore } from '@/stores/baseStore.js'
import { getBuildingIcon, getBuildingName, getBuildingDesc, getBuildingStorageCap } from '@/data/buildings.js'
import { getBuildingPowerGen, getBuildingPowerUse } from '@/game/systems/BaseSystem.js'

const props = defineProps({
  building: { type: Object, default: null },
})
defineEmits(['close'])

const baseStore = useBaseStore()

const powerGen   = computed(() => props.building ? getBuildingPowerGen(props.building) : 0)
const powerUse   = computed(() => props.building ? getBuildingPowerUse(props.building) : 0)
const storageCap = computed(() => props.building ? getBuildingStorageCap(props.building) : 0)
const isConnected = computed(() => props.building ? baseStore.connectedIds.has(props.building.id) : false)
</script>

<style scoped>
.building-info-panel {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  min-width: 240px;
  max-width: 300px;
  z-index: 100;
}

.panel-title { margin-bottom: 6px; }

.building-stats { display: flex; flex-direction: column; gap: 4px; }
.building-stat-row {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 8px;
}

.text-green { color: var(--green); }
.text-red   { color: var(--red); }
</style>
