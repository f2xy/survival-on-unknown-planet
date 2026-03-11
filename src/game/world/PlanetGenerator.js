/**
 * Gezegen üretici — yeni oyunlarda rastgele, fiziksel olarak tutarlı gezegen parametreleri oluşturur.
 *
 * Parametreler:
 *  Yıldız   : tip, parlaklık (L☉), yüzey sıcaklığı (K), radyasyon seviyesi
 *  Yörünge  : yıldızdan mesafe (AU), yıldız etrafı dönüş süresi (yıl → sn)
 *  Gezegen  : çap (km), yoğunluk (g/cm³), yer çekimi (m/s²), eksenel eğiklik (°)
 *  Atmosfer : tip, kalınlık katsayısı, sera etkisi, oksijen oranı, basınç (atm)
 *  Termal   : temel sıcaklık (°C), gündüz/gece salınımı (°C), gün uzunluğu (sn)
 */

// ── Yıldız tipleri ───────────────────────────────────────────────────────────

export const STAR_TYPES = {
  RED_DWARF: {
    id: 'RED_DWARF',
    name: 'Kırmızı Cüce',
    spectral: 'M',
    color: '#ff6060',
    luminosityRange: [0.01, 0.08],   // L☉
    surfaceTempRange: [2500, 3900],  // K
    radiationBase: 0.3,              // rölatif (1.0 = Güneş ekvivalenti)
    habitableZone: [0.08, 0.40],    // AU
    weight: 30,                      // seçilme ağırlığı
  },
  ORANGE_DWARF: {
    id: 'ORANGE_DWARF',
    name: 'Turuncu Cüce',
    spectral: 'K',
    color: '#ffaa40',
    luminosityRange: [0.08, 0.60],
    surfaceTempRange: [3900, 5200],
    radiationBase: 0.7,
    habitableZone: [0.28, 0.85],
    weight: 25,
  },
  YELLOW_STAR: {
    id: 'YELLOW_STAR',
    name: 'Sarı Cüce',
    spectral: 'G',
    color: '#ffee44',
    luminosityRange: [0.60, 1.50],
    surfaceTempRange: [5200, 6000],
    radiationBase: 1.0,
    habitableZone: [0.75, 1.40],
    weight: 20,
  },
  WHITE_STAR: {
    id: 'WHITE_STAR',
    name: 'Beyaz Yıldız',
    spectral: 'F',
    color: '#e0e8ff',
    luminosityRange: [1.50, 5.00],
    surfaceTempRange: [6000, 7500],
    radiationBase: 2.5,
    habitableZone: [1.20, 2.20],
    weight: 15,
  },
  BLUE_WHITE: {
    id: 'BLUE_WHITE',
    name: 'Mavi-Beyaz',
    spectral: 'A',
    color: '#99bbff',
    luminosityRange: [5.00, 25.00],
    surfaceTempRange: [7500, 10000],
    radiationBase: 8.0,
    habitableZone: [2.00, 4.50],
    weight: 10,
  },
}

// ── Atmosfer tipleri ─────────────────────────────────────────────────────────

export const ATMOSPHERE_TYPES = {
  NONE: {
    id: 'NONE',
    name: 'Atmosfersiz',
    oxygenRatio: 0.0,
    greehouseEffect: 0.0,   // ek ısınma katsayısı
    radiationShield: 0.0,   // radyasyonu ne kadar düşürür (0–1)
    pressureAtm: 0.0,
    oxygenDrainMult: 4.0,   // oksijen tüketim çarpanı
    toxicDamage: false,
    color: null,
  },
  THIN_CO2: {
    id: 'THIN_CO2',
    name: 'İnce CO₂',
    oxygenRatio: 0.02,
    greehouseEffect: 0.05,
    radiationShield: 0.15,
    pressureAtm: 0.10,
    oxygenDrainMult: 3.0,
    toxicDamage: false,
    color: '#cc6633',
  },
  THICK_CO2: {
    id: 'THICK_CO2',
    name: 'Yoğun CO₂',
    oxygenRatio: 0.01,
    greehouseEffect: 0.40,
    radiationShield: 0.55,
    pressureAtm: 2.50,
    oxygenDrainMult: 3.5,
    toxicDamage: false,
    color: '#dd8844',
  },
  N2_O2: {
    id: 'N2_O2',
    name: 'N₂/O₂ Karışımı',
    oxygenRatio: 0.21,
    greehouseEffect: 0.08,
    radiationShield: 0.80,
    pressureAtm: 1.0,
    oxygenDrainMult: 0.2,   // neredeyse solunum yapılabilir
    toxicDamage: false,
    color: '#88aacc',
  },
  METHANE: {
    id: 'METHANE',
    name: 'Metan Atmosferi',
    oxygenRatio: 0.0,
    greehouseEffect: 0.30,
    radiationShield: 0.45,
    pressureAtm: 1.50,
    oxygenDrainMult: 3.0,
    toxicDamage: true,
    color: '#88cc44',
  },
  ACIDIC: {
    id: 'ACIDIC',
    name: 'Asit Atmosferi',
    oxygenRatio: 0.0,
    greehouseEffect: 0.20,
    radiationShield: 0.60,
    pressureAtm: 3.00,
    oxygenDrainMult: 4.0,
    toxicDamage: true,
    color: '#aacc00',
  },
}

