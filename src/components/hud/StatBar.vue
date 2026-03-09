<template>
  <div class="stat-row">
    <div class="stat-icon" :title="label">{{ icon }}</div>
    <div class="stat-info">
      <div class="stat-bar" :class="[`stat-bar--${type}`, { 'stat-bar--warning': isWarning }]">
        <div class="stat-bar__fill" :style="{ width: clampedPct + '%' }" />
      </div>
    </div>
    <div class="stat-val hud-label" :class="{ 'text-warning': isWarning, 'text-critical': isCritical }">
      {{ Math.round(value) }}<span class="stat-max">/ {{ max }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type:  { type: String, required: true },   // health | hunger | thirst | oxygen | energy
  label: { type: String, default: '' },
  icon:  { type: String, default: '◈' },
  value: { type: Number, default: 100 },
  max:   { type: Number, default: 100 },
})

const pct         = computed(() => (props.value / props.max) * 100)
const clampedPct  = computed(() => Math.max(0, Math.min(100, pct.value)))
const isWarning   = computed(() => pct.value < 25)
const isCritical  = computed(() => pct.value < 15)
</script>

<style scoped>
.stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-icon {
  font-size: 14px;
  width: 18px;
  text-align: center;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-val {
  font-family: var(--font-hud);
  font-size: 9px;
  white-space: nowrap;
  width: 52px;
  text-align: right;
}

.stat-max {
  opacity: 0.4;
  font-size: 8px;
}

.text-warning  { color: var(--orange); }
.text-critical { color: var(--red); animation: crit-pulse 0.8s ease-in-out infinite; }

@keyframes crit-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}
</style>
