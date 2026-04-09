import type { GameState, ShopItem, ItemEffect, Tile } from './types'
import { removeTile } from './pool'

/**
 * Returns true if the player has enough currency to buy the item.
 */
export function canPurchase(state: GameState, item: ShopItem): boolean {
  return state.currency >= item.cost
}

/**
 * Purchases an item if affordable: deducts cost and adds item to inventory.
 * Returns state unchanged if the player cannot afford it.
 * Pure — returns a new GameState.
 */
export function purchaseItem(state: GameState, item: ShopItem): GameState {
  if (!canPurchase(state, item)) return state
  
  // Deduct cost and add the ORIGINAL item to inventory
  let newState: GameState = { 
    ...state, 
    currency: state.currency - item.cost,
    items: [...state.items, item]
  }
  
  // Apply immediate effects (like extra_discard)
  if (item.effect.type === 'extra_discard') {
    newState = { ...newState, maxDiscards: newState.maxDiscards + item.effect.amount }
  }
  
  return newState
}

/**
 * Sells an item for half its original cost.
 * Returns state unchanged if the item is not owned.
 * Pure — returns a new GameState.
 */
export function sellItem(state: GameState, item: ShopItem): GameState {
  const itemIndex = state.items.findIndex(i => i.id === item.id)
  if (itemIndex === -1) return state
  
  const sellPrice = Math.floor(item.cost / 2)
  const newItems = state.items.filter((_, i) => i !== itemIndex)
  
  return {
    ...state,
    currency: state.currency + sellPrice,
    items: newItems
  }
}

/**
 * Returns a fixed set of all possible shop items.
 */
