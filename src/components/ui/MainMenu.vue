<template>
  <div class="main-menu">
    <!-- Arka plan animasyonu -->
    <canvas ref="bgCanvas" class="menu-bg" />

    <div class="menu-content">
      <!-- Logo -->
      <div class="menu-logo">
        <div class="logo-tag hud-label">// MISSION LOG: DAY-0</div>
        <h1 class="logo-title glitch" data-text="SURVIVAL">SURVIVAL</h1>
        <h2 class="logo-sub">UNKNOWN PLANET</h2>
        <div class="logo-line" />
        <p class="logo-desc">
          Koordinatlar bilinmiyor. Gemi enkazı tespit edildi.<br>
          Yaşam belirtileri: <span class="text-green">TEK</span>
        </p>
      </div>

      <!-- Butonlar -->
      <div class="menu-buttons">
        <button class="hud-btn menu-btn" @click="onNewGame">
          <span class="btn-icon">▶</span> YENİ GÖREV
        </button>

        <button
          v-if="gameStore.hasSave"
          class="hud-btn menu-btn"
          @click="onLoadGame"
        >
          <span class="btn-icon">⟳</span> KAYDI YÜKLE
        </button>

        <div v-if="gameStore.saveInfo" class="save-info hud-label">
          SON KAYIT: {{ gameStore.saveInfo.savedAt }} — GÜN {{ gameStore.saveInfo.day }}
        </div>
      </div>

      <!-- Alt bilgi -->
      <div class="menu-footer">
        <div class="hud-label">WASD / OK TUŞLARI: HAREKET &nbsp;|&nbsp; E: ENVANTER &nbsp;|&nbsp; C: CRAFTING &nbsp;|&nbsp; ESC: DURAKLAT</div>
      </div>
    </div>

    <!-- Köşe süsleri -->
    <div class="corner corner--tl" />
    <div class="corner corner--tr" />
    <div class="corner corner--bl" />
    <div class="corner corner--br" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/gameStore.js'

const gameStore = useGameStore()
const bgCanvas  = ref(null)
let animId = null

function onNewGame() { gameStore.startNewGame() }
function onLoadGame() { gameStore.loadGame() }

// Arka plan: yıldız/parçacık animasyonu
onMounted(() => {
  const canvas = bgCanvas.value
  const ctx = canvas.getContext('2d')
  let w, h, particles

  function resize() {
    w = canvas.width  = window.innerWidth
    h = canvas.height = window.innerHeight
  }

  function initParticles() {
    particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 0.2 + 0.05,
      alpha: Math.random() * 0.6 + 0.2,
      color: Math.random() > 0.7 ? '#00e5ff' : '#ffffff',
    }))
  }

  function draw() {
    ctx.fillStyle = '#020810'
    ctx.fillRect(0, 0, w, h)

    for (const p of particles) {
      p.y += p.speed
      if (p.y > h) { p.y = 0; p.x = Math.random() * w }
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.alpha
      ctx.fill()
    }
    ctx.globalAlpha = 1

    // Scan çizgisi efekti
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, 'rgba(0,229,255,0)')
    grad.addColorStop(0.5, 'rgba(0,229,255,0.03)')
    grad.addColorStop(1, 'rgba(0,229,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    animId = requestAnimationFrame(draw)
  }

  window.addEventListener('resize', () => { resize(); initParticles() })
  resize()
  initParticles()
  draw()
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
})
</script>

<style scoped>
.main-menu {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.menu-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.menu-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
}

/* Logo */
.menu-logo { text-align: center; }

.logo-tag {
  color: var(--cyan-dim);
  margin-bottom: 8px;
  letter-spacing: 4px;
}

.logo-title {
  font-family: var(--font-hud);
  font-size: clamp(48px, 8vw, 96px);
  font-weight: 900;
  color: var(--cyan);
  text-shadow: 0 0 30px var(--cyan-glow), 0 0 60px rgba(0,229,255,0.15);
  letter-spacing: 8px;
  line-height: 1;
}

.logo-sub {
  font-family: var(--font-hud);
  font-size: clamp(14px, 2.5vw, 22px);
  font-weight: 400;
  color: var(--text-secondary);
  letter-spacing: 12px;
  margin-top: 4px;
}

.logo-line {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--cyan), transparent);
  margin: 16px auto;
  width: 300px;
}

.logo-desc {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.8;
}

.text-green { color: var(--green); font-weight: 600; }

/* Butonlar */
.menu-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.menu-btn {
  width: 220px;
  padding: 12px 24px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn-icon { font-style: normal; }

.save-info {
  margin-top: 4px;
  font-size: 9px;
  color: var(--text-dim);
}

/* Footer */
.menu-footer {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  color: var(--text-dim);
  font-size: 9px;
}

/* Köşe süsleri */
.corner {
  position: absolute;
  width: 60px;
  height: 60px;
  border-color: var(--border);
  border-style: solid;
}
.corner--tl { top: 16px; left: 16px;   border-width: 1px 0 0 1px; }
.corner--tr { top: 16px; right: 16px;  border-width: 1px 1px 0 0; }
.corner--bl { bottom: 16px; left: 16px;  border-width: 0 0 1px 1px; }
.corner--br { bottom: 16px; right: 16px; border-width: 0 1px 1px 0; }
</style>
