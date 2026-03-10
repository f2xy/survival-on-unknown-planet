<template>
  <div>
    <!-- Güç -->
    <div class="base-stat-row">
      <span class="hud-label">GÜÇ</span>
      <div class="base-stat-bar">
        <div class="base-stat-bar__fill" :class="netPower >= 0 ? 'fill-green' : 'fill-red'"
          :style="{ width: Math.min(100, baseStore.totalPowerGen > 0 ? Math.abs(netPower) / baseStore.totalPowerGen * 100 : 0) + '%' }" />
      </div>
      <span class="hud-label" :class="netPower >= 0 ? 'text-green' : 'text-red'">
        {{ netPower >= 0 ? '+' : '' }}{{ Math.round(netPower) }}
      </span>
    </div>
    <!-- Güç Breakdown -->
    <div class="power-breakdown">
      <span class="hud-label text-green">⬆ {{ Math.round(baseStore.totalPowerGen) }}</span>
      <span class="hud-label" style="color:var(--text-dim)">|</span>
      <span class="hud-label text-red">⬇ {{ Math.round(baseStore.totalPowerUse + roverStore.totalPowerDraw) }}</span>
      <span v-if="roverStore.totalPowerDraw > 0" class="hud-label" style="color:var(--text-dim);font-size:8px">
        (🤖 {{ roverStore.totalPowerDraw }})
      </span>
    </div>
    <!-- Güç Kaynakları -->
    <div v-if="baseStore.powerSources.length" class="power-sources">
      <div v-for="src in baseStore.powerSources" :key="src.id" class="power-source-row">
        <span>{{ getBuildingIcon(src.type) }}</span>
        <span class="hud-label" style="flex:1">{{ getBuildingName(src.type) }}</span>
        <span class="hud-label text-green">+{{ src.gen }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useBaseStore }  from '@/stores/baseStore.js'
import { useRoverStore } from '@/stores/roverStore.js'
import { getBuildingIcon, getBuildingName } from '@/data/buildings.js'

const baseStore  = useBaseStore()
const roverStore = useRoverStore()

const netPower = computed(() => baseStore.powerBalance - roverStore.totalPowerDraw)
</script>

<style scoped>
.base-stat-row {
  display: flex; align-items: center; gap: 6px; margin-bottom: 6px;
}
.base-stat-row .hud-label { width: 32px; font-size: 8px; }

.base-stat-bar {
  flex: 1; height: 4px;
  background: rgba(0,0,0,0.55);
  overflow: hidden;
}
.base-stat-bar__fill { height: 100%; transition: width 0.4s; box-shadow: none; }
.fill-green { background: var(--green); }
.fill-red   { background: var(--red);   }
.text-green { color: var(--green); }
.text-red   { color: var(--red); }

.power-breakdown {
  display: flex; align-items: center; gap: 6px;
  margin: -2px 0 6px; font-size: 8px;
}
.power-sources {
  margin-bottom: 6px; border-left: 1px solid var(--cyan-dim); padding-left: 6px;
}
.power-source-row {
  display: flex; align-items: center; gap: 4px;
  font-size: 8px; margin-bottom: 3px;
}
</style>
