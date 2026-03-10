import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { RECIPES, canCraft, craft } from '@/game/systems/CraftingSystem.js'
import { useBaseStore } from './baseStore.js'
import { ITEMS } from '@/data/items.js'

// Geriye dönük uyumluluk re-export
export { ITEMS } from '@/data/items.js'

export const useInventoryStore = defineStore('inventory', () => {
  // { itemId: quantity }
  const items = ref({
    scrap_metal: 3,
    rock: 5,
    alien_plant: 2,
  })

  const MAX_SLOTS = 20
  const slotCount  = computed(() => Object.keys(items.value).length)
  const isFull     = computed(() => slotCount.value >= MAX_SLOTS)
  const totalCount = computed(() => Object.values(items.value).reduce((s, v) => s + v, 0))

  function add(itemId, amount = 1) {
    const base = useBaseStore()
    const cap  = base.storageCapacity
    const free = Math.max(0, cap - totalCount.value)
    if (free <= 0) return false
    const toAdd = Math.min(amount, free)
    if (!(itemId in items.value) && isFull.value) return false
    items.value[itemId] = (items.value[itemId] ?? 0) + toAdd
    return true
  }

  function remove(itemId, amount = 1) {
    if ((items.value[itemId] ?? 0) < amount) return false
    items.value[itemId] -= amount
    if (items.value[itemId] <= 0) delete items.value[itemId]
    return true
  }

  function has(itemId, amount = 1) {
    return (items.value[itemId] ?? 0) >= amount
  }

  function craftItem(recipeId) {
    const recipe = RECIPES[recipeId]
    if (!recipe) return { success: false, msg: 'Bilinmeyen tarif' }
    if (!canCraft(recipe, items.value)) return { success: false, msg: 'Yetersiz malzeme' }

    const result = craft(recipe, items.value)
    if (result.success) {
      items.value = result.inventory
      return { success: true, msg: `${recipe.name} üretildi!` }
    }
    return { success: false, msg: 'Üretim başarısız' }
  }

  /** Bir eşyayı kullan (yiyecek/içecek/kit) */
  function useItem(itemId) {
    const def = ITEMS[itemId]
    if (!def) return null
    if (!has(itemId)) return null
    remove(itemId, 1)
    return def  // caller consume() çağırır
  }

  function getAvailableRecipes() {
    return Object.values(RECIPES).map(r => ({
      ...r,
      craftable: canCraft(r, items.value)
    }))
  }

  function toJSON() { return { ...items.value } }
  function fromJSON(data) { if (data) items.value = { ...data } }

  return {
    items, slotCount, isFull, totalCount,
    add, remove, has, craftItem, useItem,
    getAvailableRecipes, toJSON, fromJSON
  }
})
