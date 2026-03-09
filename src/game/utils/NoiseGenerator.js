/**
 * Basit Perlin-benzeri gürültü (2D simplex approximation)
 * Prosedürel harita üretimi için kullanılır.
 */

function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10) }
function lerp(a, b, t) { return a + t * (b - a) }

function grad(hash, x, y) {
  const h = hash & 3
  const u = h < 2 ? x : y
  const v = h < 2 ? y : x
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v)
}

export class NoiseGenerator {
  constructor(seed = Math.random() * 65536 | 0) {
    this.seed = seed
    this.p = this._buildPermutation(seed)
  }

  _buildPermutation(seed) {
    const p = Array.from({ length: 256 }, (_, i) => i)
    let s = seed
    for (let i = 255; i > 0; i--) {
      s = (s * 1664525 + 1013904223) & 0xffffffff
      const j = Math.abs(s) % (i + 1);
      [p[i], p[j]] = [p[j], p[i]]
    }
    return [...p, ...p]
  }

  noise(x, y) {
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    const xf = x - Math.floor(x)
    const yf = y - Math.floor(y)
    const u = fade(xf)
    const v = fade(yf)

    const aa = this.p[this.p[X    ] + Y    ]
    const ab = this.p[this.p[X    ] + Y + 1]
    const ba = this.p[this.p[X + 1] + Y    ]
    const bb = this.p[this.p[X + 1] + Y + 1]

    return lerp(
      lerp(grad(aa, xf, yf),     grad(ba, xf - 1, yf),     u),
      lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
      v
    )
  }

  /**
   * Octave noise (daha doğal görünüm)
   */
  octave(x, y, octaves = 4, persistence = 0.5, lacunarity = 2) {
    let val = 0, amp = 1, freq = 1, max = 0
    for (let i = 0; i < octaves; i++) {
      val += this.noise(x * freq, y * freq) * amp
      max += amp
      amp *= persistence
      freq *= lacunarity
    }
    return val / max  // normalize [-1, 1]
  }
}
