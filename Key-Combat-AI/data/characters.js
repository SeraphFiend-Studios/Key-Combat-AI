// Characters data for Key Combat AI
// Each entry defines a hero card with base stats and abilities.
// This file attaches the array to the global window object for easy access.

window.charactersData = [
  {
    id: 'hero_fire_knight',
    name: 'Blazing Knight',
    type: 'Attack',
    baseHP: 100,
    baseAttack: 20,
    passive: 'Burning Aura: Adds small burn damage over time',
    key: 'e',
    ultChargeNeeded: 5,
    ultEffect: 'Deals massive fire damage'
  },
  {
    id: 'hero_healer',
    name: 'Sacred Healer',
    type: 'Support',
    baseHP: 80,
    baseAttack: 10,
    passive: 'Heal on Combo: Heals team slightly on perfect combos',
    key: 'r',
    ultChargeNeeded: 4,
    ultEffect: 'Heals entire team to full'
  },
  {
    id: 'hero_shadow_rogue',
    name: 'Shadow Rogue',
    type: 'Attack',
    baseHP: 70,
    baseAttack: 25,
    passive: 'Critical Strike: Chance to deal double damage',
    key: 't',
    ultChargeNeeded: 6,
    ultEffect: 'Unleashes a flurry of strikes'
  },
  {
    id: 'hero_azal',
    name: 'Azal',
    type: 'Attack',
    baseHP: 90,
    baseAttack: 22,
    passive: 'Infernal Surge: Bonus damage when at low HP',
    key: 'y',
    ultChargeNeeded: 5,
    ultEffect: 'Unleashes a burst of flame',
    image: 'assets/images/heroes/Azal_character.png'
  },
  {
    id: 'hero_fyra',
    name: 'Fyra',
    type: 'Support',
    baseHP: 85,
    baseAttack: 15,
    passive: 'Flame Ward: Shields allies briefly',
    key: 'u',
    ultChargeNeeded: 4,
    ultEffect: 'Restores ally health over time',
    image: 'assets/images/heroes/fyra_character.png'
  },
  {
    id: 'hero_lucien',
    name: 'Lucien',
    type: 'Attack',
    baseHP: 95,
    baseAttack: 23,
    passive: 'Blade Dance: Small chance for extra strike',
    key: 'i',
    ultChargeNeeded: 6,
    ultEffect: 'Performs a deadly combo',
    image: 'assets/images/heroes/lucien_character.png'
  },
  {
    id: 'hero_raeni',
    name: 'Raeni',
    type: 'Support',
    baseHP: 75,
    baseAttack: 12,
    passive: 'Wind Blessing: Increases ally speed',
    key: 'o',
    ultChargeNeeded: 5,
    ultEffect: 'Summons a protective gale',
    image: 'assets/images/heroes/raeni_character.png'
  },
  {
    id: 'hero_velra',
    name: 'Velra',
    type: 'Attack',
    baseHP: 100,
    baseAttack: 18,
    passive: 'Stone Skin: Reduces incoming damage slightly',
    key: 'p',
    ultChargeNeeded: 5,
    ultEffect: 'Slams the ground for area damage',
    image: 'assets/images/heroes/velra_character.png'
  },
  {
    id: 'hero_zhae',
    name: 'Zhae',
    type: 'Attack',
    baseHP: 85,
    baseAttack: 26,
    passive: 'Shadowstep: Dodges one attack periodically',
    key: 'a',
    ultChargeNeeded: 6,
    ultEffect: 'Strikes from the shadows',
    image: 'assets/images/heroes/zhae_character.png'
  }
];
