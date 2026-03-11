/**
 * Hayatta kalma istatistikleri sistemi
 * Açlık, susuzluk, oksijen, enerji tüketimi
 * Gezegen parametrelerine göre dinamik tüketim çarpanları uygulanır.
 */

export const SURVIVAL_DEFAULTS = {
  health:  { value: 100, max: 100 },
  hunger:  { value: 100, max: 100 },
  thirst:  { value: 100, max: 100 },
  oxygen:  { value: 100, max: 100 },
  energy:  { value: 100, max: 100 },
}

// Saniyede temel düşüş miktarları (normal koşul, Dünya benzeri gezegen)
const BASE_DRAIN_RATES = {
  hunger:  0.4,   // 250 sn'de biter
  thirst:  0.6,   // ~167 sn
  oxygen:  0.2,   // 500 sn — varsayılan atmosfer
  energy:  0.3,   // hareket edince artar
}

const HEALTH_DRAIN_RATE = 1.5  // açken sağlık düşüş hızı

export class SurvivalSystem {
  /**
   * @param {object|null} stats    - Kayıttan yüklenen istatistikler
   * @param {object|null} planetEffects - worldStore.planetEffects
   *   { oxygenDrainMult, radiationDrainMult, gravityEnergyMult, toxicAtmosphere }
   */
  constructor(stats, planetEffects = null) {
    this.stats = stats ? { ...stats } : this._defaultStats()
    this.planetEffects = planetEffects ?? {
      oxygenDrainMult:    1.0,
      radiationDrainMult: 1.0,
      gravityEnergyMult:  1.0,
      toxicAtmosphere:    false,
    }
  }

  /** Gezegen etkilerini güncelle (dünya yüklendikten sonra çağrılır) */
  applyPlanetEffects(effects) {
    if (effects) this.planetEffects = { ...effects }
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
    const pe = this.planetEffects

    // ── Oksijen tüketimi ─────────────────────────────────────────────────────
    // Gezegen atmosfer çarpanı + toksik alan etkisi + oksijen tankı
    const oxyMult = pe.oxygenDrainMult
                  * (isInToxicArea || pe.toxicAtmosphere ? 2.0 : 1.0)
                  * (hasOxygenTank ? 0.3 : 1.0)
    this._drain('oxygen', BASE_DRAIN_RATES.oxygen * oxyMult * delta)

    // ── Açlık / Susuzluk ─────────────────────────────────────────────────────
    // Yüksek yerçekimi → daha çok metabolizma → daha hızlı açlık/susuzluk
    const metabolismMult = Math.max(0.7, Math.min(1.8, pe.gravityEnergyMult))
    this._drain('hunger', BASE_DRAIN_RATES.hunger * metabolismMult * delta)
    this._drain('thirst', BASE_DRAIN_RATES.thirst * metabolismMult * delta)

    // ── Enerji (hareket + yerçekimi) ─────────────────────────────────────────
    if (isMoving) {
      this._drain('energy', BASE_DRAIN_RATES.energy * pe.gravityEnergyMult * delta)
    } else {
      this._restore('energy', BASE_DRAIN_RATES.energy * 0.5 * delta)
    }

    // ── Radyasyon → sağlık hasarı ────────────────────────────────────────────
    // Radyasyon direkt sağlık düşürür (oksijen tankı kısmen korur)
    const radMult = pe.radiationDrainMult * (hasOxygenTank ? 0.5 : 1.0)
    if (radMult > 1.5) {
      // Yüksek radyasyon → sürekli düşük sağlık kaybı
      const radDamage = (radMult - 1.0) * 0.08 * delta
      this._drain('health', radDamage)
    }

    // ── Açlık/susuzluk/hipoksi → sağlık kaybı ────────────────────────────────
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
    // Yüksek radyasyon uyarısı
    if (this.planetEffects.radiationDrainMult >= 3.5) {
      alerts.push({ stat: 'radiation', level: this.planetEffects.radiationDrainMult >= 6 ? 'critical' : 'warning' })
    }
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
