import type { Chain, GameState, Hand, ScoringResult, BossModifier, Tile, ShopItem } from './types'
import { calculateBaseScore, calculateMultiplier, calculateFinalScore } from './scoring'
import { checkAnchorMatch, calculateHandPenalty } from './anchor'

export function canDiscard(state: GameState & { debugMode?: boolean }): boolean {
  if (state.debugMode) return true
  return state.discardCount < state.maxDiscards
}

export function canEndRound(chain: Chain): boolean {
  return chain.tiles.length >= 1
}

export function isRoundOver(
  hand: Hand,
  _chain: Chain,
  discardCount: number,
  maxDiscards: number
): boolean {
  return hand.length === 0 && discardCount >= maxDiscards
}

export function evaluateRound(chain: Chain, targetScore: number, bossModifier?: BossModifier, items: ShopItem[] = []): ScoringResult {
  const baseScore = calculateBaseScore(chain, bossModifier, items, null)
  const multiplier = calculateMultiplier(chain, bossModifier, false, items, 0)
  const finalScore = calculateFinalScore(chain, bossModifier, false, items, null, 0)
  const cleared = finalScore >= targetScore
  return { baseScore, multiplier, finalScore, cleared, goldEarned: 0, bonusGoldMidHand: 0 }
}

/**
 * Evaluate a round with Domino Soul rules (anchor system)
 * Returns scoring result and gold earned
 */
export function evaluateRoundWithAnchor(
  chain: Chain, 
  hand: Hand,
  anchorTile: Tile | null,
  targetScore: number, 
  bossModifier?: BossModifier,
  items: ShopItem[] = [],
  handsPlayed: number = 0,
  maxHands: number = 3,
  currency: number = 0,
  discardCount: number = 0,
  maxDiscards: number = 2,
  zeroWasteBonus: number = 0,
  ghostPipeActive: boolean = false
): ScoringResult {
  const chainCopy = {
    ...chain,
    tiles: chain.tiles.map(tile => ({...tile}))
  }

  // ghost_pipe: if active, first tile never causes a broken link regardless of anchor
  let hasAnchorMismatch = false
  if (anchorTile && chainCopy.tiles.length > 0) {
    const firstTile = chainCopy.tiles[0].tile
    if (!checkAnchorMatch(anchorTile, firstTile)) {
      if (ghostPipeActive && items.some(i => i.effect.type === 'ghost_pipe')) {
        // Wild connection — no broken link
      } else {
        hasAnchorMismatch = true
        chainCopy.tiles[0].brokenLink = true
      }
    }
  }

  const hasDominoBonus = hand.length === 0

  const baseScore = calculateBaseScore(chainCopy, bossModifier, items, anchorTile, currency, hand.length)
  const multiplier = calculateMultiplier(chainCopy, bossModifier, hasDominoBonus, items, hand.length, anchorTile, currency)
  const finalScore = Math.floor(baseScore * multiplier.total) + zeroWasteBonus
  const cleared = finalScore >= targetScore

  // gold_per_pip1_tile and lucky_7: mid-hand gold (applied between hands, not at round end)
  let bonusGoldMidHand = 0
  if (items.some(i => i.effect.type === 'gold_per_pip1_tile')) {
    for (const pt of chainCopy.tiles) {
      if (pt.brokenLink) continue
      if (pt.tile.left === 1 || pt.tile.right === 1) bonusGoldMidHand++
    }
  }
  if (items.some(i => i.effect.type === 'lucky_7')) {
    for (const pt of chainCopy.tiles) {
      if (pt.brokenLink) continue
      const l = pt.tile.left === 0 ? 7 : pt.tile.left
      const r = pt.tile.right === 0 ? 7 : pt.tile.right
      if (l + r === 7) bonusGoldMidHand++
    }
  }

  // zero_waste: triggers when all discards used up — +$3 gold, +10 base next hand (unless cleared)
  const zeroWasteTriggered = items.some(i => i.effect.type === 'zero_waste') && discardCount >= maxDiscards && !cleared
  const zeroWasteGold = zeroWasteTriggered ? 3 : 0

  const handsRemaining = maxHands - handsPlayed
  const goldEarned = 1 + handsRemaining + zeroWasteGold

  return {
    baseScore,
    multiplier: {
      ...multiplier,
      brokenLinks: multiplier.brokenLinks + (hasAnchorMismatch ? 1 : 0)
    },
    finalScore,
    cleared,
    goldEarned,
    zeroWasteTriggered,
    bonusGoldMidHand,
  }
}
