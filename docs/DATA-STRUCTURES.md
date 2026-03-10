# Veri Yapıları Referansı

## Item (Eşya)

```javascript
// Tanım: src/data/items.js → ITEMS
{
  id:         string,     // Benzersiz tanımlayıcı ('scrap_metal', 'alien_plant', ...)
  name:       string,     // Görünen ad ('Hurda Metal')
  icon:       string,     // Emoji ikon ('🔩')
  stackable:  boolean,    // Yığılabilir mi
  maxStack:   number,     // Maksimum yığın (50, 30, 20, ...)
  effects?: {             // Kullanım etkileri (isteğe bağlı)
    health?: number,
    hunger?: number,
    thirst?: number,
    oxygen?: number,
    energy?: number,
  },
  tool?:     string,      // Araç tipi ('mine', 'harvest')
  weapon?:   boolean,     // Silah mı
  damage?:   number,      // Silah hasarı
  uses?:     number,      // Kullanım hakkı
}
```

**Mevcut item'lar:** scrap_metal, crystal_shard, alien_plant, alien_crystal, rock, water_filter, alien_ration, oxygen_canister, med_kit, pickaxe, plasma_shard

## Building (Bina)

```javascript
// Tanım: src/data/buildings.js → BUILDING_TYPES
{
  id:               string,   // 'RESCUE_CAPSULE', 'POWER_GENERATOR', ...
  name:             string,   // 'Kurtarma Kapsülü'
  desc:             string,   // Açıklama metni
  icon:             string,   // Emoji ikon
  tileW:            number,   // Tile genişliği (2-4)
  tileH:            number,   // Tile yüksekliği (2-3)
  drawH:            number,   // Render yüksekliği (px)
  flat?:            boolean,  // Düz panel render (dome yerine)
  color: {
    top:    string,           // Hex renk — üst yüz
    sideL:  string,           // Sol yan yüz
    sideR:  string,           // Sağ yan yüz
    accent: string,           // Vurgu rengi (glow, çizgiler)
  },
  isCore?:          boolean,  // Merkez bina (Kurtarma Kapsülü)
  isDecoration?:    boolean,  // Dekoratif (Gemi Enkazı)
  isStarting?:      boolean,  // Başlangıç binası (inşa menüsünde gizli)
  buildCost?:       object,   // { itemId: miktar } veya null
  powerGen?:        number,   // Güç üretimi
  powerUse?:        number,   // Güç tüketimi
  storageCapacity?: number,   // Depolama bonusu
  connectionRadius?: number,  // Bağlantı menzili (tile)
  maxLevel?:        number,   // Maks yükseltme seviyesi
  upgrades?: [{               // Yükseltme dizisi
    level: number,
    cost:  { itemId: miktar },
    bonus: { ... },
  }],
  repairCost?:      object,   // Tamir maliyeti (MAIN_COMPUTER)
  salvageYield?:    object,   // Sökme verimi (CRASHED_SHIP)
}
```

**Mevcut binalar:** RESCUE_CAPSULE, CRASHED_SHIP, POWER_GENERATOR, STORAGE_MODULE, MAIN_COMPUTER, LIFE_SUPPORT, RESEARCH_LAB, SOLAR_PANEL

## Building Instance (Runtime)

```javascript
// Oluşturucu: src/game/systems/BaseSystem.js → createBuilding()
{
  id:                string,   // Benzersiz ID ('b_1234_abc')
  type:              string,   // BUILDING_TYPES anahtarı
  tx:                number,   // Tile X koordinatı
  ty:                number,   // Tile Y koordinatı
  level:             number,   // Mevcut seviye (1-3)
  health:            number,   // Mevcut sağlık
  maxHealth:         number,   // Maksimum sağlık
  salvaged:          boolean,  // Sökülmüş mü (CRASHED_SHIP)
  constructing:      boolean,  // İnşa halinde mi
  constructProgress: number,   // İnşa ilerlemesi (0-100)
  repaired?:         boolean,  // Tamir edilmiş mi (MAIN_COMPUTER)
}
```

## Rover

```javascript
// Tanım: src/data/balance.js → ROVER_DEF
{
  buildCost:           object,  // { scrap_metal: 8, crystal_shard: 3 }
  buildTime:           number,  // 20 saniye
  breakdownChance:     number,  // 0.006 sn başına
  attackVulnerability: number,  // 0.5
  levels: [{
    level:       number,
    speed:       number,
    capacity:    number,
    durability:  number,
    collectRate: number,
    powerUse:    number,
    upgradeCost?: object,
  }],
}
```

