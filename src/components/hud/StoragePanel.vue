<template>
  <div>
    <!-- Depolama -->
    <div class="base-stat-row">
      <span class="hud-label">DEPO</span>
      <div class="base-stat-bar">
        <div class="base-stat-bar__fill fill-cyan"
          :style="{ width: Math.min(100, inventoryStore.totalCount / baseStore.storageCapacity * 100) + '%' }" />
      </div>
      <span class="hud-label">{{ inventoryStore.totalCount }}/{{ baseStore.storageCapacity }}</span>
    </div>

    <div class="hud-divider" />

    <!-- Kaynaklar -->
    <div class="hud-label" style="margin-bottom:6px">KAYNAKLAR</div>
    <div class="resource-list">
      <div v-for="(qty, id) in topResources" :key="id" class="resource-row">
        <span class="res-icon">{{ getItemIcon(id) }}</span>
        <span class="hud-label res-name">{{ getItemName(id) }}</span>
        <span class="res-qty">{{ Math.floor(qty) }}</span>
      </div>
      <div v-if="!Object.keys(topResources).length" class="hud-label" style="color:var(--text-dim)">
        Henüz kaynak yok
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useBaseStore }      from '@/stores/baseStore.js'
import { useInventoryStore } from '@/stores/inventoryStore.js'
import { getItemIcon, getItemName } from '@/data/items.js'

const baseStore      = useBaseStore()
const inventoryStore = useInventoryStore()

const topResources = computed(() => {
  const inv = inventoryStore.items
  return Object.fromEntries(Object.entries(inv).slice(0, 6))
})
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
.fill-cyan { background: var(--cyan); }

.resource-list { display: flex; flex-direction: column; gap: 4px; }
.resource-row  { display: flex; align-items: center; gap: 6px; }
.res-icon { font-size: 12px; width: 16px; }
.res-name { flex: 1; font-size: 8px; }
.res-qty  { font-family: var(--font-hud); font-size: 11px; color: var(--cyan); }
</style>
