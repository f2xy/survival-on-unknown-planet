/**
 * UI etiketleri ve çeviri sabitleri
 *
 * Gelecekte çoklu dil desteği (i18n) eklenecekse bu dosya temel alınır.
 * Tüm kullanıcıya görünen metinler burada merkezileştirilmiştir.
 */

// ── Rover durumları ────────────────────────────────────────────────────────

export const ROVER_STATUS_LABELS = {
  idle:       'BEKLEMEDE',
  deploying:  'GÖNDERILIYOR',
  collecting: 'TOPLUYOR',
  returning:  'DÖNÜYOR',
  damaged:    'ARIZALI',
  destroyed:  'YOK EDİLDİ',
  building:   'İNŞA EDİLİYOR',
}

export function getRoverStatusLabel(status) {
  return ROVER_STATUS_LABELS[status] ?? status.toUpperCase()
}

// ── Gün fazları ────────────────────────────────────────────────────────────

export const PHASE_LABELS = {
  DAWN:  'Şafak',
  DAY:   'Gündüz',
  DUSK:  'Alacakaranlık',
  NIGHT: 'Gece',
  LATE:  'Gece Yarısı',
}

// ── Bildirim mesajları ─────────────────────────────────────────────────────

export const NOTIFICATIONS = {
  // Oyun başlangıcı
  GAME_START_WARNING:   'Kurtarma kapsülü aktif — Ana Bilgisayar hasarlı!',
  GAME_START_MISSION:   'İlk görev: Bilgisayarı tamir et → roverlar otonom moda geçer.',
  BASE_LOADED:          'Üs yeniden aktif edildi.',
  SAVE_SUCCESS:         'Üs verileri kaydedildi.',
  SAVE_FAILED:          'Kayıt başarısız!',

  // Bilgisayar
  COMPUTER_REPAIRED:    'Ana Bilgisayar tamir edildi! Roverlar otonom moda geçiyor...',
  COMPUTER_NEED_REPAIR: 'Ana Bilgisayar tamir edilmeli!',
  COMPUTER_MAX_LEVEL:   'Ana Bilgisayar maksimum seviyede!',

  // Rover
  ROVER_CAPACITY_FULL:  (max) => `Bilgisayar kapasitesi dolu! (max ${max} rover)`,
  ROVER_BUILD_START:    (name) => `${name} inşa başladı...`,
  ROVER_BUILD_DONE:     (name) => `${name} hazır!`,
  ROVER_DEPLOYED:       (name, type) => `${name} göreve çıktı → ${type}`,
  ROVER_RECALLED:       (name) => `${name} geri çağrıldı.`,
  ROVER_REPAIRED:       (name) => `${name} onarıldı.`,
  ROVER_UPGRADED:       (name, level) => `${name} Seviye ${level}'e yükseltildi!`,
  ROVER_RETURNED:       (name, summary) => `${name} döndü → ${summary}`,
  ROVER_EMERGENCY:      (name) => `⚙ ${name}: Acil sistem kurtarması gerçekleşti.`,

  // Genel
  INSUFFICIENT_RESOURCES: 'Yetersiz kaynak!',
  STORAGE_FULL:           'Depo dolu! Önce yer aç.',
  STORAGE_OVERFLOW:       'Depo dolu! Kaynaklar alınamadı.',
  RESOURCE_DEPLETED:      'Kaynak tükendi!',
  SELECT_TARGET:          'Hedef kaynak noktasına tıklayın.',
  UPGRADE_INSUFFICIENT:   'Yükseltme için yetersiz kaynak!',
  REPAIR_INSUFFICIENT:    'Tamir için yetersiz kaynak!',
  REPAIR_SCRAP_NEEDED:    'Onarım için yetersiz hurda metal!',
  MAX_LEVEL:              'Maksimum seviye!',
}

// ── Klavye kısayolları yardım metni ────────────────────────────────────────

export const KEYBOARD_HELP = 'WASD: Kamera | B: İnşa | HOME: Üsse Dön | F5: Kaydet | ESC: Duraklat'