// ── Yardımcı fonksiyonlar ────────────────────────────────────────────────────

/** seed'li pseudo-rastgele: [0, 1) */
function seededRng(seed) {
  let s = seed | 0
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function randRange(rng, min, max) { return min + rng() * (max - min) }
function randChoice(rng, arr) { return arr[Math.floor(rng() * arr.length)] }
function weightedChoice(rng, items) {
  const total = Object.values(items).reduce((s, v) => s + v.weight, 0)
  let r = rng() * total
  for (const item of Object.values(items)) {
    r -= item.weight
    if (r <= 0) return item
  }
  return Object.values(items)[0]
}

// ── Fizik hesapları ──────────────────────────────────────────────────────────

/**
 * Efektif denge sıcaklığı (°C) — Stefan-Boltzmann'dan basitleştirilmiş.
 * T = 278.5 × L^0.25 / sqrt(d) × greenhouseFactor − 273.15
 * @param {number} luminosity  L☉ cinsinden parlaklık
 * @param {number} distanceAU  AU cinsinden mesafe
 * @param {number} greehouseEffect  0..1 sera etkisi
 * @returns {number} °C
 */
function calcBaseTemperature(luminosity, distanceAU, greehouseEffect) {
  const albedo = 0.30   // gezegenin ortalama yansıtma gücü
  const T_K = 278.5 * Math.pow(luminosity * (1 - albedo), 0.25) / Math.sqrt(distanceAU)
  const greenhouse_K = greehouseEffect * 50  // sera etkisi ek ısı (K)
  return T_K + greenhouse_K - 273.15
}

/**
 * Yüzey yerçekimi (m/s²).
 * g = G × M / R²  →  basitleştirilmiş: g = g☉ × (density/d☉) × (radius/r☉)
 * Dünya referans: g=9.81, density≈5.5g/cm³, radius≈6371km
 */
function calcGravity(diameterKm, densityGcm3) {
  const EARTH_DIAMETER = 12742
  const EARTH_DENSITY  = 5.51
  const EARTH_G        = 9.81
  const rRatio = (diameterKm / EARTH_DIAMETER)
  const dRatio = (densityGcm3 / EARTH_DENSITY)
  return EARTH_G * rRatio * dRatio
}

/**
 * Radyasyon seviyesi (Sv/gün — Sievert).
 * Güneş: 1 AU, G tipi → ~0.04 Sv/gün
 * atmosfer kalkanı bunu azaltır.
 */
function calcRadiation(starRadiationBase, distanceAU, radiationShield, atmosphereThickness) {
  const rawRad = starRadiationBase / (distanceAU * distanceAU)
  const shielding = 1 - radiationShield * atmosphereThickness
  return rawRad * shielding
}

// ── Gezegen üreteci ─────────────────────────────────────────────────────────

export class PlanetGenerator {
  constructor(seed) {
    this.seed = seed ?? (Math.random() * 0xffffff | 0)
    this.rng  = seededRng(this.seed)
  }

  generate() {
    const rng = this.rng

    // ── 1. Yıldız ───────────────────────────────────────────────────────────
    const starDef    = weightedChoice(rng, STAR_TYPES)
    const luminosity = randRange(rng, starDef.luminosityRange[0], starDef.luminosityRange[1])
    const starSurfaceTemp = randRange(rng, starDef.surfaceTempRange[0], starDef.surfaceTempRange[1])

    // ── 2. Yörünge ──────────────────────────────────────────────────────────
    const [hzMin, hzMax] = starDef.habitableZone
    // %60 ihtimalle yaşanabilir kuşak içinde, %40 dışında (zorlu gezegen)
    let distanceAU
    if (rng() < 0.60) {
      distanceAU = randRange(rng, hzMin, hzMax)
    } else {
      // Hz dışı: ya çok yakın ya çok uzak
      distanceAU = rng() < 0.5
        ? randRange(rng, hzMin * 0.35, hzMin)
        : randRange(rng, hzMax, hzMax * 2.5)
    }

    // Yıldız yörüngesi süresi (gerçek saniye) — Kepler 3. yasası: T ∝ sqrt(d³/L)
    // Ölçek: 1 AU G tipi yıldız = 365 gün
    const orbitalYears  = Math.sqrt(Math.pow(distanceAU, 3) / luminosity)
    // Oyun zamanına çevir: 1 gerçek saniye = 1/60 oyun dakikası, 10 dk = 1 gün
    // 1 oyun günü = 600 sn, bir yıl = orbitalYears * 365 oyun günü
    const orbitalPeriodSec = orbitalYears * 365 * 600  // oyun sn cinsinden

    // ── 3. Gezegen fiziksel özellikleri ──────────────────────────────────────
    const diameterKm  = randRange(rng, 4000, 22000)   // Mars ~ 6800, Jüpiter ~ 139820
    const densityGcm3 = randRange(rng, 2.5, 8.5)      // Mars ~ 3.9, Dünya ~ 5.5
    const gravity     = calcGravity(diameterKm, densityGcm3)
    const axialTiltDeg = randRange(rng, 0, 45)         // eksenel eğiklik

    // ── 4. Atmosfer ─────────────────────────────────────────────────────────
    // Atmosfer tipi olasılıkları gezegen büyüklüğüne ve mesafeye bağlı
    const atmosphereKeys = Object.keys(ATMOSPHERE_TYPES)
    let atmWeights = {
      NONE:      15,
      THIN_CO2:  20,
      THICK_CO2: 20,
      N2_O2:     15,
      METHANE:   15,
      ACIDIC:    15,
    }
    // Büyük gezegen → daha olası yoğun atmosfer
    if (diameterKm > 14000) {
      atmWeights.THICK_CO2 += 15
      atmWeights.METHANE   += 10
      atmWeights.NONE       = Math.max(2, atmWeights.NONE - 10)
    }
    // Hz içindeyse N2/O2 biraz daha olası
    if (distanceAU >= hzMin && distanceAU <= hzMax) {
      atmWeights.N2_O2 += 10
    }

    const atmPool = atmosphereKeys.flatMap(k => Array(atmWeights[k]).fill(k))
    const atmKey  = atmPool[Math.floor(rng() * atmPool.length)]
    const atmDef  = ATMOSPHERE_TYPES[atmKey]

    // Atmosfer kalınlık çarpanı: 0.3–2.0 (1.0 = tipik)
    const atmosphereThickness = randRange(rng, 0.3, 2.0)

    // ── 5. Sıcaklık ─────────────────────────────────────────────────────────
    const baseTemp = calcBaseTemperature(luminosity, distanceAU, atmDef.greehouseEffect * atmosphereThickness)

    // Gece-gündüz sıcaklık salınımı: atmosfer kalınlığı ve yıldızdan mesafe belirler
    // İnce atmosfer + yakın yıldız → büyük salınım
    const swingFactor = Math.max(0.1, 1.5 - atmDef.greehouseEffect * atmosphereThickness * 1.2)
    const tempSwing   = Math.min(80, 15 + swingFactor * 50)   // °C, gece-gündüz farkı

    const tempDayMax  = baseTemp + tempSwing * 0.55
    const tempNightMin = baseTemp - tempSwing * 0.45

    // ── 6. Gün uzunluğu ──────────────────────────────────────────────────────
    // Oyun sn cinsinden (normal 600 sn = 10 dk, min 120 sn, max 1800 sn)
    const dayLengthSec = randRange(rng, 120, 1800)

    // ── 7. Radyasyon ─────────────────────────────────────────────────────────
    const radiationSvDay = calcRadiation(
      starDef.radiationBase,
      distanceAU,
      atmDef.radiationShield,
      atmosphereThickness,
    )

    // ── 8. Radyasyon seviyesi etiketi ────────────────────────────────────────
    let radiationLabel, radiationDrainMult
    if (radiationSvDay < 0.05)       { radiationLabel = 'DÜŞÜK';     radiationDrainMult = 0.5  }
    else if (radiationSvDay < 0.20)  { radiationLabel = 'ORTA';      radiationDrainMult = 1.0  }
    else if (radiationSvDay < 0.60)  { radiationLabel = 'YÜKSEK';    radiationDrainMult = 2.0  }
    else if (radiationSvDay < 1.50)  { radiationLabel = 'TEHLİKELİ'; radiationDrainMult = 3.5  }
    else                             { radiationLabel = 'ÖLÜMCÜL';   radiationDrainMult = 6.0  }

    // ── 9. Yerçekimi oyun etkisi ─────────────────────────────────────────────
    // Dünya = 9.81 m/s² → enerji tüketim çarpanı 1.0
    // Her 1 m/s² fark için +/−%10
    const gravityEnergyMult = Math.max(0.3, Math.min(2.5, gravity / 9.81))

    // ── 10. Gezegen adı / kodu ───────────────────────────────────────────────
    const prefix  = ['Kepler', 'Gliese', 'HD', 'Wolf', 'Trappist', 'Proxima'][Math.floor(rng() * 6)]
    const num     = 100 + Math.floor(rng() * 900)
    const suffix  = ['b', 'c', 'd', 'e', 'f'][Math.floor(rng() * 5)]
    const planetName = `${prefix}-${num}${suffix}`

    // ── Sonuç nesnesi ────────────────────────────────────────────────────────
    return {
      seed: this.seed,
      name: planetName,

      // Yıldız
      star: {
        type:        starDef.id,
        name:        starDef.name,
        spectral:    starDef.spectral,
        color:       starDef.color,
        luminosity:  +luminosity.toFixed(3),
        surfaceTemp: +starSurfaceTemp.toFixed(0),
      },

      // Yörünge
      orbit: {
        distanceAU:       +distanceAU.toFixed(3),
        orbitalPeriodSec: +orbitalPeriodSec.toFixed(0),
        orbitalYears:     +orbitalYears.toFixed(2),
      },

      // Gezegen fiziksel
      physical: {
        diameterKm:    +diameterKm.toFixed(0),
        densityGcm3:   +densityGcm3.toFixed(2),
        gravity:       +gravity.toFixed(2),       // m/s²
        axialTiltDeg:  +axialTiltDeg.toFixed(1),
        diameterEarth: +(diameterKm / 12742).toFixed(2),
        gravityEarth:  +(gravity / 9.81).toFixed(2),
      },

      // Atmosfer
      atmosphere: {
        type:              atmDef.id,
        name:              atmDef.name,
        thickness:         +atmosphereThickness.toFixed(2),
        oxygenRatio:       +atmDef.oxygenRatio.toFixed(3),
        pressureAtm:       +(atmDef.pressureAtm * atmosphereThickness).toFixed(2),
        radiationShield:   +atmDef.radiationShield.toFixed(2),
        toxicDamage:       atmDef.toxicDamage,
        color:             atmDef.color,
        oxygenDrainMult:   +atmDef.oxygenDrainMult.toFixed(2),
      },

      // Termal
      thermal: {
        baseTemp:      +baseTemp.toFixed(1),
        tempDayMax:    +tempDayMax.toFixed(1),
        tempNightMin:  +tempNightMin.toFixed(1),
        tempSwing:     +tempSwing.toFixed(1),
        dayLengthSec:  +dayLengthSec.toFixed(0),
      },

      // Radyasyon
      radiation: {
        svPerDay:     +radiationSvDay.toFixed(4),
        label:        radiationLabel,
        drainMult:    +radiationDrainMult.toFixed(2),
      },

      // Oyun etkileri (direkt kullanım için özet)
      effects: {
        oxygenDrainMult:  +atmDef.oxygenDrainMult.toFixed(2),
        radiationDrainMult: +radiationDrainMult.toFixed(2),
        gravityEnergyMult:  +gravityEnergyMult.toFixed(2),
        toxicAtmosphere:    atmDef.toxicDamage,
      },
    }
  }
}
