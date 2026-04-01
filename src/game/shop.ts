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
      cost: 6,
      effect: { type: 'double_boost', amount: 0.25 },
    },
    {
      id: 'zero-gravity',
      name: 'Zero Gravity',
      description: 'Zero tiles now give +10 pips instead of 7.',
      cost: 6,
      effect: { type: 'zero_gravity' },
    },
    {
      id: 'heavy-lead',
      name: 'Heavy Lead',
      description: 'Any tile with a 6 on it grants +5 flat pips.',
      cost: 5,
      effect: { type: 'heavy_lead' },
    },
    {
      id: 'long-link',
      name: 'Long Link',
      description: 'Chain bonus: +1.5 per tile instead of +1.',
      cost: 6,
      effect: { type: 'long_link', amount: 0.5 },
    },
    {
      id: 'sequential-spark',
      name: 'Sequential Spark',
      description: 'Run multiplier is ×2.0 instead of ×1.5.',
      cost: 7,
      effect: { type: 'sequential_spark' },
    },
    {
      id: 'perfect-loop',
      name: 'Perfect Loop',
      description: 'If first tile matches last tile, gain ×1.5 multiplier.',
      cost: 8,
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
      id: 'slim-fit',
      name: 'Slim Fit',
      description: '+1.2x multiplier per empty hand slot below 5.',
      cost: 4,
      effect: { type: 'slim_fit' },
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