## Rover Instance (Runtime)

```javascript
// Oluşturucu: src/game/systems/RoverSystem.js → createRover()
{
  id:             string,   // 'r_1234_abc'
  type:           string,   // 'ROVER'
  level:          number,   // 1-3
  name:           string,   // 'Alfa', 'Beta', ...
  status:         string,   // idle | deploying | collecting | returning | damaged | destroyed | building
  mode:           string,   // 'auto' | 'manual'
  health:         number,
  maxHealth:      number,
  capacity:       number,
  resources:      object,   // { resourceType: amount }
  resourcesTotal: number,
  mission?:       object,   // Aktif görev bilgisi (aşağıda)
  buildProgress:  number,   // İnşa ilerlemesi (0-100)
  buildTimeLeft:  number,   // Kalan inşa süresi (saniye)
}
```

## Rover Mission (Görev)

```javascript
{
  nodeId:          string,   // Hedef kaynak düğümü ID
  targetX:         number,   // Hedef tile X
  targetY:         number,   // Hedef tile Y
  resourceType:    string,   // Kaynak türü
  distance:        number,   // Üsse mesafe (tile)
  travelProgress:  number,   // Yolculuk ilerlemesi (0-100)
  collectProgress: number,   // Toplama ilerlemesi (0-100)
  bonusResources:  number,   // Ek kaynak bonusu (olaydan)
}
```

## Resource Node (Kaynak Düğümü)

```javascript
// Oluşturucu: src/game/world/ResourceNodes.js → generateResourceNodes()
{
  id:          string,   // 'node_1', 'node_2', ...
  type:        string,   // 'scrap_metal', 'crystal_shard', ...
  tx:          number,   // Tile X
  ty:          number,   // Tile Y
  totalAmount: number,   // Başlangıç miktarı (30-100)
  remaining:   number,   // Kalan miktar
}
```

## Tile

```javascript
// Tanım: src/game/world/TileTypes.js → TILE
{
  id:        number,   // 0-10 arası sayısal ID
  name:      string,   // 'void', 'alien_grass', 'water', ...
  passable:  boolean,  // Geçilebilir mi
  color:     string,   // Hex renk
  hazard?:   string,   // 'cold', 'fire', 'toxic'
  special?:  string,   // 'spawn'
  noiseRange?: [number, number], // Noise değer aralığı
}
```

## Map (Harita)

```javascript
// Oluşturucu: src/game/world/MapGenerator.js
{
  seed:   number,       // Rastgele tohum
  width:  number,       // 64
  height: number,       // 64
  tiles:  number[][],   // [y][x] → tile ID
  spawnX: number,       // Doğma noktası X
  spawnY: number,       // Doğma noktası Y
}
```

## Day/Night Cycle

```javascript
// Sınıf: src/game/world/DayNightCycle.js
{
  elapsed:   number,   // Geçen süre (saniye)
  dayNumber: number,   // Mevcut gün numarası

  // Hesaplanan (getter):
  progress:    number, // 0-1 arası gün içi konum
  phase:       object, // { key, name, start, end }
  darkness:    number, // 0 (aydınlık) - 0.45 (karanlık)
  temperature: number, // -18°C ile +42°C arası
  isNight:     boolean,
}
```

## Crafting Recipe (Üretim Tarifi)

```javascript
// Tanım: src/game/systems/CraftingSystem.js → RECIPES
{
  id:        string,   // 'water_filter', 'pickaxe', ...
  name:      string,   // Görünen ad
  category:  string,   // 'survival', 'food', 'tool', 'weapon'
  icon:      string,   // Emoji ikon
  requires:  object,   // { itemId: miktar }
  produces:  { id: string, amount: number },
  craftTime: number,   // Üretim süresi (saniye)
  effect?:   object,   // Doğrudan etki (med_kit)
}
```

## Save Data Formatı

```javascript
// localStorage'a kaydedilen veri yapısı
{
  world: {
    seed:     number,
    tiles:    number[][],
    dayNight: { elapsed, dayNumber },
    nodes:    ResourceNode[],
  },
  base: {
    buildings:   BuildingInstance[],
    connections: [{ from, to }],
  },
  inventory: { itemId: count },
  rovers: {
    rovers:          RoverInstance[],
    computerStrategy: string,
  },
  survivedDays: number,
}
```
