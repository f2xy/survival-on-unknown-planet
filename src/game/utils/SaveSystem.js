/**
 * LocalStorage save/load sistemi
 */

const SAVE_KEY = 'sup_save_v1'  // survival-unknown-planet

export const SaveSystem = {
  save(state) {
    try {
      const data = JSON.stringify({ ...state, savedAt: Date.now() })
      localStorage.setItem(SAVE_KEY, data)
      return true
    } catch (e) {
      console.warn('[SaveSystem] Kayıt başarısız:', e)
      return false
    }
  },

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (!raw) return null
      return JSON.parse(raw)
    } catch (e) {
      console.warn('[SaveSystem] Yükleme başarısız:', e)
      return null
    }
  },

  hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null
  },

  deleteSave() {
    localStorage.removeItem(SAVE_KEY)
  },

  getSaveInfo() {
    const data = this.load()
    if (!data) return null
    return {
      savedAt: new Date(data.savedAt).toLocaleString('tr-TR'),
      day: data.world?.day ?? 1,
      playerName: data.player?.name ?? 'Gezgin'
    }
  }
}
