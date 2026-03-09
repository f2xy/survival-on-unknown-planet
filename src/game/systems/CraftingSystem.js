/**
 * Crafting sistemi — tarifler ve üretim
 */

export const RECIPES = {
  // ── Yiyecek/İçecek ──
  water_filter: {
    id: 'water_filter',
    name: 'Su Filtresi',
    category: 'survival',
    icon: '💧',
    requires: { scrap_metal: 2, crystal_shard: 1 },
    produces: { id: 'water_filter', amount: 1 },
    craftTime: 3,
  },
  alien_ration: {
    id: 'alien_ration',
    name: 'Alien Rasyonu',
    category: 'food',
    icon: '🌿',
    requires: { alien_plant: 3 },
    produces: { id: 'alien_ration', amount: 2 },
    craftTime: 2,
  },
  oxygen_canister: {
    id: 'oxygen_canister',
    name: 'Oksijen Tüpü',
    category: 'survival',
    icon: '🫧',
    requires: { scrap_metal: 3, alien_crystal: 2 },
    produces: { id: 'oxygen_canister', amount: 1 },
    craftTime: 5,
  },

  // ── Araçlar ──
  pickaxe: {
    id: 'pickaxe',
    name: 'Kazma',
    category: 'tool',
    icon: '⛏',
    requires: { scrap_metal: 4, rock: 2 },
    produces: { id: 'pickaxe', amount: 1 },
    craftTime: 6,
  },
  med_kit: {
    id: 'med_kit',
    name: 'Tıbbi Kit',
    category: 'survival',
    icon: '🩹',
    requires: { alien_plant: 2, scrap_metal: 1 },
    produces: { id: 'med_kit', amount: 1 },
    craftTime: 4,
    effect: { health: 50 },
  },

  // ── Silah ──
  plasma_shard: {
    id: 'plasma_shard',
    name: 'Plazma Kıymığı',
    category: 'weapon',
    icon: '⚡',
    requires: { alien_crystal: 3, scrap_metal: 2 },
    produces: { id: 'plasma_shard', amount: 3 },
    craftTime: 4,
  },
}

/** Tüm tarifleri listele */
export function getAllRecipes() {
  return Object.values(RECIPES)
}

/** Kategoriye göre filtrele */
export function getRecipesByCategory(category) {
  return Object.values(RECIPES).filter(r => r.category === category)
}

/**
 * Üretim yapılabilir mi?
 * @param {object} recipe  - RECIPES'ten tarif
 * @param {object} inventory - { itemId: count }
 */
export function canCraft(recipe, inventory) {
  return Object.entries(recipe.requires).every(
    ([item, count]) => (inventory[item] ?? 0) >= count
  )
}

/**
 * Malzemeleri düş, ürünü ekle
 * @returns {{ success: boolean, inventory: object }}
 */
export function craft(recipe, inventory) {
  if (!canCraft(recipe, inventory)) return { success: false, inventory }

  const inv = { ...inventory }
  for (const [item, count] of Object.entries(recipe.requires)) {
    inv[item] = (inv[item] ?? 0) - count
  }
  inv[recipe.produces.id] = (inv[recipe.produces.id] ?? 0) + recipe.produces.amount

  return { success: true, inventory: inv }
}
