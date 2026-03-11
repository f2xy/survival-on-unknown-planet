<template>
  <div class="game-hud">

    <!-- ── Sol panel: Üs durumu ── -->
    <div class="hud-panel hud-base">
      <div class="hud-label panel-title">
        <span class="ping-dot" />
        ÜS KONTROL
      </div>
      <div class="hud-divider" />

      <PowerPanel />
      <StoragePanel />
      <ComputerPanel />

      <div class="hud-divider" />
      <button class="hud-btn build-btn" @click="gameStore.openBuild">
        + BİNA İNŞA ET
      </button>
    </div>

    <!-- ── Sağ panel: Rover filosu ── -->
    <RoverFleetPanel
      v-model:selectedRover="selectedRover"
      @openBuildRover="showBuildRover = true"
    />

    <!-- ── Gezegen Bilgi Paneli ── -->
    <PlanetInfoPanel />

    <!-- ── Alt bilgi çubuğu ── -->
    <BottomBar />

    <!-- ── Bildirimler ── -->
    <NotificationList />

    <!-- ── Rover üretim overlay ── -->
    <RoverBuildDialog
      :visible="showBuildRover"
      @close="showBuildRover = false"
    />

    <!-- ── Rover Bilgi Paneli ── -->
    <RoverInfoPanel
      :rover="selectedRover"
      @close="selectedRover = null"
    />

    <!-- ── Bina Bilgi Paneli ── -->
    <BuildingInfoPanel
      :building="baseStore.selectedBuilding"
      @close="baseStore.selectedBuilding = null"
    />

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useGameStore } from '@/stores/gameStore.js'
import { useBaseStore } from '@/stores/baseStore.js'

import PowerPanel       from '@/components/hud/PowerPanel.vue'
import StoragePanel     from '@/components/hud/StoragePanel.vue'
import ComputerPanel    from '@/components/hud/ComputerPanel.vue'
import RoverFleetPanel  from '@/components/hud/RoverFleetPanel.vue'
import RoverInfoPanel   from '@/components/hud/RoverInfoPanel.vue'
import BuildingInfoPanel from '@/components/hud/BuildingInfoPanel.vue'
import BottomBar        from '@/components/hud/BottomBar.vue'
import NotificationList from '@/components/hud/NotificationList.vue'
import RoverBuildDialog from '@/components/hud/RoverBuildDialog.vue'
import PlanetInfoPanel from '@/components/hud/PlanetInfoPanel.vue'

const gameStore = useGameStore()
const baseStore = useBaseStore()

const showBuildRover = ref(false)
const selectedRover  = ref(null)
</script>

<style scoped>
.game-hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 100;
}

.hud-base {
  position: absolute;
  top: 12px; left: 12px;
  width: 210px;
  padding: 12px;
  pointer-events: all;
}

.panel-title {
  display: flex; align-items: center; gap: 6px; margin-bottom: 6px;
}

.build-btn {
  width: 100%; padding: 8px; font-size: 9px; margin-top: 4px;
}
</style>
