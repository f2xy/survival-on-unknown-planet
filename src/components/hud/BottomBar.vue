<template>
  <div class="hud-bottom-bar">
    <!-- Gün -->
    <div class="hud-label">GÜN {{ worldStore.dayNumber }}</div>

    <!-- Faz -->
    <div class="phase-badge hud-label" :class="'phase--' + (worldStore.currentPhase.key ?? 'day').toLowerCase()">
      {{ worldStore.currentPhase.name }}
    </div>

    <!-- Sıcaklık -->
    <div class="temp-display hud-label" :class="tempClass">
      {{ tempSign }}{{ Math.abs(Math.round(worldStore.temperature)) }}°C
    </div>

    <!-- Yerçekimi -->
    <div v-if="gravityEarth !== null" class="stat-chip hud-label" :class="gravClass" title="Yerçekimi">
      ↓ {{ gravityEarth }}g
    </div>

    <!-- Radyasyon -->
    <div v-if="radLabel" class="stat-chip hud-label" :class="radClass" title="Radyasyon seviyesi">
      ☢ {{ radLabel }}
    </div>

    <!-- Gezegen adı -->
    <div v-if="worldStore.planetName !== '???'" class="planet-chip hud-label" :style="{ color: starColor }">
      {{ worldStore.planetName }}
    </div>

    <!-- Gün uzunluğu -->
    <div v-if="dayLenStr" class="hud-label" style="color:var(--text-dim); font-size:7px">
      ⏱ {{ dayLenStr }}/gün
    </div>

    <!-- Kısayollar -->
    <div class="hud-label" style="color:var(--text-dim)">
      WASD: Kamera &nbsp;|&nbsp; B: İnşa &nbsp;|&nbsp; HOME: Üsse Dön &nbsp;|&nbsp; F5: Kaydet &nbsp;|&nbsp; ESC: Duraklat
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWorldStore } from '@/stores/worldStore.js'

const worldStore = useWorldStore()

// Sıcaklık
const tempClass = computed(() => {
  const t = worldStore.temperature
  if (t >= 35)  return 'temp--hot'
  if (t >= 15)  return 'temp--warm'
  if (t >= 0)   return 'temp--cool'
  return 'temp--cold'
})
const tempSign = computed(() => worldStore.temperature < 0 ? '-' : '+')

// Yerçekimi
const gravityEarth = computed(() => worldStore.planetPhysical?.gravityEarth ?? null)
const gravClass = computed(() => {
  const g = gravityEarth.value
  if (g === null) return ''
  if (g > 1.5)   return 'stat--danger'
  if (g > 1.1)   return 'stat--warn'
  if (g < 0.6)   return 'stat--low'
  return 'stat--ok'
})

// Radyasyon
const radLabel = computed(() => worldStore.planetRad?.label ?? null)
const radClass = computed(() => {
  const l = radLabel.value
  if (l === 'ÖLÜMCÜL')   return 'stat--critical'
  if (l === 'TEHLİKELİ') return 'stat--danger'
  if (l === 'YÜKSEK')    return 'stat--warn'
  if (l === 'ORTA')      return 'stat--ok'
  return 'stat--low'
})

// Yıldız rengi
const starColor = computed(() => worldStore.starType?.color ?? 'var(--cyan)')

// Gün uzunluğu
const dayLenStr = computed(() => {
  const secs = worldStore.planetThermal?.dayLengthSec
  if (!secs) return null
  const mins = secs / 60
  if (mins < 60) return mins.toFixed(0) + ' dk'
  return (mins / 60).toFixed(1) + ' sa'
})
</script>

<style scoped>
.hud-bottom-bar {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  pointer-events: none;
  flex-wrap: wrap;
  max-width: 90vw;
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

.stat-chip {
  font-size: 8px;
  padding: 2px 6px;
  border: 1px solid var(--border);
}
.stat--critical { color: #ff1744; border-color: rgba(255,23,68,0.5); animation: pulse 1s infinite; }
.stat--danger   { color: #ff5722; border-color: rgba(255,87,34,0.4); }
.stat--warn     { color: var(--yellow); border-color: rgba(255,214,0,0.3); }
.stat--ok       { color: var(--cyan); border-color: var(--border); }
.stat--low      { color: #4caf50; border-color: rgba(76,175,80,0.3); }

.planet-chip {
  font-size: 8px;
  padding: 2px 6px;
  border: 1px solid rgba(255,255,255,0.15);
  letter-spacing: 0.06em;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
</style>
