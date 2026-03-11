/**
 * Gece/Gündüz döngüsü — gezegen parametreleriyle dinamik sıcaklık ve döngü hızı.
 *
 * dayLengthSec : gezegenin kendi etrafındaki dönüş süresi (oyun sn)  [varsayılan 600]
 * tempDayMax   : gündüz zirve sıcaklığı °C
 * tempNightMin : gece dip sıcaklığı °C
 */

export const DEFAULT_DAY_LENGTH = 600   // sn — yedek varsayılan

export const CYCLE_PHASES = {
  DAWN:  { name: 'Şafak',          start: 0.00, end: 0.12 },
  DAY:   { name: 'Gündüz',         start: 0.12, end: 0.45 },
  DUSK:  { name: 'Alacakaranlık',  start: 0.45, end: 0.58 },
  NIGHT: { name: 'Gece',           start: 0.58, end: 0.88 },
  LATE:  { name: 'Gece Yarısı',    start: 0.88, end: 1.00 },
}

export class DayNightCycle {
  /**
   * @param {object} [planetThermal] - PlanetGenerator'dan gelen thermal nesnesi
   *   { dayLengthSec, tempDayMax, tempNightMin }
   */
  constructor(planetThermal = null) {
    this.elapsed   = 0       // oyun saniyesi
    this.dayNumber = 1

    this._applyPlanet(planetThermal)
  }

  _applyPlanet(t) {
    this.dayLengthSec  = t?.dayLengthSec  ?? DEFAULT_DAY_LENGTH
    this.tempDayMax    = t?.tempDayMax    ?? 42
    this.tempNightMin  = t?.tempNightMin  ?? -18
  }

  /** Gezegen parametrelerini güncelle (dünya üretilince çağrılır) */
  applyPlanetThermal(planetThermal) {
    this._applyPlanet(planetThermal)
  }

  update(delta) {
    this.elapsed += delta
    if (this.elapsed >= this.dayLengthSec) {
      this.elapsed -= this.dayLengthSec
      this.dayNumber++
    }
  }

  /** 0..1 arası gün içi konum */
  get progress() {
    return this.elapsed / this.dayLengthSec
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
   * Karanlık faktörü 0 (tam aydınlık) → 0.45 (tam karanlık)
   */
  get darkness() {
    const p = this.progress
    if (p < 0.12) return lerp(0.35, 0,    (p - 0.00) / 0.12)
    if (p < 0.45) return 0
    if (p < 0.58) return lerp(0,    0.45, (p - 0.45) / 0.13)
    if (p < 0.88) return 0.45
    return              lerp(0.45, 0.35,  (p - 0.88) / 0.12)
  }

  /**
   * Anlık sıcaklık (°C) — gezegen parametrelerine göre interpolasyon.
   * Şafak: gecelerin en soğuğundan gündüzün zirvesine ısınır.
   * Gece yarısı: düşmeye devam eder.
   */
  get temperature() {
    const p    = this.progress
    const hot  = this.tempDayMax
    const cold = this.tempNightMin
    const dawn = lerp(cold, hot, 0.3)    // şafak başı orta-soğuk

    if (p < 0.12) return lerp(cold, dawn, p / 0.12)             // şafak: ısınma
    if (p < 0.28) return lerp(dawn, hot,  (p - 0.12) / 0.16)   // sabah: zirveye çıkış
    if (p < 0.45) return lerp(hot,  lerp(hot, cold, 0.2), (p - 0.28) / 0.17)  // öğleden sonra
    if (p < 0.58) return lerp(lerp(hot, cold, 0.2), lerp(cold, hot, 0.1), (p - 0.45) / 0.13) // alacak.
    if (p < 0.88) return lerp(lerp(cold, hot, 0.1), cold, (p - 0.58) / 0.30)  // gece soğuma
    return               lerp(cold, dawn, (p - 0.88) / 0.12)    // geç gece → şafak
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
    return {
      elapsed:       this.elapsed,
      dayNumber:     this.dayNumber,
      dayLengthSec:  this.dayLengthSec,
      tempDayMax:    this.tempDayMax,
      tempNightMin:  this.tempNightMin,
    }
  }

  fromJSON(data) {
    this.elapsed      = data.elapsed      ?? 0
    this.dayNumber    = data.dayNumber    ?? 1
    this.dayLengthSec = data.dayLengthSec ?? DEFAULT_DAY_LENGTH
    this.tempDayMax   = data.tempDayMax   ?? 42
    this.tempNightMin = data.tempNightMin ?? -18
    return this
  }
}

function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)) }
