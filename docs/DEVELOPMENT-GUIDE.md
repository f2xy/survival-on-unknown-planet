# Geliştirme Rehberi

## Yeni Özellik Ekleme Adımları

### 1. Yeni Eşya (Item) Ekleme

1. `src/data/items.js` → `ITEMS` objesine yeni item ekle
2. Üretilebilirse → `src/game/systems/CraftingSystem.js` → `RECIPES`'e tarif ekle
3. Kaynak olarak toplanabilirse → `src/game/world/ResourceNodes.js` → `RESOURCE_TYPES`'a ekle
4. Kullanım efekti varsa → item tanımındaki `effects` objesini doldur

### 2. Yeni Bina Ekleme

1. `src/data/buildings.js` → `BUILDING_TYPES` objesine yeni bina ekle
2. Özel render gerekiyorsa → `src/game/engine/renderers/BuildingRenderer.js`'e metod ekle
3. Özel mekanik gerekiyorsa → `src/game/systems/` altına yeni sistem dosyası oluştur
4. Güç üretiyorsa/tüketiyorsa → `powerGen` / `powerUse` alanlarını doldur
5. Yükseltme varsa → `upgrades` dizisini tanımla

### 3. Yeni Rover Seviyesi Ekleme

1. `src/data/balance.js` → `ROVER_DEF.levels` dizisine yeni seviye ekle
2. Gerekirse `upgradeCost` tanımla

### 4. Yeni AI Stratejisi Ekleme

1. `src/data/balance.js` → `COMPUTER_STRATEGIES` dizisine yeni strateji ekle
2. `src/game/ai/RoverAI.js` → `computePriorities()` fonksiyonuna yeni stratejiye ait sıralama ekle

### 5. Yeni HUD Paneli Ekleme

1. `src/components/hud/` altına yeni `.vue` dosyası oluştur
2. `src/components/game/GameHUD.vue`'da import et ve template'e ekle
3. Stil için uygun CSS sınıflarını scoped style'a ekle

### 6. Yeni Render Katmanı Ekleme

1. `src/game/engine/renderers/` altına yeni renderer dosyası oluştur
2. `src/game/engine/Renderer.js`'de import et ve metod ekle
3. `src/components/game/GameCanvas.vue` → `render()` fonksiyonunda çağır

## Denge Ayarlama

Tüm oyun dengesi sabitleri `src/data/balance.js` dosyasında merkezileştirilmiştir:

| Sabit | Açıklama | Dosya |
|-------|----------|-------|
| `DRAIN_RATES` | Hayatta kalma stat azalma hızları | balance.js |
| `ROVER_DEF` | Rover maliyetleri, hızları, kapasiteleri | balance.js |
| `COMPUTER_ROVER_LIMITS` | Bilgisayar seviyesine göre rover limitleri | balance.js |
| `BASE_STORAGE_CAPACITY` | Varsayılan depolama kapasitesi | balance.js |
| `BUILD_RATE` | Bina inşa hızı | balance.js |
| `DAY_DURATION` | Tam gün süresi (saniye) | balance.js |
| `STARTING_INVENTORY` | Başlangıç envanteri | balance.js |

## Import Kuralları

```
data/          → Hiçbir şey import ETMEZ (saf veri)
game/systems/  → data/ dosyalarından import eder
game/ai/       → data/ ve game/systems/ dosyalarından import eder
game/engine/   → data/ ve game/ dosyalarından import eder
stores/        → data/, game/systems/, game/ai/ dosyalarından import eder
components/    → stores/ ve data/ dosyalarından import eder
```

**YASAK:** Döngüsel bağımlılık (A→B→A)

## Dosya Adlandırma Kuralları

| Tür | Kural | Örnek |
|-----|-------|-------|
| Vue bileşeni | PascalCase | `PowerPanel.vue` |
| JS modülü | PascalCase | `RoverAI.js` |
| Veri dosyası | kebab-case | `ui-labels.js` |
| Store | camelCase | `roverStore.js` |

## Test Stratejisi

Şu an test altyapısı yoktur. Eklenmesi önerilen:

1. **Unit testler** → `game/systems/`, `game/ai/`, `data/` dosyaları için (Vitest)
2. **Component testler** → `components/hud/` bileşenleri için (Vue Test Utils)
3. **E2E testler** → Tam oyun akışı için (Playwright veya Cypress)

## Gelecek Özellik Önerileri

- [ ] Ses sistemi (ambient, efektler, müzik)
- [ ] Mobil dokunmatik kontroller
- [ ] Zorluk seviyeleri (balance.js sabitleri ile kolay entegrasyon)
- [ ] Erişilebilirlik (ekran okuyucu, renk körlüğü modu)
- [ ] Çoklu dil desteği (ui-labels.js temelli)
- [ ] Teknoloji ağacı (RESEARCH_LAB genişletmesi)
- [ ] Alien düşman sistemi (savaş mekaniği)
- [ ] Hava durumu olayları (fırtına, meteor yağmuru)
- [ ] Oyuncu hareketi ve keşif mekaniği
- [ ] Kaçış/kurtarma son hedef sistemi
