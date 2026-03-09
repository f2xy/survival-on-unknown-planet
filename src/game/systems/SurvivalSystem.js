/**
 * Hayatta kalma istatistikleri sistemi
 * Açlık, susuzluk, oksijen, enerji tüketimi
 */

export const SURVIVAL_DEFAULTS = {
  health:  { value: 100, max: 100 },
  hunger:  { value: 100, max: 100 },
  thirst:  { value: 100, max: 100 },
  oxygen:  { value: 100, max: 100 },
  energy:  { value: 100, max: 100 },
}

// Saniyede düşüş miktarları (normal koşul)
const DRAIN_RATES = {
  hunger:  0.4,   // 250 sn'de biter
  thirst:  0.6,   // ~167 sn
  oxygen:  0.2,   // 500 sn — gezegen atmosferi kısmi oksijen
  energy:  0.3,   // hareket edince artar
}

const HEALTH_DRAIN_RATE = 1.5  // açken sağlık düşüş hızı

export class SurvivalSystem {
  constructor(stats) {
    this.stats = stats ? { ...stats } : this._defaultStats()
  }

  _defaultStats() {
    return {
      health: 100, healthMax: 100,
      hunger: 100, hungerMax: 100,
      thirst: 100, thirstMax: 100,
      oxygen: 100, oxygenMax: 100,
      energy: 100, energyMax: 100,
    }
  }

  /**
   * Her frame güncelleme
   * @param {number} delta - geçen süre (saniye)
   * @param {object} context - { isMoving, isInToxicArea, hasOxygenTank }
   */
  update(delta, context = {}) {
    const { isMoving = false, isInToxicArea = false, hasOxygenTank = false } = context

    // Tüketim
    this._drain('hunger', DRAIN_RATES.hunger * delta)
    this._drain('thirst', DRAIN_RATES.thirst * delta)
    this._drain('oxygen', DRAIN_RATES.oxygen * (isInToxicArea ? 2 : 1) * (hasOxygenTank ? 0.3 : 1) * delta)
    if (isMoving) this._drain('energy', DRAIN_RATES.energy * delta)
    else          this._restore('energy', DRAIN_RATES.energy * 0.5 * delta)

    // Açlık/susuzluk sağlığı etkiler
    const starving   = this.stats.hunger < 20
    const dehydrated = this.stats.thirst < 20
    const hypoxic    = this.stats.oxygen < 15

    if (starving || dehydrated || hypoxic) {
      const multiplier = (starving ? 1 : 0) + (dehydrated ? 1.5 : 0) + (hypoxic ? 2 : 0)
      this._drain('health', HEALTH_DRAIN_RATE * multiplier * delta)
    } else if (this.stats.health < this.stats.healthMax) {
      // Tüm değerler yeterli → yavaş iyileşme
      this._restore('health', 0.5 * delta)
    }

    return this.getAlerts()
  }

  _drain(stat, amount) {
    this.stats[stat] = Math.max(0, this.stats[stat] - amount)
  }

  _restore(stat, amount) {
    const max = this.stats[`${stat}Max`] ?? 100
    this.stats[stat] = Math.min(max, this.stats[stat] + amount)
  }

  consume(item) {
    const effects = item.effects ?? {}
    for (const [stat, amount] of Object.entries(effects)) {
      if (stat in this.stats) this._restore(stat, amount)
    }
  }

  /** Uyarılar listesi */
  getAlerts() {
    const alerts = []
    if (this.stats.health  < 30) alerts.push({ stat: 'health',  level: this.stats.health < 15 ? 'critical' : 'warning' })
    if (this.stats.hunger  < 25) alerts.push({ stat: 'hunger',  level: this.stats.hunger < 10 ? 'critical' : 'warning' })
    if (this.stats.thirst  < 25) alerts.push({ stat: 'thirst',  level: this.stats.thirst < 10 ? 'critical' : 'warning' })
    if (this.stats.oxygen  < 20) alerts.push({ stat: 'oxygen',  level: this.stats.oxygen < 10 ? 'critical' : 'warning' })
    if (this.stats.energy  < 15) alerts.push({ stat: 'energy',  level: 'warning' })
    return alerts
  }

  get isDead() {
    return this.stats.health <= 0
  }

  /** Yüzde olarak (0–100) */
  pct(stat) {
    const max = this.stats[`${stat}Max`] ?? 100
    return (this.stats[stat] / max) * 100
  }

  toJSON() { return { ...this.stats } }
  fromJSON(data) { this.stats = { ...this._defaultStats(), ...data }; return this }
}
