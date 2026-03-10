<template>
  <transition name="fade">
    <div v-if="visible" class="dialog-overlay" @click.self="$emit('close')">
      <div class="dialog-box">
        <div class="dialog-header">
          <span class="ping-dot" />
          <span class="dialog-title">// ROVER ÜRETİM TERMİNALİ</span>
          <button class="close-btn" @click="$emit('close')">✕</button>
        </div>
        <div class="dialog-body">
          <!-- Bilgisayar tamir edilmemişse uyarı -->
          <div v-if="!baseStore.computerRepaired" class="computer-warning hud-label">
            ⚠ Ana Bilgisayar tamir edilmeden rover üretilemez.
          </div>

          <!-- Mevcut rover kapasitesi doluysa uyarı -->
          <div v-else-if="roverStore.rovers.filter(r=>r.status!=='destroyed').length >= baseStore.maxRovers"
            class="computer-warning hud-label">
            ⚠ Kapasite dolu — bilgisayarı yükselt (max {{ baseStore.maxRovers }}).
          </div>

          <!-- Yeni rover inşa -->
          <div class="rover-build-card" :class="{ 'rover-build-card--available': canAffordBuild }"
            @click="canAffordBuild && doBuildRover()">
            <div class="rover-build-icon">🤖</div>
            <div class="rover-build-info">
              <div class="hud-label" style="font-size:11px">YENİ ROVER İNŞA ET</div>
              <div style="font-size:9px;color:var(--text-dim);margin:4px 0">
                Seviye 1 · İnşa: {{ ROVER_DEF.buildTime }}s
              </div>
              <div class="rover-specs hud-label">
                <span>Hız: {{ ROVER_DEF.levels[0].speed }}</span>
                <span>Kap: {{ ROVER_DEF.levels[0].capacity }}</span>
              </div>
              <div class="rover-cost">
                <span v-for="(qty, mat) in ROVER_DEF.buildCost" :key="mat"
                  :class="inventoryStore.has(mat, qty) ? 'cost-ok' : 'cost-nok'">
                  {{ getItemIcon(mat) }} {{ qty }}
                </span>
              </div>
            </div>
            <span v-if="canAffordBuild" class="rover-build-badge hud-label">ÜRETİLEBİLİR</span>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'
import { useBaseStore }      from '@/stores/baseStore.js'
import { useRoverStore }     from '@/stores/roverStore.js'
import { useInventoryStore } from '@/stores/inventoryStore.js'
import { ROVER_DEF }         from '@/data/balance.js'
import { getItemIcon }       from '@/data/items.js'

const props = defineProps({
  visible: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])

const baseStore      = useBaseStore()
const roverStore     = useRoverStore()
const inventoryStore = useInventoryStore()

const canAffordBuild = computed(() =>
  baseStore.computerRepaired &&
  Object.entries(ROVER_DEF.buildCost).every(([item, qty]) => inventoryStore.has(item, qty)) &&
  roverStore.rovers.filter(r => r.status !== 'destroyed').length < baseStore.maxRovers
)

function doBuildRover() {
  const ok = roverStore.buildRover()
  if (ok) emit('close')
}
</script>

<style scoped>
.close-btn {
  margin-left: auto; background: none; border: none;
  color: var(--text-dim); font-size: 14px; cursor: pointer; padding: 0 4px;
}
.close-btn:hover { color: var(--red); }

.computer-warning {
  font-size: 9px; color: var(--orange);
  border: 1px solid var(--orange-glow);
  padding: 8px 10px; margin-bottom: 12px; letter-spacing: 1px;
}

.rover-build-card {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px; border: 1px solid var(--border); background: var(--bg-glass);
  opacity: 0.5; position: relative;
}
.rover-build-card--available { opacity: 1; cursor: pointer; }
.rover-build-card--available:hover { border-color: var(--cyan); background: var(--cyan-faint); }

.rover-build-icon { font-size: 28px; }
.rover-build-info { flex: 1; }

.rover-specs { display: flex; gap: 10px; font-size: 8px; color: var(--text-dim); margin: 3px 0; }

.rover-cost { display: flex; gap: 8px; margin-top: 4px; }
.rover-cost span { font-family: var(--font-hud); font-size: 10px; }
.cost-ok  { color: var(--green); }
.cost-nok { color: var(--red); }

.rover-build-badge {
  position: absolute; top: 6px; right: 8px;
  font-size: 8px; color: var(--cyan); letter-spacing: 1px;
}
</style>
