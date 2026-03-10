<template>
  <div class="hud-bottom-bar">
    <div class="hud-label">GÜN {{ worldStore.dayNumber }}</div>
    <div class="phase-badge hud-label" :class="'phase--' + (worldStore.currentPhase.key ?? 'day').toLowerCase()">
      {{ worldStore.currentPhase.name }}
    </div>
    <div class="temp-display hud-label" :class="tempClass">
      {{ tempSign }}{{ Math.abs(Math.round(worldStore.temperature)) }}°C
    </div>
    <div class="hud-label" style="color:var(--text-dim)">
      WASD: Kamera &nbsp;|&nbsp; B: İnşa &nbsp;|&nbsp; HOME: Üsse Dön &nbsp;|&nbsp; F5: Kaydet &nbsp;|&nbsp; ESC: Duraklat
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWorldStore } from '@/stores/worldStore.js'

const worldStore = useWorldStore()

const tempClass = computed(() => {
  const t = worldStore.temperature
  if (t >= 35)  return 'temp--hot'
  if (t >= 15)  return 'temp--warm'
  if (t >= 0)   return 'temp--cool'
  return 'temp--cold'
})

const tempSign = computed(() => worldStore.temperature < 0 ? '-' : '+')
</script>

<style scoped>
.hud-bottom-bar {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 20px;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  pointer-events: none;
}

.phase-badge {
  font-size: 8px; padding: 2px 6px; border: 1px solid var(--border);
}
.phase--day    { color: var(--yellow);   border-color: rgba(255,214,0,0.3); }
.phase--dawn   { color: #ff8a65; }
.phase--dusk   { color: #ff7043; }
.phase--night  { color: var(--cyan-dim); }
.phase--late   { color: var(--text-dim); }

.temp-display {
  font-size: 10px; padding: 2px 8px;
  border: 1px solid var(--border);
  font-family: var(--font-hud);
  min-width: 52px; text-align: center;
}
.temp--hot  { color: #ff5722; border-color: rgba(255,87,34,0.4); }
.temp--warm { color: var(--yellow); border-color: rgba(255,214,0,0.3); }
.temp--cool { color: var(--cyan); border-color: var(--border); }
.temp--cold { color: #90caf9; border-color: rgba(144,202,249,0.3); }
</style>
