<template>
  <div class="game-hud">

    <!-- ── Sol panel: Üs durumu ── -->
    <div class="hud-panel hud-base">
      <div class="hud-label panel-title">
        <span class="ping-dot" />
        ÜS KONTROL
      </div>
      <div class="hud-divider" />

      <!-- Güç -->
      <div class="base-stat-row">
        <span class="hud-label">GÜÇ</span>
        <div class="base-stat-bar">
          <div class="base-stat-bar__fill" :class="netPower >= 0 ? 'fill-green' : 'fill-red'"
            :style="{ width: Math.min(100, baseStore.totalPowerGen > 0 ? Math.abs(netPower) / baseStore.totalPowerGen * 100 : 0) + '%' }" />
        </div>
        <span class="hud-label" :class="netPower >= 0 ? 'text-green' : 'text-red'">
          {{ netPower >= 0 ? '+' : '' }}{{ Math.round(netPower) }}
        </span>
      </div>
      <!-- Güç Breakdown -->
      <div class="power-breakdown">
        <span class="hud-label text-green">⬆ {{ Math.round(baseStore.totalPowerGen) }}</span>
        <span class="hud-label" style="color:var(--text-dim)">|</span>
        <span class="hud-label text-red">⬇ {{ Math.round(baseStore.totalPowerUse + roverStore.totalPowerDraw) }}</span>
        <span v-if="roverStore.totalPowerDraw > 0" class="hud-label" style="color:var(--text-dim);font-size:8px">
          (🤖 {{ roverStore.totalPowerDraw }})
        </span>
      </div>
      <!-- Güç Kaynakları -->
      <div v-if="baseStore.powerSources.length" class="power-sources">
        <div v-for="src in baseStore.powerSources" :key="src.id" class="power-source-row">
          <span>{{ getBuildingIcon(src.type) }}</span>
          <span class="hud-label" style="flex:1">{{ getBuildingName(src.type) }}</span>
          <span class="hud-label text-green">+{{ src.gen }}</span>
        </div>
      </div>

      <!-- Depolama -->
      <div class="base-stat-row">
        <span class="hud-label">DEPO</span>
        <div class="base-stat-bar">
          <div class="base-stat-bar__fill fill-cyan"
            :style="{ width: Math.min(100, inventoryStore.totalCount / baseStore.storageCapacity * 100) + '%' }" />
        </div>
        <span class="hud-label">{{ inventoryStore.totalCount }}/{{ baseStore.storageCapacity }}</span>
      </div>

      <div class="hud-divider" />

      <!-- Kaynaklar -->
      <div class="hud-label" style="margin-bottom:6px">KAYNAKLAR</div>
      <div class="resource-list">
        <div v-for="(qty, id) in topResources" :key="id" class="resource-row">
          <span class="res-icon">{{ getItemIcon(id) }}</span>
          <span class="hud-label res-name">{{ getItemName(id) }}</span>
          <span class="res-qty">{{ Math.floor(qty) }}</span>
        </div>
        <div v-if="!Object.keys(topResources).length" class="hud-label" style="color:var(--text-dim)">
          Henüz kaynak yok
        </div>
      </div>

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

      <!-- Bilgisayar tamirli → durum rozeti + yükseltme -->
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

      <div class="hud-divider" />
      <button class="hud-btn build-btn" @click="gameStore.openBuild">
        + BİNA İNŞA ET
      </button>
    </div>

    <!-- ── Sağ panel: Rover filosu ── -->
    <div class="hud-panel hud-rovers">
      <div class="hud-label panel-title">
        <span class="ping-dot" :class="roverStore.activeRovers.length > 0 ? '' : 'ping-dot--orange'" />
        ROVER FİLOSU
      </div>
      <div class="hud-label" style="color:var(--text-dim);margin-bottom:6px">
        <template v-if="baseStore.computerRepaired">
          {{ roverStore.rovers.filter(r => r.status !== 'destroyed').length }}/{{ baseStore.maxRovers }}
          · <span style="color:var(--green);font-size:8px">OTONOM</span>
        </template>
        <template v-else>
          {{ roverStore.rovers.filter(r => r.status !== 'destroyed').length }} ROVER · MANUEL
        </template>
      </div>
      <div class="hud-divider" />

      <!-- Rover listesi -->
      <div class="rover-list">
        <div v-for="rover in activeRoverList" :key="rover.id" class="rover-card"
          :class="[`rover-card--${rover.status}`, selectedRover?.id === rover.id ? 'rover-card--selected' : '']"
          @click="toggleRoverInfo(rover)" style="cursor:pointer">
          <div class="rover-top">
            <span class="rover-type-icon">{{ getRoverIcon(rover.type) }}</span>
            <span class="hud-label rover-name">{{ rover.name }}</span>
            <span class="rover-status-badge hud-label">{{ statusLabel(rover.status) }}</span>
          </div>
          <!-- Güç tüketimi — sadece görevdeyken -->
          <div v-if="['deploying','collecting','returning'].includes(rover.status)"
            class="rover-power-row hud-label">
            ⚡ -{{ getRoverPowerUse(rover) }} GÜÇ
          </div>

          <!-- İlerleme çubuğu -->
          <div v-if="showProgress(rover)" class="rover-progress-bar">
            <div class="rover-progress-fill" :style="{ width: roverProgress(rover) + '%' }" />
          </div>

          <!-- Sağlık -->
          <div class="rover-health-bar">
            <div class="rover-health-fill"
              :style="{ width: (rover.health / rover.maxHealth * 100) + '%' }"
              :class="rover.health / rover.maxHealth < 0.3 ? 'fill-red' : 'fill-green'" />
          </div>

          <!-- Tıklama ipucu -->
          <div class="rover-hint hud-label">
            {{ selectedRover?.id === rover.id ? '▲ KAPAT' : '▼ DETAY' }}
          </div>
        </div>

        <div v-if="activeRoverList.length === 0" class="no-rover hud-label">
          Rover üretin
        </div>
      </div>

      <!-- Rover üretim butonu -->
      <div class="hud-divider" />
      <button class="hud-btn build-btn" @click="showBuildRover = true">+ ROVER ÜRETİM</button>
    </div>

    <!-- ── Alt bilgi çubuğu ── -->
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

    <!-- ── Bildirimler ── -->
    <transition-group name="slide-up" tag="div" class="notif-container">
      <div v-for="n in gameStore.notifications" :key="n.id"
        class="notif" :class="'notif--' + n.type">
        {{ n.msg }}
      </div>
    </transition-group>

    <!-- ── Rover üretim overlay ── -->
    <transition name="fade">
      <div v-if="showBuildRover" class="dialog-overlay" @click.self="showBuildRover = false">
        <div class="dialog-box">
          <div class="dialog-header">
            <span class="ping-dot" />
            <span class="dialog-title">// ROVER ÜRETİM TERMİNALİ</span>
            <button class="close-btn" @click="showBuildRover = false">✕</button>
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

    <!-- ── Rover Bilgi Paneli ── -->
    <transition name="slide-up">
      <div v-if="selectedRover" class="hud-panel rover-info-panel">
        <div class="hud-label panel-title" style="display:flex;align-items:center;gap:6px">
          <span>🤖</span>
          <span style="flex:1">{{ selectedRover.name }}</span>
          <span style="color:var(--cyan);font-size:9px">Sv.{{ selectedRover.level ?? 1 }}</span>
          <button class="hud-btn" style="padding:2px 8px;font-size:8px"
            @click="selectedRover = null">✕</button>
        </div>
        <div class="hud-divider" />

        <!-- İstatistikler -->
        <div class="building-stats">
          <div class="building-stat-row">
            <span class="hud-label" style="color:var(--text-dim)">DURUM</span>
            <span class="hud-label" style="color:var(--cyan)">{{ statusLabel(selectedRover.status) }}</span>
          </div>
          <div class="building-stat-row">
            <span class="hud-label" style="color:var(--text-dim)">SAĞLIK</span>
            <span class="hud-label" :class="selectedRover.health / selectedRover.maxHealth < 0.3 ? 'text-red' : 'text-green'">
              {{ selectedRover.health }}/{{ selectedRover.maxHealth }}
            </span>
          </div>
          <div class="building-stat-row">
            <span class="hud-label" style="color:var(--text-dim)">KAPASİTE</span>
            <span class="hud-label">{{ selectedRover.resourcesTotal ?? 0 }}/{{ selectedRover.capacity }}</span>
          </div>
          <div class="building-stat-row">
            <span class="hud-label" style="color:var(--text-dim)">TOPLAMA HIZI</span>
            <span class="hud-label">{{ getRoverStats(selectedRover.level).collectRate }}/s</span>
          </div>
          <div class="building-stat-row">
            <span class="hud-label" style="color:var(--text-dim)">HIZ</span>
            <span class="hud-label">{{ getRoverStats(selectedRover.level).speed }}</span>
          </div>
          <div class="building-stat-row">
            <span class="hud-label" style="color:var(--text-dim)">GÜÇ TÜKETİM</span>
            <span class="hud-label text-red">-{{ getRoverStats(selectedRover.level).powerUse }} (görevde)</span>
          </div>
        </div>

        <!-- Aktif görev bilgisi -->
        <template v-if="selectedRover.mission">
          <div class="hud-divider" style="margin:6px 0" />
          <div class="hud-label" style="font-size:8px;color:var(--text-dim);margin-bottom:4px">AKTİF GÖREV</div>
          <div class="building-stat-row">
            <span class="hud-label" style="color:var(--text-dim)">HEDEF</span>
            <span class="hud-label" style="color:var(--cyan)">{{ selectedRover.mission.resourceType?.replace('_', ' ') }}</span>
          </div>
          <div class="building-stat-row">
            <span class="hud-label" style="color:var(--text-dim)">MESAFE</span>
            <span class="hud-label">{{ Math.round(selectedRover.mission.distance) }} tile</span>
          </div>
        </template>

        <!-- Sonraki seviye bilgisi -->
        <template v-if="getRoverNextLevel(selectedRover)">
          <div class="hud-divider" style="margin:6px 0" />
          <div class="hud-label" style="font-size:8px;color:var(--text-dim);margin-bottom:4px">
            Sv.{{ (selectedRover.level ?? 1) + 1 }} YÜKSELTMESİ
          </div>
          <div v-for="(qty, mat) in getRoverNextLevel(selectedRover).upgradeCost" :key="mat"
            class="building-stat-row">
            <span class="hud-label" style="color:var(--text-dim)">{{ getItemIcon(mat) }} {{ getItemName(mat) }}</span>
            <span class="hud-label" :class="inventoryStore.has(mat, qty) ? 'text-green' : 'text-red'">
              {{ inventoryStore.items[mat] ?? 0 }}/{{ qty }}
            </span>
          </div>
          <button class="hud-btn hud-btn--confirm rover-action-btn"
            :disabled="!canAffordRoverUpgrade(selectedRover)"
            @click="roverStore.upgradeRover(selectedRover.id)">
            ⬆ YÜKSELT Sv.{{ (selectedRover.level ?? 1) + 1 }}
          </button>
        </template>

        <!-- Mod seçici -->
        <div class="hud-divider" style="margin:6px 0" />
        <div class="hud-label" style="font-size:8px;color:var(--text-dim);margin-bottom:4px;letter-spacing:1px">KONTROL MODU</div>
        <div class="rover-mode-bar">
          <button class="hud-btn rover-mode-btn"
            :class="{ 'rover-mode-btn--active': selectedRover.mode !== 'manual' }"
            @click="roverStore.setRoverMode(selectedRover.id, 'auto')">
            ⚙ OTONOM
          </button>
          <button class="hud-btn rover-mode-btn"
            :class="{ 'rover-mode-btn--active': selectedRover.mode === 'manual' }"
            @click="roverStore.setRoverMode(selectedRover.id, 'manual')">
            🕹 MANUEL
          </button>
        </div>

        <!-- Aksiyon butonları -->
        <div class="hud-divider" style="margin:8px 0" />
        <div class="rover-info-actions">
          <!-- Manuel mod veya bilgisayar kapalı: kullanıcı kendisi konuşlandırır -->
          <button v-if="selectedRover.status === 'idle' && (selectedRover.mode === 'manual' || !baseStore.computerRepaired)"
            class="hud-btn rover-btn rover-btn--deploy rover-action-btn"
            @click="gameStore.startDeploy(selectedRover.id); selectedRover = null">
            ▶ KONUŞLANDIR
          </button>
          <!-- Otonom mod + bilgisayar aktif: bilgisayar yönetir -->
          <span v-if="selectedRover.status === 'idle' && selectedRover.mode !== 'manual' && baseStore.computerRepaired"
            class="hud-label" style="font-size:8px;color:var(--cyan-dim)">OTONOM BEKLEMEDE</span>
          <button v-if="['deploying','collecting'].includes(selectedRover.status)"
            class="hud-btn rover-btn rover-action-btn"
            @click="roverStore.recall(selectedRover.id)">
            ◀ GERİ ÇAĞ
          </button>
          <button v-if="selectedRover.status === 'damaged'"
            class="hud-btn rover-btn rover-btn--repair rover-action-btn"
            @click="roverStore.repair(selectedRover.id)">
            🔧 ONAR (3🔩)
          </button>
          <button v-if="selectedRover.status === 'destroyed'"
            class="hud-btn hud-btn--danger rover-action-btn"
            @click="roverStore.dismiss(selectedRover.id); selectedRover = null">
            ✕ KALDIR
          </button>
        </div>
      </div>
    </transition>

    <!-- ── Bina Bilgi Paneli ── -->
    <transition name="slide-up">
      <div v-if="baseStore.selectedBuilding" class="hud-panel building-info-panel">
        <div class="hud-label panel-title" style="display:flex;align-items:center;gap:6px">
          <span>{{ getBuildingIcon(baseStore.selectedBuilding.type) }}</span>
          <span style="flex:1">{{ getBuildingName(baseStore.selectedBuilding.type) }}</span>
          <span style="color:var(--cyan);font-size:9px">Sv.{{ baseStore.selectedBuilding.level ?? 1 }}</span>
          <button class="hud-btn" style="padding:2px 8px;font-size:8px"
            @click="baseStore.selectedBuilding = null">✕</button>
        </div>
        <div class="hud-divider" />

        <!-- Açıklama -->
        <div class="hud-label" style="color:var(--text-dim);margin-bottom:6px;font-size:8px">
          {{ getBuildingDesc(baseStore.selectedBuilding.type) }}
        </div>

        <!-- İstatistikler -->
        <div class="building-stats">
          <div v-if="selectedBuildingPowerGen > 0" class="building-stat-row">
            <span class="hud-label" style="color:var(--text-dim)">GÜÇ ÜRETİM</span>
            <span class="hud-label text-green">+{{ selectedBuildingPowerGen }}</span>
          </div>
          <div v-if="selectedBuildingPowerUse > 0" class="building-stat-row">
            <span class="hud-label" style="color:var(--text-dim)">GÜÇ TÜKETİM</span>
            <span class="hud-label text-red">-{{ selectedBuildingPowerUse }}</span>
          </div>
          <div v-if="getBuildingStorageCap(baseStore.selectedBuilding) > 0" class="building-stat-row">
            <span class="hud-label" style="color:var(--text-dim)">DEPO KAPASITESI</span>
            <span class="hud-label" style="color:var(--cyan)">+{{ getBuildingStorageCap(baseStore.selectedBuilding) }}</span>
          </div>
          <div class="building-stat-row">
            <span class="hud-label" style="color:var(--text-dim)">BAĞLANTI</span>
            <span class="hud-label" :class="baseStore.connectedIds.has(baseStore.selectedBuilding.id) ? 'text-green' : 'text-red'">
              {{ baseStore.connectedIds.has(baseStore.selectedBuilding.id) ? 'BAĞLI' : 'BAĞLANTISIZ' }}
            </span>
          </div>
          <div class="building-stat-row">
            <span class="hud-label" style="color:var(--text-dim)">SAĞLIK</span>
            <span class="hud-label">{{ baseStore.selectedBuilding.health ?? 100 }}/{{ baseStore.selectedBuilding.maxHealth ?? 100 }}</span>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore }      from '@/stores/gameStore.js'
