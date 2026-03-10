/**
 * Renk yardımcı fonksiyonları — tüm rendererlar tarafından kullanılır
 */

/** Hex rengi karartır (factor: 0-1, 0=siyah, 1=orijinal) */
export function darken(hex, f) {
  return 'rgb(' +
    (parseInt(hex.slice(1,3),16)*f|0) + ',' +
    (parseInt(hex.slice(3,5),16)*f|0) + ',' +
    (parseInt(hex.slice(5,7),16)*f|0) + ')'
}

/** İki hex renk arasında lerp (t: 0-1) */
export function lerpColor(a, b, t) {
  const ar=parseInt(a.slice(1,3),16), ag=parseInt(a.slice(3,5),16), ab=parseInt(a.slice(5,7),16)
  const br=parseInt(b.slice(1,3),16), bg=parseInt(b.slice(3,5),16), bb=parseInt(b.slice(5,7),16)
  return 'rgb(' + (ar+(br-ar)*t|0) + ',' + (ag+(bg-ag)*t|0) + ',' + (ab+(bb-ab)*t|0) + ')'
}

/** Radyal glow efekti çizer */
export function drawGlow(ctx, x, y, color, alpha, r = 28) {
  const cr=parseInt(color.slice(1,3),16), cg=parseInt(color.slice(3,5),16), cb=parseInt(color.slice(5,7),16)
  const grd = ctx.createRadialGradient(x, y, 0, x, y, r)
  grd.addColorStop(0, 'rgba(' + cr + ',' + cg + ',' + cb + ',' + alpha + ')')
  grd.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = grd
  ctx.beginPath(); ctx.ellipse(x, y, r, r*0.5, 0, 0, Math.PI*2); ctx.fill()
}
