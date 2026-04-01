import type { GameState, ShopItem, ItemEffect, Tile } from './types'
import { removeTile } from './pool'

/**
 * Returns true if the player has enough currency to buy the item.
 */
export function canPurchase(state: GameState, item: ShopItem): boolean {
  return state.currency >= item.cost
}

/**
 * Purchases an item if affordable: deducts cost and applies effect.
 * Returns state unchanged if the player cannot afford it.
 * Pure — returns a new GameState.
 */
export function purchaseItem(state: GameState, item: ShopItem): GameState {
  if (!canPurchase(state, item)) return state
  const stateAfterDeduct: GameState = { ...state, currency: state.currency - item.cost }
  return applyItemEffect(stateAfterDeduct, item.effect)
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
 * Applies an item effect to the game state.
 * Pure — returns a new GameState.
 */
export function applyItemEffect(state: GameState, effect: ItemEffect): GameState {
  switch (effect.type) {
    case 'extra_discard':
      return { ...state, maxDiscards: state.maxDiscards + effect.amount }

    case 'score_bonus':
    case 'multiplier_bonus':
    case 'chain_bonus':
    case 'double_boost':
    case 'zero_gravity':
    case 'heavy_lead':
    case 'lead_weight':
    case 'long_link':
    case 'sequential_spark':
    case 'perfect_loop':
    case 'bigger_sack':
    case 'slim_fit': {
      // Store the item in the items list for later use during scoring
      const syntheticItem: ShopItem = {
        id: `${effect.type}-${Date.now()}`,
        name: effect.type === 'score_bonus' ? 'Score Bonus' : 
              effect.type === 'multiplier_bonus' ? 'Multiplier Bonus' :
              effect.type === 'chain_bonus' ? 'Chain Booster' :
              effect.type === 'double_boost' ? 'Double Power' :
              effect.type === 'zero_gravity' ? 'Zero Gravity' :
              effect.type === 'heavy_lead' ? 'Heavy Lead' :
              effect.type === 'lead_weight' ? 'Lead Weight' :
              effect.type === 'long_link' ? 'Long Link' :
              effect.type === 'sequential_spark' ? 'Sequential Spark' :
              effect.type === 'perfect_loop' ? 'Perfect Loop' :
              effect.type === 'bigger_sack' ? 'Bigger Sack' : 'Slim Fit',
        description:
          effect.type === 'score_bonus' ? `+${effect.flat} flat score` :
          effect.type === 'multiplier_bonus' ? `+${effect.amount} multiplier` :
          effect.type === 'chain_bonus' ? `+${effect.amount} chain bonus` :
          effect.type === 'double_boost' ? `+${effect.amount} double power` :
          effect.type === 'zero_gravity' ? 'Zero tiles give +10 pips instead of 7' :
          effect.type === 'heavy_lead' ? 'Tiles with 6 grant +5 flat pips' :
          effect.type === 'lead_weight' ? 'Anchor tile adds its pip value to base score' :
          effect.type === 'long_link' ? `+${effect.amount} chain bonus per tile` :
          effect.type === 'sequential_spark' ? 'Run multiplier is ×2.0 instead of ×1.5' :
          effect.type === 'perfect_loop' ? 'If first tile matches last tile, gain ×1.5 multiplier' :
          effect.type === 'bigger_sack' ? `+${effect.amount} hand size` :
          '+1.2x multiplier per empty hand slot below 5',
        cost: 0,
        effect,
      }
      return { ...state, items: [...state.items, syntheticItem] }
    }

    case 'restore_tile': {
      const tile: Tile = effect.tile
      // Remove first (no-op if not present), then add back to ensure no duplicates
      const poolWithout = removeTile(state.pool, tile)
      return { ...state, pool: [...poolWithout, tile] }
    }
  }
}

/**
 * Returns a fixed set of all possible shop items.
 */
export function getAllShopItems(): ShopItem[] {
  return [
    {
      id: 'extra-discard-1',
      name: 'Extra Discard',
      description: 'Gain 1 additional discard per round.',
      cost: 2,
      effect: { type: 'extra_discard', amount: 1 },
    },
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
      id: 'lead-weight',
      name: 'Lead Weight',
      description: 'Anchor tile adds its full pip value to base score.',
      cost: 2,
      effect: { type: 'lead_weight' },
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
      description: '+1 hand size.',
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