import { useWorldStore }     from '@/stores/worldStore.js'
import { useBaseStore }      from '@/stores/baseStore.js'
import { useRoverStore, ROVER_DEF, ROVER_TYPES, COMPUTER_STRATEGIES, getRoverStats } from '@/stores/roverStore.js'
import { useInventoryStore } from '@/stores/inventoryStore.js'
import { ITEMS }             from '@/stores/inventoryStore.js'
import { BUILDING_TYPES, getBuildingPowerGen, getBuildingPowerUse } from '@/game/systems/BaseSystem.js'

const REPAIR_COST = BUILDING_TYPES.MAIN_COMPUTER.repairCost

const gameStore      = useGameStore()
const worldStore     = useWorldStore()
const baseStore      = useBaseStore()
const roverStore     = useRoverStore()
const inventoryStore = useInventoryStore()

const showBuildRover  = ref(false)
const selectedRover   = ref(null)

function toggleRoverInfo(rover) {
  selectedRover.value = selectedRover.value?.id === rover.id ? null : rover
}

const activeRoverList = computed(() =>
  roverStore.rovers.filter(r => r.status !== 'destroyed' || true)
)

const topResources = computed(() => {
  const inv = inventoryStore.items
  // İlk 6 kaynağı göster
  return Object.fromEntries(Object.entries(inv).slice(0, 6))
})

