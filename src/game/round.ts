import type { Chain, GameState, Hand, ScoringResult, BossModifier, Tile } from './types'
import { calculateBaseScore, calculateMultiplier, calculateFinalScore } from './scoring'
import { checkAnchorMatch, calculateHandPenalty } from './anchor'

export function canDiscard(state: GameState): boolean {
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
  return { baseScore, multiplier, finalScore, cleared }
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
  maxHands: number = 3
): ScoringResult {
  // Create a copy of the chain to avoid modifying the original
  const chainCopy = {
    ...chain,
    tiles: chain.tiles.map(tile => ({...tile}))
  }
  
  // Check if first tile matches anchor (if there is an anchor)
  let hasAnchorMismatch = false
  if (anchorTile && chainCopy.tiles.length > 0) {
    const firstTile = chainCopy.tiles[0].tile
    if (!checkAnchorMatch(anchorTile, firstTile)) {
      hasAnchorMismatch = true
      // Force a broken link at the start if anchor doesn't match
      chainCopy.tiles[0].brokenLink = true
    }
  }
  
  // Check for 'Domino!' bonus (empty hand)
  const hasDominoBonus = hand.length === 0
  
  // Calculate base score (no hand penalty)
  const baseScore = calculateBaseScore(chainCopy, bossModifier, items, anchorTile)
  
  // Calculate multiplier with Domino Soul rules (handEmpty parameter for Domino bonus)
  const multiplier = calculateMultiplier(chainCopy, bossModifier, hasDominoBonus, items, hand.length)
  
  // Calculate final score (Domino bonus already applied in calculateMultiplier)
  const finalScore = Math.floor(baseScore * multiplier.total)
  const cleared = finalScore >= targetScore
  
  // Calculate gold earned: +1 base + hands remained
  const handsRemaining = maxHands - handsPlayed
  const baseGold = 1
  const goldEarned = baseGold + handsRemaining
  
  return { 
    baseScore, 
    multiplier: {
      ...multiplier,
      brokenLinks: multiplier.brokenLinks + (hasAnchorMismatch ? 1 : 0)
    }, 
    finalScore, 
    cleared,
    goldEarned
  }
}
