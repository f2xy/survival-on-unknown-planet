<template>
  <transition-group name="slide-up" tag="div" class="notif-container">
    <div v-for="n in gameStore.notifications" :key="n.id"
      class="notif" :class="'notif--' + n.type">
      {{ n.msg }}
    </div>
  </transition-group>
</template>

<script setup>
import { useGameStore } from '@/stores/gameStore.js'

const gameStore = useGameStore()
</script>

<style scoped>
.notif-container {
  position: absolute; bottom: 60px; right: 12px;
  display: flex; flex-direction: column; gap: 4px;
  pointer-events: none;
}
.notif {
  font-family: var(--font-hud); font-size: 9px; letter-spacing: 1px;
  padding: 7px 12px; border: 1px solid var(--border); background: var(--bg-panel);
}
.notif--success { border-color: var(--green-glow); color: var(--green); }
.notif--error   { border-color: var(--red-glow);   color: var(--red); }
.notif--info    { border-color: var(--border);      color: var(--cyan); }
.notif--warning { border-color: var(--orange-glow); color: var(--orange); }
</style>