// Net güç = bina üretimi - bina tüketimi - rover tüketimi
const netPower = computed(() => baseStore.powerBalance - roverStore.totalPowerDraw)

function getRoverPowerUse(rover) {
  return getRoverStats(rover.level ?? 1).powerUse ?? 4
}

function getRoverNextLevel(rover) {
  const next = ROVER_DEF.levels[rover.level ?? 1]
  return next?.upgradeCost ? next : null
}

function canAffordRoverUpgrade(rover) {
  const next = getRoverNextLevel(rover)
  if (!next || rover.status !== 'idle') return false
  return Object.entries(next.upgradeCost).every(([item, qty]) => inventoryStore.has(item, qty))
}

function getItemIcon(id) { return ITEMS[id]?.icon ?? '?' }
function getItemName(id) { return ITEMS[id]?.name ?? id }
function getRoverIcon(type) { return ROVER_TYPES[type]?.icon ?? '🤖' }
function getBuildingIcon(type) { return BUILDING_TYPES[type]?.icon ?? '🏗' }
function getBuildingName(type) { return BUILDING_TYPES[type]?.name ?? type }
function getBuildingDesc(type) { return BUILDING_TYPES[type]?.desc ?? '' }
function getBuildingStorageCap(b) {
  const def = BUILDING_TYPES[b.type]
  return def?.storageCapacity ? def.storageCapacity * (b.level ?? 1) : 0
}