export function getAllShopItems(): ShopItem[] {
  return [
    {
      id: 'score-bonus-10',
      name: 'Score Boost',
      description: '+10 flat score added to your final score.',
      cost: 3,
      effect: { type: 'score_bonus', flat: 10 },
    },
    {
      id: 'multiplier-bonus-1',
      name: 'Multiplier Charm',
      description: '+0.5 to your score multiplier.',
      cost: 4,
      effect: { type: 'multiplier_bonus', amount: 0.5 },
    },
    {
      id: 'double-power',
      name: 'Double Power',
      description: 'Doubles give ×1.5 instead of ×1.25.',
      cost: 5,
      effect: { type: 'double_boost', amount: 0.25 },
    },
    {
      id: 'zero-gravity',
      name: 'Zero Gravity',
      description: 'Zero tiles now give +10 pips instead of 7.',
      cost: 5,
      effect: { type: 'zero_gravity' },
    },
    {
      id: 'long-link',
      name: 'Long Link',
      description: 'Chain bonus: +1.5 per tile instead of +1.',
      cost: 6,
      effect: { type: 'long_link', amount: 0.5 },
    },
    {
      id: 'perfect-loop',
      name: 'Perfect Loop',
      description: 'If first tile matches last tile, gain ×2.0 multiplier.',
      cost: 5,
      effect: { type: 'perfect_loop' },
    },
    {
      id: 'bigger-sack',
      name: 'Bigger Sack',
      description: '+1 hand per round.',
      cost: 4,
      effect: { type: 'bigger_sack', amount: 1 },
    },
    {
      id: 'reroll',
      name: 'REROLL!',
      description: '+1 discard per round.',
      cost: 4,
      effect: { type: 'extra_discard', amount: 1 },
    },
    {
      id: 'pip-bonus-0',
      name: 'Blank Blessing',
      description: '+5 base score per tile containing a 0.',
      cost: 4,
      effect: { type: 'pip_bonus', pip: 0 },
    },
    {
      id: 'pip-bonus-1',
      name: 'Ace Edge',
      description: '+5 base score per tile containing a 1.',
      cost: 4,
      effect: { type: 'pip_bonus', pip: 1 },
    },
    {
      id: 'pip-bonus-2',
      name: 'Deuce Drive',
      description: '+5 base score per tile containing a 2.',
      cost: 4,
      effect: { type: 'pip_bonus', pip: 2 },
    },
    {
      id: 'pip-bonus-3',
      name: 'Trey Trick',
      description: '+5 base score per tile containing a 3.',
      cost: 4,
      effect: { type: 'pip_bonus', pip: 3 },
    },
    {
      id: 'pip-bonus-4',
      name: 'Four Force',
      description: '+5 base score per tile containing a 4.',
      cost: 4,
      effect: { type: 'pip_bonus', pip: 4 },
    },
    {
      id: 'pip-bonus-5',
      name: 'Five Fever',
      description: '+5 base score per tile containing a 5.',
      cost: 4,
      effect: { type: 'pip_bonus', pip: 5 },
    },
    {
      id: 'pip-bonus-6',
      name: 'Six Surge',
      description: '+5 base score per tile containing a 6.',
      cost: 4,
      effect: { type: 'pip_bonus', pip: 6 },
    },
    {
      id: 'gold-per-round',
      name: 'Piggy Bank',
      description: '+1 gold at the end of each round.',
      cost: 3,
      effect: { type: 'gold_per_round' },
    },
    {
      id: 'gold-per-pip1',
      name: 'Ace Hustle',
      description: '+1 gold per played tile containing a 1.',
      cost: 3,
      effect: { type: 'gold_per_pip1_tile' },
    },
    {
      id: 'gold-to-score',
      name: 'Midas Touch',
      description: 'Add your current gold to base score.',
      cost: 6,
      effect: { type: 'gold_to_score' },
    },
    {
      id: 'gold-to-multiplier',
      name: 'Compound Interest',
      description: 'Per 5 gold, add ×1.25 to multiplier.',
      cost: 6,
      effect: { type: 'gold_to_multiplier' },
    },
    {
      id: 'lean-machine',
      name: 'Lean Machine',
      description: 'If your hand has 3 or fewer tiles, gain +70 base pips.',
      cost: 4,
      effect: { type: 'lean_machine' },
    },
    {
      id: 'zero-waste',
      name: 'Zero Waste',
      description: 'Finish a hand with 0 discards left: gain $3 and +10 base next hand.',
      cost: 6,
      effect: { type: 'zero_waste' },
    },
    {
      id: 'ghost-pipe',
      name: 'Ghost Pipe',
      description: 'Your anchor pip acts as a Wild for the first tile played.',
      cost: 2,
      effect: { type: 'ghost_pipe' },
    },
    {
      id: 'seventh-son',
      name: 'The 7th Son',
      description: 'Per 3 zero-pips played: +30 flat base. If 6+ zeroes: +100 instead.',
      cost: 6,
      effect: { type: 'seventh_son' },
    },
    {
      id: 'lucky-7',
      name: 'Lucky 7',
      description: 'Each tile that totals exactly 7 (incl. 0=7 rule) earns $1.',
      cost: 2,
      effect: { type: 'lucky_7' },
    },
    {
      id: 'binary-code',
      name: 'Binary Code',
      description: 'If all tiles played are only 0s and 1s, gain ×1.5 total score.',
      cost: 5,
      effect: { type: 'binary_code' },
    },
    {
      id: 'double-or-nothing',
      name: 'Double or Nothing',
      description: 'Doubles give ×2.0, but score is halved if you don\'t Domino!',
      cost: 11,
      effect: { type: 'double_or_nothing' },
    },
    {
      id: 'benchwarmer',
      name: 'Benchwarmer',
      description: 'Each unplayed tile gives ×1.25 to multiplier. Negated by Domino!',
      cost: 4,
      effect: { type: 'benchwarmer' },
    },
    {
      id: 'last-tile-standing',
      name: 'Last Tile Standing',
      description: '+100 base if only 1 tile is played.',
      cost: 3,
      effect: { type: 'last_tile_standing' },
    },
    {
      id: 'held-power',
      name: 'Held Power',
      description: '+10 base per unplayed tile.',
      cost: 3,
      effect: { type: 'held_power' },
    },
    {
      id: 'delayed-investment',
      name: 'Delayed Investment',
      description: '+1 gold per unplayed tile when playing a hand.',
      cost: 2,
      effect: { type: 'delayed_investment' },
    },
    {
      id: 'all-in',
      name: 'All-In',
      description: 'Domino! bonus is ×3.0 instead of ×1.75.',
      cost: 10,
      effect: { type: 'all_in' },
    },
    {
      id: 'phenomenal-evil',
      name: 'Phenomenal Evil',
      description: '+1 permanent base per unplayed tile. Stacks throughout the game.',
      cost: 3,
      effect: { type: 'phenomenal_evil' },
    },
    {
      id: 'extra-finger',
      name: 'Extra Finger',
      description: '+1 hand size.',
      cost: 2,
      effect: { type: 'extra_finger' },
    },
    {
      id: 'weakest-link',
      name: 'Weakest Link',
      description: 'Your unplayed tile with the smallest pip value gives ×2 to base.',
      cost: 3,
      effect: { type: 'weakest_link' },
    },
  ]
}

/**
 * Returns 3 random shop items from the full list.
 */
export function generateRandomShopItems(): ShopItem[] {
  const allItems = getAllShopItems()
  // Shuffle the array and take first 3
  const shuffled = [...allItems].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}
