/**
 * Gece/Gündüz döngüsü — sadece görsel/atmosfer etkisi
 */

export const DAY_DURATION   = 600   // sn cinsinden tam gün (600s = 10 dakika)
export const CYCLE_PHASES = {
  DAWN:    { name: 'Şafak',    start: 0.00, end: 0.12 },
  DAY:     { name: 'Gündüz',   start: 0.12, end: 0.45 },
  DUSK:    { name: 'Alacakaranlık', start: 0.45, end: 0.58 },
  NIGHT:   { name: 'Gece',    start: 0.58, end: 0.88 },
  LATE:    { name: 'Gece Yarısı', start: 0.88, end: 1.00 },
}

export class DayNightCycle {
  constructor() {
    this.elapsed = 0     // saniye
    this.dayNumber = 1
  }

  update(delta) {
    this.elapsed += delta
    if (this.elapsed >= DAY_DURATION) {
      this.elapsed -= DAY_DURATION
      this.dayNumber++
    }
  }

  /** 0..1 arası gün içi konum */
  get progress() {
    return this.elapsed / DAY_DURATION
  }

  /** Mevcut faz */
  get phase() {
    const p = this.progress
    for (const [key, ph] of Object.entries(CYCLE_PHASES)) {
      if (p >= ph.start && p < ph.end) return { key, ...ph }
    }
    return { key: 'DAY', ...CYCLE_PHASES.DAY }
  }

  /**
   * Karanlık faktörü 0 (tam aydınlık) → 1 (tam karanlık)
   * Gece → 0.7, diğerleri gradyan
   */
  get darkness() {
    const p = this.progress
    if (p < 0.12) return lerp(0.35, 0, (p - 0) / 0.12)          // şafak
    if (p < 0.45) return 0                                         // gündüz
    if (p < 0.58) return lerp(0, 0.45, (p - 0.45) / 0.13)        // alacakaranlık
    if (p < 0.88) return 0.45                                      // gece
    return lerp(0.45, 0.35, (p - 0.88) / 0.12)                   // geç gece → şafak
  }

  /**
   * Sıcaklık (°C) — gece soğuk, gündüz sıcak
   * Gündüz zirve: ~42°C  |  Gece dip: ~-18°C
   */
  get temperature() {
    const p = this.progress
    if (p < 0.12) return lerp(-12, 26, p / 0.12)             // şafak: ısınma
    if (p < 0.28) return lerp(26, 42, (p - 0.12) / 0.16)    // sabah: gündüz zirvesi
    if (p < 0.45) return lerp(42, 28, (p - 0.28) / 0.17)    // öğleden sonra: biraz serinleme
    if (p < 0.58) return lerp(28, -8, (p - 0.45) / 0.13)    // alacakaranlık: hızlı düşüş
    if (p < 0.88) return lerp(-8, -18, (p - 0.58) / 0.30)   // gece: soğuma
    return lerp(-18, -12, (p - 0.88) / 0.12)                 // geç gece → şafak
  }

  /**
   * Canvas overlay rengi (rgba string)
   */
  get overlayColor() {
    const d = this.darkness
    if (d === 0) return null
    return `rgba(0, 5, 25, ${d.toFixed(2)})`
  }

  get isNight() {
    return this.darkness > 0.3
  }

  toJSON() {
    return { elapsed: this.elapsed, dayNumber: this.dayNumber }
  }

  fromJSON(data) {
    this.elapsed = data.elapsed ?? 0
    this.dayNumber = data.dayNumber ?? 1
    return this
  }
}

function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)) }
