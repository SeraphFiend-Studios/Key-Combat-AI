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
  }
];