const selectedBuildingPowerGen = computed(() =>
  baseStore.selectedBuilding ? getBuildingPowerGen(baseStore.selectedBuilding) : 0
)
const selectedBuildingPowerUse = computed(() =>
  baseStore.selectedBuilding ? getBuildingPowerUse(baseStore.selectedBuilding) : 0
)

const STATUS_LABELS = {
  idle: 'BEKLEMEDE', deploying: 'GÖNDERILIYOR', collecting: 'TOPLUYOR',
  returning: 'DÖNÜYOR', damaged: 'ARIZALI', destroyed: 'YOK EDİLDİ', building: 'İNŞA EDİLİYOR',
}
function statusLabel(s) { return STATUS_LABELS[s] ?? s.toUpperCase() }

function showProgress(rover) {
  return ['deploying', 'collecting', 'returning', 'building'].includes(rover.status)
}

function roverProgress(rover) {
  if (rover.status === 'building')    return rover.buildProgress ?? 0
  if (!rover.mission)                 return 0
  if (rover.status === 'deploying')   return rover.mission.travelProgress ?? 0
  if (rover.status === 'collecting')  return rover.mission.collectProgress ?? 0
  if (rover.status === 'returning')   return rover.mission.travelProgress ?? 0
  return 0
}

const tempClass = computed(() => {
  const t = worldStore.temperature
  if (t >= 35)  return 'temp--hot'
  if (t >= 15)  return 'temp--warm'
  if (t >= 0)   return 'temp--cool'
  return 'temp--cold'
})

