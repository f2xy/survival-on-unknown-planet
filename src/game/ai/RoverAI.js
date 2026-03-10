/**
 * Rover Otonom AI Sistemi
 *
 * Sorumluluklar:
 *  - Boştaki roverları otomatik kaynak düğümlerine atama
 *  - Strateji bazlı öncelik hesaplama
 *  - Tüm roverlar hasarlıyken acil kurtarma mekanizması
 *
 * Bu modül saf fonksiyonlardan oluşur — yan etkisi yoktur.
 * State değişiklikleri roverStore tarafından uygulanır.
 */

import { ALL_RESOURCE_TYPES } from '@/data/balance.js'
import { deployRover } from '@/game/systems/RoverSystem.js'

/**
 * Strateji + envanter durumuna göre kaynak öncelik listesi hesaplar
 *
 * @param {string} strategy     - 'balanced' | 'repair' | 'explore'
 * @param {object} inventory    - { itemId: count }
 * @param {boolean} hasDamaged  - hasarlı rover var mı
 * @returns {string[]} Öncelik sıralı kaynak türleri
 */
export function computePriorities(strategy, inventory, hasDamaged) {
  if (strategy === 'repair') {
    return ['scrap_metal', 'crystal_shard', 'rock', 'alien_plant', 'alien_crystal']
  }
  if (strategy === 'explore') {
    return ['alien_crystal', 'alien_plant', 'crystal_shard', 'scrap_metal', 'rock']
  }

  // 'balanced': envanter seviyesine göre otomatik sıralama
  const scores = {}
  for (const t of ALL_RESOURCE_TYPES) {
    scores[t] = inventory[t] ?? 0
  }

  // Hasarlı rover varsa ve hurda metal azsa büyük öncelik
  const scrapCount = inventory['scrap_metal'] ?? 0
  if (hasDamaged && scrapCount < 6) {
    scores['scrap_metal'] -= 200
  }

  return [...ALL_RESOURCE_TYPES].sort((a, b) => scores[a] - scores[b])
}

/**
 * Öncelik skoru en yüksek düğüme rover atar
 * Skor = öncelik bonusu (büyük) - mesafe cezası (küçük)
 *
 * @param {object} rover         - Rover nesnesi
 * @param {object} resourceNodes - { nodeId: node }
 * @param {number} baseX         - Üs X koordinatı
 * @param {number} baseY         - Üs Y koordinatı
 * @param {Set}    targeted      - Zaten hedeflenmiş node ID'leri
 * @param {string[]} priorities  - computePriorities() sonucu
 * @returns {boolean} Atama yapıldı mı
 */
export function autoAssignRover(rover, resourceNodes, baseX, baseY, targeted, priorities) {
  let bestNode  = null
  let bestScore = -Infinity

  for (const node of Object.values(resourceNodes)) {
    if (node.remaining <= 0) continue
    if (targeted.has(node.id)) continue

    const dx   = node.tx - baseX
    const dy   = node.ty - baseY
    const dist = Math.sqrt(dx * dx + dy * dy)

    const rank  = priorities.indexOf(node.type)
    const bonus = rank >= 0 ? (priorities.length - rank) * 60 : 0
    const score = bonus - dist

    if (score > bestScore) {
      bestScore = score
      bestNode  = node
    }
  }

  if (bestNode) {
    targeted.add(bestNode.id)
    deployRover(rover, bestNode, baseX, baseY)
    return true
  }
  return false
}
