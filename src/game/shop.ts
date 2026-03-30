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
 * Applies an item effect to the game state.
 * Pure — returns a new GameState.
 */
export function applyItemEffect(state: GameState, effect: ItemEffect): GameState {
  switch (effect.type) {
    case 'extra_discard':
      return { ...state, maxDiscards: state.maxDiscards + effect.amount }

    case 'score_bonus':
    case 'multiplier_bonus': {
      // Not applicable mid-round; store the item in the items list for later use
      // We need to reconstruct a ShopItem-like entry — store as a synthetic item
      const syntheticItem: ShopItem = {
        id: `${effect.type}-${Date.now()}`,
        name: effect.type === 'score_bonus' ? 'Score Bonus' : 'Multiplier Bonus',
        description:
          effect.type === 'score_bonus'
            ? `+${effect.flat} flat score`
            : `+${effect.amount} multiplier`,
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
 * Returns a fixed set of shop items available for purchase.
 */
export function generateShopItems(): ShopItem[] {
  return [
    {
      id: 'extra-discard-1',
      name: 'Extra Discard',
      description: 'Gain 1 additional discard per round.',
      cost: 3,
      effect: { type: 'extra_discard', amount: 1 },
    },
    {
      id: 'score-bonus-5',
      name: 'Score Boost',
      description: '+5 flat score added to your final score.',
      cost: 4,
      effect: { type: 'score_bonus', flat: 5 },
    },
    {
      id: 'multiplier-bonus-1',
      name: 'Multiplier Charm',
      description: '+1 to your score multiplier.',
      cost: 5,
      effect: { type: 'multiplier_bonus', amount: 1 },
    },
    {
      id: 'restore-tile-00',
      name: 'Reclaim [0|0]',
      description: 'Restore the [0|0] double-blank tile to the pool.',
      cost: 2,
      effect: { type: 'restore_tile', tile: { left: 0, right: 0, id: '0-0' } },
    },
  ]
}