const tempSign = computed(() => worldStore.temperature < 0 ? '-' : '+')

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

const canAffordBuild = computed(() =>
  baseStore.computerRepaired &&
  Object.entries(ROVER_DEF.buildCost).every(([item, qty]) => inventoryStore.has(item, qty)) &&
  roverStore.rovers.filter(r => r.status !== 'destroyed').length < baseStore.maxRovers
)

const upgradableRovers = computed(() =>
  roverStore.rovers.filter(r =>
    r.status === 'idle' && (r.level ?? 1) < ROVER_DEF.levels.length
  )
)

function canAffordUpgrade(rover) {
  const nextData = ROVER_DEF.levels[rover.level ?? 1]
  if (!nextData?.upgradeCost) return false
  return Object.entries(nextData.upgradeCost).every(([item, qty]) => inventoryStore.has(item, qty))
}

function doBuildRover() {
  const ok = roverStore.buildRover()
  if (ok) showBuildRover.value = false
}

function doUpgradeRover(roverId) {
  roverStore.upgradeRover(roverId)
}
</script>

<style scoped>
.game-hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 100;
}

/* ── Sol panel ── */
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

.base-stat-row {
  display: flex; align-items: center; gap: 6px; margin-bottom: 6px;
}
.base-stat-row .hud-label { width: 32px; font-size: 8px; }

