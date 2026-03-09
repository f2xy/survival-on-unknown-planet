<template>
  <!-- Duraklat -->
  <transition name="fade">
    <div v-if="gameStore.isPaused" class="dialog-overlay" @click.self="gameStore.resume">
      <div class="dialog-box">
        <div class="dialog-header">
          <span class="ping-dot ping-dot--orange" />
          <span class="dialog-title">// SİSTEM DURAKLADI</span>
        </div>
        <div class="dialog-body">
          <div class="pause-menu">
            <button class="hud-btn hud-btn--confirm pause-btn" @click="gameStore.resume">▶ DEVAM ET</button>
            <button class="hud-btn pause-btn" @click="gameStore.saveGame">◈ KAYDET</button>
            <button class="hud-btn hud-btn--danger pause-btn" @click="gameStore.returnToMenu">✕ ANA MENÜ</button>
          </div>
        </div>
        <div class="dialog-footer">
          <div class="hud-label" style="color:var(--text-dim)">ESC ile devam</div>
        </div>
      </div>
    </div>
  </transition>

  <!-- İnşa menüsü -->
  <transition name="fade">
    <div v-if="gameStore.isBuild" class="dialog-overlay" @click.self="gameStore.resume">
      <div class="dialog-box build-box">
        <div class="dialog-header">
          <span class="ping-dot" />
          <span class="dialog-title">// İNŞA TERMİNALİ</span>
          <button class="close-btn" @click="gameStore.resume">✕</button>
        </div>
        <div class="dialog-body build-body">
          <div v-for="(def, type) in buildableTypes" :key="type" class="build-card"
            :class="{ 'build-card--available': canAfford(type) }"
            @click="canAfford(type) && doPlace(type)">
            <div class="build-icon">{{ def.icon }}</div>
            <div class="build-info">
              <div class="hud-label build-name">{{ def.name }}</div>
              <div class="build-desc">{{ def.desc }}</div>
              <div class="build-cost">
                <span v-for="(qty, mat) in def.buildCost" :key="mat"
                  :class="inventoryStore.has(mat, qty) ? 'cost-ok' : 'cost-nok'">
                  {{ getIcon(mat) }} {{ qty }}
                </span>
              </div>
            </div>
            <div class="build-stats hud-label">
              <div v-if="def.powerGen">⚡+{{ def.powerGen }}</div>
              <div v-if="def.powerUse">⚡-{{ def.powerUse }}</div>
              <div v-if="def.storageCapacity">📦+{{ def.storageCapacity }}</div>
              <div v-if="def.roverSlots">🤖+{{ def.roverSlots }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore }      from '@/stores/gameStore.js'
import { useBaseStore }      from '@/stores/baseStore.js'
import { useInventoryStore } from '@/stores/inventoryStore.js'
import { BUILDING_TYPES }    from '@/game/systems/BaseSystem.js'
import { ITEMS }             from '@/stores/inventoryStore.js'

const gameStore      = useGameStore()
const baseStore      = useBaseStore()
const inventoryStore = useInventoryStore()

// İnşa edilebilir bina tipleri (core ve dekorasyon hariç)
const buildableTypes = computed(() =>
  Object.fromEntries(
    Object.entries(BUILDING_TYPES).filter(([, def]) => !def.isCore && !def.isDecoration)
  )
)

function getIcon(id) { return ITEMS[id]?.icon ?? '?' }

function canAfford(type) {
  const def = BUILDING_TYPES[type]
  if (!def?.buildCost) return false
  return Object.entries(def.buildCost).every(([item, qty]) => inventoryStore.has(item, qty))
}

function doPlace(type) {
  const def = BUILDING_TYPES[type]
  if (!def?.buildCost) return

  // Malzemeleri düş
  for (const [item, qty] of Object.entries(def.buildCost)) {
    inventoryStore.remove(item, qty)
  }

  // Core binaya yakın bir konuma yerleştir
  const core = baseStore.buildings.find(b => b.type === 'RESCUE_CAPSULE')
  const offset = baseStore.buildings.length * 4
  const tx = (core?.tx ?? 32) + offset - 8
  const ty = (core?.ty ?? 32) + 6

  baseStore.placeBuilding(type, tx, ty)
  gameStore.notify(`${def.name} inşası başladı!`, 'success')
  gameStore.resume()
}
</script>

<style scoped>
.pause-menu {
  display: flex; flex-direction: column; gap: 10px; align-items: center;
}
.pause-btn { width: 200px; }

.close-btn {
  margin-left: auto; background: none; border: none;
  color: var(--text-dim); font-size: 14px; cursor: pointer; padding: 0 4px;
}
.close-btn:hover { color: var(--red); }

/* İnşa menüsü */
.build-box { max-width: 580px; }

.build-body {
  display: flex; flex-direction: column; gap: 8px;
  max-height: 65vh; overflow-y: auto; padding: 16px;
}

.build-card {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px; border: 1px solid var(--border); background: var(--bg-glass);
  opacity: 0.5;
}
.build-card--available { opacity: 1; cursor: pointer; }
.build-card--available:hover { border-color: var(--cyan); background: var(--cyan-faint); }

.build-icon { font-size: 26px; flex-shrink: 0; }

.build-info { flex: 1; }
.build-name { font-size: 10px; margin-bottom: 3px; }
.build-desc { font-size: 11px; color: var(--text-secondary); margin-bottom: 5px; line-height: 1.5; }

.build-cost { display: flex; gap: 8px; flex-wrap: wrap; }
.build-cost span { font-family: var(--font-hud); font-size: 10px; }
.cost-ok  { color: var(--green); }
.cost-nok { color: var(--red); }

.build-stats {
  font-size: 9px; color: var(--cyan-dim);
  display: flex; flex-direction: column; gap: 2px; min-width: 60px;
  text-align: right;
}
</style>
