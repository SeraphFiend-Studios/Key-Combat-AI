// Boons data for Key Combat AI
// Define boons offered by gods (pure benefits) and demons (trade-offs).

window.boonsData = {
  gods: [
    {
      id: 'god_power',
      name: 'Blessing of Power',
      effect: 'Increase all heroes\' attack by 20%'
    },
    {
      id: 'god_speed',
      name: 'Blessing of Speed',
      effect: 'Reduce key timing windows, making combos easier'
    },
    {
      id: 'god_resilience',
      name: 'Blessing of Resilience',
      effect: 'Increase heroes\' HP by 20%'
    }
  ],
  demons: [
    {
      id: 'demon_tradeoff_attack',
      name: 'Pact of Fury',
      effect: 'Increase damage by 30%, but reduce max HP by 10%'
    },
    {
      id: 'demon_tradeoff_speed',
      name: 'Pact of Haste',
      effect: 'Increase attack speed, but enemies also gain speed'
    }
  ]
};