.base-stat-bar {
  flex: 1; height: 4px;
  background: rgba(0,0,0,0.55);
  overflow: hidden;
}
.base-stat-bar__fill { height: 100%; transition: width 0.4s; box-shadow: none; }
.fill-green { background: var(--green); }
.fill-red   { background: var(--red);   }
.fill-cyan  { background: var(--cyan);  }
.text-green { color: var(--green); }
.text-red   { color: var(--red); }

.power-breakdown {
  display: flex; align-items: center; gap: 6px;
  margin: -2px 0 6px; font-size: 8px;
}
.power-sources {
  margin-bottom: 6px; border-left: 1px solid var(--cyan-dim); padding-left: 6px;
}
.power-source-row {
  display: flex; align-items: center; gap: 4px;
  font-size: 8px; margin-bottom: 3px;
}

.resource-list { display: flex; flex-direction: column; gap: 4px; }
.resource-row  { display: flex; align-items: center; gap: 6px; }
.res-icon { font-size: 12px; width: 16px; }
.res-name { flex: 1; font-size: 8px; }
.res-qty  { font-family: var(--font-hud); font-size: 11px; color: var(--cyan); }

.build-btn {
  width: 100%; padding: 8px; font-size: 9px; margin-top: 4px;
}

/* ── Sağ panel ── */
.hud-rovers {
  position: absolute;
  top: 12px; right: 12px;
  width: 200px;
  padding: 12px;
  pointer-events: all;
}

.rover-list { display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; }

.rover-card {
  padding: 10px 10px 8px;
  border: 1px solid var(--border);
  border-left: 2px solid var(--border);
  background: var(--bg-glass);
  transition: background 0.15s;
}
.rover-card:hover { background: rgba(0,229,255,0.07); }

/* Sol kenar durum rengi */
.rover-card--idle       { border-left-color: var(--cyan-dim); }
.rover-card--deploying,
.rover-card--collecting,
.rover-card--returning  { border-left-color: var(--green); }
.rover-card--damaged    { border-color: var(--orange-glow);          border-left-color: var(--orange); }
.rover-card--destroyed  { border-color: var(--red-glow); opacity:0.6; border-left-color: var(--red); }
.rover-card--building   { border-left-color: rgba(0,229,255,0.3); }
.rover-card--selected   {
  border-color: var(--cyan) !important;
  border-left-color: var(--cyan) !important;
  background: rgba(0,229,255,0.08) !important;
}

.rover-top { display: flex; align-items: center; gap: 7px; margin-bottom: 6px; }
.rover-type-icon { font-size: 14px; line-height: 1; }
.rover-name { flex: 1; font-size: 9px; }
.rover-status-badge {
  font-size: 7px;
  color: var(--cyan-dim);
  padding: 1px 5px;
  border: 1px solid rgba(0,229,255,0.15);
  background: rgba(0,229,255,0.05);
}
.rover-power-row { font-size: 8px; color: var(--red); margin: 0 0 5px; }
.rover-info-actions { display: flex; flex-direction: column; gap: 5px; }
.rover-action-btn { width: 100%; font-size: 8px; padding: 5px; }

