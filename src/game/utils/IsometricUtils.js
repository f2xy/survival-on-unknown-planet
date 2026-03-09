/**
 * Izometrik koordinat dönüşüm yardımcıları
 * Tile koordinatları (tx, ty) ↔ Ekran koordinatları (sx, sy)
 */

export const ISO = {
  TILE_W: 64,  // tile genişliği (px)
  TILE_H: 32,  // tile yüksekliği (px)

  /**
   * Tile → Ekran
   */
  toScreen(tx, ty, offsetX = 0, offsetY = 0) {
    return {
      x: (tx - ty) * (this.TILE_W / 2) + offsetX,
      y: (tx + ty) * (this.TILE_H / 2) + offsetY,
    }
  },

  /**
   * Ekran → Tile (yaklaşık, mouse pick için)
   */
  toTile(sx, sy, offsetX = 0, offsetY = 0) {
    const rx = sx - offsetX
    const ry = sy - offsetY
    return {
      tx: Math.floor(rx / this.TILE_W + ry / this.TILE_H),
      ty: Math.floor(ry / this.TILE_H - rx / this.TILE_W),
    }
  },

  /**
   * Tile sıralama — izometrik derinlik sırası (painter's algorithm)
   */
  depthSort(a, b) {
    return (a.ty + a.tx) - (b.ty + b.tx)
  }
}
