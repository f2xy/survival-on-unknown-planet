# Mimari Referans

## Dizin Yapısı

```
src/
├── data/                          # Merkezi veri tanımları
│   ├── items.js                   # Eşya tanımları (ITEMS)
│   ├── buildings.js               # Bina tanımları (BUILDING_TYPES)
│   ├── balance.js                 # Oyun dengesi sabitleri (DRAIN_RATES, ROVER_DEF, ...)
│   └── ui-labels.js               # UI etiketleri ve çeviri metinleri
│
├── game/
│   ├── engine/
│   │   ├── GameLoop.js            # requestAnimationFrame döngü yöneticisi
│   │   ├── Renderer.js            # Ana renderer (koordinatör)
│   │   ├── InputHandler.js        # Klavye & fare input yönetimi
│   │   └── renderers/
│   │       ├── ColorUtils.js      # Renk yardımcı fonksiyonları
│   │       ├── MapRenderer.js     # Tile/harita çizimi
│   │       ├── BuildingRenderer.js # Bina çizimi (dome, flat, kapsül)
│   │       ├── ResourceRenderer.js # Kaynak düğümü çizimi
│   │       └── PickingSystem.js   # Tıklama tespiti (bina/kaynak)
│   │
│   ├── systems/
│   │   ├── BaseSystem.js          # Bina oluşturma + re-exportlar
│   │   ├── PowerGrid.js           # Güç şebekesi hesaplamaları
│   │   ├── CraftingSystem.js      # Üretim tarifleri ve mantığı
│   │   ├── SurvivalSystem.js      # Hayatta kalma stat yönetimi
│   │   └── RoverSystem.js         # Rover çekirdek mekanikleri
│   │
│   ├── ai/
│   │   └── RoverAI.js             # Otonom rover atama algoritması
│   │
│   ├── world/
│   │   ├── TileTypes.js           # Tile tanımları
│   │   ├── MapGenerator.js        # Prosedürel harita üretimi
│   │   ├── ResourceNodes.js       # Kaynak düğümü dağılımı
│   │   └── DayNightCycle.js       # Gece/gündüz döngüsü
│   │
│   └── utils/
│       ├── IsometricUtils.js      # İzometrik koordinat dönüşümleri
│       ├── NoiseGenerator.js      # Perlin gürültü üreteci
│       └── SaveSystem.js          # localStorage kayıt sistemi
│
├── stores/                        # Pinia state yönetimi
│   ├── gameStore.js               # Oyun durumu (menü/oynuyor/duraklatılmış)
│   ├── playerStore.js             # Oyuncu statları
│   ├── worldStore.js              # Harita & gece/gündüz
│   ├── baseStore.js               # Binalar & güç yönetimi
│   ├── inventoryStore.js          # Envanter & üretim
│   └── roverStore.js              # Rover filosu & otonom yönetim
│
├── components/
│   ├── game/
│   │   ├── GameCanvas.vue         # Canvas rendering & input
│   │   ├── GameHUD.vue            # Ana HUD koordinatörü
│   │   └── GameDialog.vue         # İnşa/duraklat diyalogları
│   │
│   ├── hud/                       # HUD alt bileşenleri
│   │   ├── PowerPanel.vue         # Güç durumu paneli
│   │   ├── StoragePanel.vue       # Depolama & kaynak listesi
│   │   ├── ComputerPanel.vue      # Ana bilgisayar tamir/yükseltme
│   │   ├── RoverFleetPanel.vue    # Rover filo listesi
│   │   ├── RoverInfoPanel.vue     # Rover detay paneli
│   │   ├── RoverBuildDialog.vue   # Rover üretim diyaloğu
│   │   ├── BuildingInfoPanel.vue  # Bina detay paneli
│   │   ├── BottomBar.vue          # Alt bilgi çubuğu
│   │   └── NotificationList.vue   # Bildirim sistemi
│   │
│   ├── ui/
│   │   └── MainMenu.vue           # Başlık ekranı
│   │
│   └── hud/
│       └── StatBar.vue            # Stat çubuğu bileşeni
│
└── assets/styles/
    └── main.css                   # Global stiller (CRT efektleri)
```

## Veri Akışı

```
[data/] ──→ [game/systems/] ──→ [stores/] ──→ [components/]
  │              │                   │
  │              ↓                   ↓
  │         [game/ai/]         [game/engine/]
  │              │                   │
  └──────────────┴───────────────────┘
        Merkezi veri tanımları
```

### Kurallar:
1. `data/` dosyaları hiçbir şey import ETMEZ (saf veri)
2. `game/systems/` modülleri `data/` dosyalarından import eder
3. `stores/` modülleri `data/` ve `game/` dosyalarından import eder
4. `components/` modülleri `stores/` ve `data/` dosyalarından import eder
5. Döngüsel bağımlılık (circular dependency) YASAKTIR

## State Yönetimi (Pinia)

```
gameStore ─── Oyun durumu makinesi (MENU → PLAYING → PAUSED → BUILD → DEPLOY)
  │
  ├── playerStore ─── Hayatta kalma statları (health, hunger, thirst, oxygen, energy)
  ├── worldStore ──── Harita, gece/gündüz, sıcaklık, kaynak düğümleri
  ├── baseStore ───── Binalar, güç şebekesi, bağlantılar
  ├── inventoryStore ── Envanter, üretim
  └── roverStore ──── Rover filosu, otonom yönetim
```

## Render Pipeline

```
GameCanvas.vue
  └── update(delta)        ← Her frame
  └── render(delta, tick)  ← Her frame
        │
        ├── Renderer.clear()
        ├── MapRenderer.draw()
        ├── ResourceRenderer.draw()
        ├── BuildingRenderer.drawConnections()
        ├── BuildingRenderer.drawAll()
        └── Renderer.drawNightOverlay()
```
