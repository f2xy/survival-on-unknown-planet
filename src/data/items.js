/**
 * Item (eşya) tanımları — oyundaki tüm toplanabilir/üretilebilir eşyalar
 *
 * Her item şu alanları içerir:
 *   id           {string}  Benzersiz tanımlayıcı (key ile aynı)
 *   name         {string}  Türkçe görünen ad
 *   icon         {string}  Emoji ikon
 *   stackable    {boolean} Yığılabilir mi
 *   maxStack     {number}  Maksimum yığın miktarı
 *   effects      {object}  Kullanım etkileri { health, hunger, thirst, oxygen, energy }
 *   tool         {string}  Araç tipi (mine, harvest, ...)
 *   weapon       {boolean} Silah mı
 *   damage       {number}  Silah hasarı
 *   uses         {number}  Kullanım hakkı (tek kullanımlık eşyalar için)
 */
export const ITEMS = {
  scrap_metal: {
    id: 'scrap_metal',
    name: 'Hurda Metal',
    icon: '🔩',
    stackable: true,
    maxStack: 50,
  },
  crystal_shard: {
    id: 'crystal_shard',
    name: 'Kristal Kırık',
    icon: '💠',
    stackable: true,
    maxStack: 30,
  },
  alien_plant: {
    id: 'alien_plant',
    name: 'Alien Bitkisi',
    icon: '🌿',
    stackable: true,
    maxStack: 20,
    effects: { hunger: 15 },
  },
  alien_crystal: {
    id: 'alien_crystal',
    name: 'Alien Kristali',
    icon: '🔷',
    stackable: true,
    maxStack: 20,
  },
  rock: {
    id: 'rock',
    name: 'Kaya Parçası',
    icon: '🪨',
    stackable: true,
    maxStack: 99,
  },
  water_filter: {
    id: 'water_filter',
    name: 'Su Filtresi',
    icon: '💧',
    stackable: false,
    uses: 5,
    effects: { thirst: 40 },
  },
  alien_ration: {
    id: 'alien_ration',
    name: 'Alien Rasyonu',
    icon: '🍱',
    stackable: true,
    maxStack: 10,
    effects: { hunger: 50 },
  },
  oxygen_canister: {
    id: 'oxygen_canister',
    name: 'Oksijen Tüpü',
    icon: '🫧',
    stackable: true,
    maxStack: 5,
    effects: { oxygen: 60 },
  },
  med_kit: {
    id: 'med_kit',
    name: 'Tıbbi Kit',
    icon: '🩹',
    stackable: true,
    maxStack: 5,
    effects: { health: 50 },
  },
  pickaxe: {
    id: 'pickaxe',
    name: 'Kazma',
    icon: '⛏',
    stackable: false,
    tool: 'mine',
  },
  plasma_shard: {
    id: 'plasma_shard',
    name: 'Plazma Kıymığı',
    icon: '⚡',
    stackable: true,
    maxStack: 30,
    weapon: true,
    damage: 25,
  },
}

/** Item ID'ye göre ikon döndürür */
export function getItemIcon(id) { return ITEMS[id]?.icon ?? '?' }

/** Item ID'ye göre isim döndürür */
export function getItemName(id) { return ITEMS[id]?.name ?? id }
