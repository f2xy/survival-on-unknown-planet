<template>
  <div class="app">
    <!-- CRT efektleri -->
    <div class="scanlines" />
    <div class="vignette" />

    <!-- Ana Menü -->
    <transition name="fade">
      <MainMenu v-if="gameStore.isInMenu" />
    </transition>

    <!-- Oyun ekranı -->
    <transition name="fade">
      <div v-if="!gameStore.isInMenu" class="game-screen">
        <GameCanvas />
        <GameHUD />
        <GameDialog />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { useGameStore } from '@/stores/gameStore.js'
import MainMenu   from '@/components/ui/MainMenu.vue'
import GameCanvas from '@/components/game/GameCanvas.vue'
import GameHUD    from '@/components/game/GameHUD.vue'
import GameDialog from '@/components/game/GameDialog.vue'

const gameStore = useGameStore()
</script>

<style scoped>
.app {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: var(--bg-void);
}

.game-screen {
  position: absolute;
  inset: 0;
}
</style>
