<template>
  <div>
    <!-- Ana Bilgisayar tamir misyonu -->
    <template v-if="!baseStore.computerRepaired">
      <div class="hud-divider" />
      <div class="mission-panel">
        <div class="hud-label mission-title">⚠ ANA BİLGİSAYAR HASARLI</div>
        <div class="mission-costs">
          <div v-for="(qty, mat) in REPAIR_COST" :key="mat" class="mission-cost-row">
            <span class="res-icon">{{ getItemIcon(mat) }}</span>
            <span class="hud-label res-name">{{ getItemName(mat) }}</span>
            <span class="hud-label" :class="inventoryStore.has(mat, qty) ? 'cost-ok' : 'cost-nok'">
              {{ Math.floor(inventoryStore.items[mat] ?? 0) }}/{{ qty }}
            </span>
          </div>
        </div>
        <button class="hud-btn build-btn hud-btn--confirm"
          :disabled="!canRepairComputer"
          @click="baseStore.repairComputer()">⚙ TAMİR ET</button>
      </div>
    </template>

    <!-- Bilgisayar tamirli  durum rozeti + yükseltme -->
    <template v-else>
      <div class="hud-divider" />
      <div class="computer-status hud-label">
        <span class="ping-dot" />
        BİLGİSAYAR AKTİF · Sv.{{ baseStore.computerLevel }}
        <span style="color:var(--text-dim);margin-left:auto">{{ baseStore.maxRovers }} ROVER</span>
      </div>

      <!-- Bilgisayar yükseltme paneli -->
      <div v-if="computerUpgrade" class="computer-upgrade-panel">
        <div class="hud-label upgrade-section-title">↑ BİLGİSAYAR YÜKSELTMESİ · Sv.{{ (baseStore.computerLevel ?? 1) + 1 }}</div>
        <div class="mission-costs">
          <div v-for="(qty, mat) in computerUpgrade.cost" :key="mat" class="mission-cost-row">
            <span class="res-icon">{{ getItemIcon(mat) }}</span>
            <span class="hud-label res-name">{{ getItemName(mat) }}</span>
            <span class="hud-label" :class="inventoryStore.has(mat, qty) ? 'cost-ok' : 'cost-nok'">
              {{ Math.floor(inventoryStore.items[mat] ?? 0) }}/{{ qty }}
            </span>
          </div>
        </div>
        <button class="hud-btn build-btn hud-btn--confirm"
          :disabled="!canUpgradeComputer"
          @click="baseStore.upgradeComputer()">⬆ YÜKSELT</button>
      </div>
      <div v-else class="hud-label" style="font-size:8px;color:var(--text-dim);margin-top:4px">
        Maksimum seviye
      </div>
    </template>

    <!-- Strateji seçici — bilgisayar aktifken göster -->
    <template v-if="baseStore.computerRepaired">
      <div class="hud-label" style="font-size:8px;color:var(--text-dim);margin:6px 0 4px;letter-spacing:1px">
        STRATEJİ
      </div>
      <div class="strategy-bar">
        <button v-for="s in COMPUTER_STRATEGIES" :key="s.id"
          class="hud-btn strategy-btn"
          :class="{ 'strategy-btn--active': roverStore.computerStrategy === s.id }"
          :title="s.desc"
          @click="roverStore.setComputerStrategy(s.id)">
          {{ s.icon }} {{ s.label }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useBaseStore }      from '@/stores/baseStore.js'
import { useRoverStore }     from '@/stores/roverStore.js'
import { useInventoryStore } from '@/stores/inventoryStore.js'
import { BUILDING_TYPES }    from '@/data/buildings.js'
import { getItemIcon, getItemName } from '@/data/items.js'
import { COMPUTER_STRATEGIES } from '@/data/balance.js'

const baseStore      = useBaseStore()
const roverStore     = useRoverStore()
const inventoryStore = useInventoryStore()

const REPAIR_COST = BUILDING_TYPES.MAIN_COMPUTER.repairCost

const canRepairComputer = computed(() =>
  Object.entries(REPAIR_COST).every(([item, qty]) => inventoryStore.has(item, qty))
)

const computerUpgrade = computed(() => {
  if (!baseStore.computerRepaired) return null
  const level = baseStore.computerLevel ?? 1
  return BUILDING_TYPES.MAIN_COMPUTER.upgrades?.find(u => u.level === level + 1) ?? null
})

const canUpgradeComputer = computed(() => {
  if (!computerUpgrade.value) return false
  return Object.entries(computerUpgrade.value.cost).every(([item, qty]) => inventoryStore.has(item, qty))
})
</script>

<style scoped>
.res-icon { font-size: 12px; width: 16px; }
.res-name { flex: 1; font-size: 8px; }
.cost-ok  { color: var(--green); }
.cost-nok { color: var(--red); }

.build-btn {
  width: 100%; padding: 8px; font-size: 9px; margin-top: 4px;
}

.mission-panel { padding: 8px 0 4px; }
.mission-title {
  font-size: 9px; color: var(--orange); letter-spacing: 1px; margin-bottom: 6px;
}
.mission-costs { display: flex; flex-direction: column; gap: 3px; margin-bottom: 8px; }
.mission-cost-row { display: flex; align-items: center; gap: 6px; }
.mission-cost-row .res-name { flex: 1; font-size: 8px; }

.computer-status {
  font-size: 8px; color: var(--cyan); letter-spacing: 1px;
  display: flex; align-items: center; gap: 6px; padding: 4px 0;
}

.computer-upgrade-panel {
  margin-top: 6px;
  padding: 8px;
  border: 1px solid rgba(0,229,255,0.25);
  background: rgba(0,51,85,0.3);
}
.upgrade-section-title {
  font-size: 8px; color: var(--cyan); letter-spacing: 1px; margin-bottom: 6px;
}

.strategy-bar { display: flex; gap: 4px; margin-bottom: 4px; }
.strategy-btn {
  flex: 1; padding: 4px 2px; font-size: 7.5px; letter-spacing: 0.5px;
  opacity: 0.55;
}
.strategy-btn--active {
  opacity: 1;
  color: var(--cyan);
  border-color: var(--cyan);
  box-shadow: 0 0 6px var(--cyan-glow);
}
</style>
