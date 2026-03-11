<template>
  <div class="planet-panel hud-panel">
    <!-- Başlık -->
    <div class="hud-label panel-title">
      <span class="ping-dot" :style="{ background: starColor }" />
      GEZEGEN BİLGİSİ
    </div>
    <div class="hud-divider" />

    <!-- Gezegen adı -->
    <div class="planet-name hud-label">{{ worldStore.planetName }}</div>

    <!-- Yıldız -->
    <section v-if="star">
      <div class="section-title hud-label">YILDIZ</div>
      <InfoRow label="Tip"        :value="star.name + ' (' + star.spectral + ')'" :color="star.color" />
      <InfoRow label="Parlaklık"  :value="star.luminosity + ' L☉'" />
      <InfoRow label="Yüz. Sıc." :value="star.surfaceTemp + ' K'" />
    </section>

    <div class="hud-divider" />

    <!-- Yörünge -->
    <section v-if="orbit">
      <div class="section-title hud-label">YÖRÜNGE</div>
      <InfoRow label="Mesafe"  :value="orbit.distanceAU + ' AU'" />
      <InfoRow label="Yıl"     :value="orbit.orbitalYears + ' Dünya yılı'" />
    </section>

    <div class="hud-divider" />

    <!-- Fiziksel -->
    <section v-if="physical">
      <div class="section-title hud-label">FİZİKSEL</div>
      <InfoRow label="Çap"       :value="fmtKm(physical.diameterKm) + ' (' + physical.diameterEarth + '× Dünya)'" />
      <InfoRow label="Yoğunluk"  :value="physical.densityGcm3 + ' g/cm³'" />
      <InfoRow label="Yerçekimi" :value="physical.gravity + ' m/s²'" :color="gravColor" />
      <InfoRow label="Eksen Eğ." :value="physical.axialTiltDeg + '°'" />
    </section>

    <div class="hud-divider" />

    <!-- Gün Uzunluğu -->
    <section v-if="thermal">
      <div class="section-title hud-label">ZAMAN</div>
      <InfoRow label="Gün Süresi" :value="fmtDayLen(thermal.dayLengthSec)" />
    </section>

    <div class="hud-divider" />

    <!-- Atmosfer -->
    <section v-if="atmos">
      <div class="section-title hud-label">ATMOSFER</div>
      <InfoRow label="Tip"       :value="atmos.name" :color="atmos.color ?? 'var(--text-dim)'" />
      <InfoRow label="Kalınlık"  :value="atmos.thickness + '×'" />
      <InfoRow label="Oksijen"   :value="(atmos.oxygenRatio * 100).toFixed(1) + '%'" :color="oxyColor" />
      <InfoRow label="Basınç"    :value="atmos.pressureAtm + ' atm'" />
      <div v-if="atmos.toxicDamage" class="toxic-warning hud-label">⚠ TOKSİK ATMOSFER</div>
    </section>

    <div class="hud-divider" />

    <!-- Radyasyon -->
    <section v-if="rad">
      <div class="section-title hud-label">RADYASYON</div>
      <InfoRow label="Seviye" :value="rad.label" :color="radColor" />
      <InfoRow label="Doz"    :value="rad.svPerDay.toFixed(3) + ' Sv/gün'" />
    </section>

    <div class="hud-divider" />

    <!-- Sıcaklık -->
    <section v-if="thermal">
      <div class="section-title hud-label">SICAKLIK</div>
      <InfoRow label="Taban"   :value="thermal.baseTemp + '°C'" />
      <InfoRow label="Gündüz"  :value="'+' + thermal.tempDayMax + '°C'" color-class="temp--hot" />
      <InfoRow label="Gece"    :value="thermal.tempNightMin + '°C'" color-class="temp--cold" />
      <InfoRow label="Salınım" :value="'±' + (thermal.tempSwing / 2).toFixed(0) + '°C'" />
    </section>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWorldStore } from '@/stores/worldStore.js'

const worldStore = useWorldStore()

const star     = computed(() => worldStore.starType)
const physical = computed(() => worldStore.planetPhysical)
const atmos    = computed(() => worldStore.planetAtmos)
const orbit    = computed(() => worldStore.planetOrbit)
const thermal  = computed(() => worldStore.planetThermal)
const rad      = computed(() => worldStore.planetRad)

const starColor = computed(() => star.value?.color ?? 'var(--cyan)')

const gravColor = computed(() => {
  const g = physical.value?.gravityEarth ?? 1
  if (g > 1.5) return '#ff5722'
  if (g > 1.1) return 'var(--yellow)'
  if (g < 0.6) return '#90caf9'
  return 'var(--cyan)'
})

const oxyColor = computed(() => {
  const o = atmos.value?.oxygenRatio ?? 0
  if (o >= 0.18) return '#4caf50'
  if (o >= 0.08) return 'var(--yellow)'
  return '#ff5722'
})

const radColor = computed(() => {
  const label = rad.value?.label
  if (label === 'ÖLÜMCÜL')   return '#ff1744'
  if (label === 'TEHLİKELİ') return '#ff5722'
  if (label === 'YÜKSEK')    return 'var(--yellow)'
  if (label === 'ORTA')      return 'var(--cyan)'
  return '#4caf50'
})

function fmtKm(km) {
  return km >= 10000
    ? (km / 1000).toFixed(1) + ' bin km'
    : km.toLocaleString('tr') + ' km'
}

function fmtDayLen(secs) {
  const mins = secs / 60
  if (mins < 60) return mins.toFixed(0) + ' dk'
  return (mins / 60).toFixed(1) + ' sa'
}
</script>

<!-- InfoRow iç bileşen — inline olarak tanımla -->
<script>
import { defineComponent, h } from 'vue'
const InfoRow = defineComponent({
  props: { label: String, value: String, color: String, colorClass: String },
  setup(props) {
    return () => h('div', { class: 'info-row' }, [
      h('span', { class: 'row-label hud-label' }, props.label),
      h('span', {
        class: ['row-value hud-label', props.colorClass].filter(Boolean).join(' '),
        style: props.color ? { color: props.color } : {},
      }, props.value),
    ])
  },
})
export default { components: { InfoRow } }
</script>

<style scoped>
.planet-panel {
  position: absolute;
  top: 12px;
  right: 230px;   /* rover panelinin soluna yerleş */
  width: 200px;
  padding: 10px;
  pointer-events: all;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  scrollbar-width: none;
}
.planet-panel::-webkit-scrollbar { display: none; }

.panel-title {
  display: flex; align-items: center; gap: 6px; margin-bottom: 6px;
}

.planet-name {
  font-size: 11px;
  color: var(--cyan);
  letter-spacing: 0.08em;
  margin-bottom: 6px;
  text-align: center;
}

.section-title {
  font-size: 7px;
  color: var(--text-dim);
  letter-spacing: 0.15em;
  margin: 4px 0 2px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 2px;
}

.row-label {
  font-size: 7px;
  color: var(--text-dim);
  flex-shrink: 0;
}

.row-value {
  font-size: 8px;
  color: var(--text);
  text-align: right;
  word-break: break-all;
}

.toxic-warning {
  font-size: 8px;
  color: #aacc00;
  border: 1px solid rgba(170, 204, 0, 0.4);
  padding: 2px 6px;
  margin-top: 3px;
  text-align: center;
}

.temp--hot  { color: #ff5722; }
.temp--cold { color: #90caf9; }
</style>