.rover-card--selected { border-color: var(--cyan) !important; }

.rover-info-panel {
  position: absolute;
  top: 12px;
  right: 228px;   /* rover paneli (200px) + gap (16px) + margin (12px) */
  min-width: 210px;
  max-width: 240px;
  max-height: calc(100vh - 80px);
  overflow-y: auto;
  z-index: 100;
  pointer-events: all;
}

.rover-mode-bar {
  display: flex; gap: 4px; margin-bottom: 4px;
}
.rover-mode-btn {
  flex: 1; padding: 4px 2px; font-size: 8px; letter-spacing: 0.5px;
  opacity: 0.5;
}
.rover-mode-btn--active {
  opacity: 1;
  color: var(--cyan);
  border-color: var(--cyan);
  box-shadow: 0 0 6px var(--cyan-glow);
}

.building-info-panel {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  min-width: 240px;
  max-width: 300px;
  z-index: 100;
}
.building-stats { display: flex; flex-direction: column; gap: 4px; }
.building-stat-row {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 8px;
}

.rover-progress-bar, .rover-health-bar {
  height: 4px;
  background: rgba(0,0,0,0.55);
  margin-bottom: 5px;
  overflow: hidden;   /* box-shadow taşmasını engeller, 4px tam dolum alanı */
}
.rover-progress-fill { height: 100%; background: var(--cyan); box-shadow: none; transition: width 0.3s; }
.rover-health-fill   { height: 100%; box-shadow: none; transition: width 0.3s; }

.rover-hint {
  font-size: 7px;
  color: var(--text-dim);
  margin-top: 4px;
  text-align: right;
  letter-spacing: 1px;
}
.rover-actions { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
.rover-btn { padding: 3px 7px; font-size: 8px; }
.rover-btn--deploy  { color: var(--green);  border-color: var(--green-glow); }
.rover-btn--repair  { color: var(--orange); border-color: var(--orange-glow); }
.rover-btn--dismiss { color: var(--red);    border-color: var(--red-glow); }

.no-rover { color: var(--text-dim); font-size: 9px; text-align: center; padding: 12px 0; }

/* ── Alt çubuk ── */
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

/* ── Bildirimler ── */
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

/* ── Rover üretim overlay ── */
.close-btn {
  margin-left: auto; background: none; border: none;
  color: var(--text-dim); font-size: 14px; cursor: pointer; padding: 0 4px;
}
.close-btn:hover { color: var(--red); }

.rover-build-grid { display: flex; flex-direction: column; gap: 10px; }

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

.rover-upgrade-row {
  display: flex; align-items: center; gap: 4px;
  padding: 8px; border: 1px solid var(--border); background: var(--bg-glass);
  margin-bottom: 6px;
}

/* ── Tamir misyon paneli ── */
.mission-panel {
  padding: 8px 0 4px;
}
.mission-title {
  font-size: 9px; color: var(--orange); letter-spacing: 1px; margin-bottom: 6px;
}
.mission-costs { display: flex; flex-direction: column; gap: 3px; margin-bottom: 8px; }
.mission-cost-row { display: flex; align-items: center; gap: 6px; }
.mission-cost-row .res-name { flex: 1; font-size: 8px; }

/* ── Dialog içi bilgisayar uyarısı ── */
.computer-warning {
  font-size: 9px; color: var(--orange);
  border: 1px solid var(--orange-glow);
  padding: 8px 10px; margin-bottom: 12px; letter-spacing: 1px;
}

/* ── Bilgisayar durum rozeti ── */
.computer-status {
  font-size: 8px; color: var(--cyan); letter-spacing: 1px;
  display: flex; align-items: center; gap: 6px; padding: 4px 0;
}

/* ── Bilgisayar yükseltme paneli ── */
.computer-upgrade-panel {
  margin-top: 6px;
  padding: 8px;
  border: 1px solid rgba(0,229,255,0.25);
  background: rgba(0,51,85,0.3);
}
.upgrade-section-title {
  font-size: 8px; color: var(--cyan); letter-spacing: 1px; margin-bottom: 6px;
}

/* ── Strateji seçici ── */
.strategy-bar {
  display: flex; gap: 4px; margin-bottom: 4px;
}
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
