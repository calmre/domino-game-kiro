import type { Chain, GameState, Hand, ScoringResult, BossModifier } from './types'
import { calculateBaseScore, calculateMultiplier, calculateFinalScore } from './scoring'

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

export function evaluateRound(chain: Chain, targetScore: number, bossModifier?: BossModifier): ScoringResult {
  const baseScore = calculateBaseScore(chain, bossModifier)
  const multiplier = calculateMultiplier(chain, bossModifier)
  const finalScore = calculateFinalScore(chain, bossModifier)
  const cleared = finalScore >= targetScore
  return { baseScore, multiplier, finalScore, cleared }
}
