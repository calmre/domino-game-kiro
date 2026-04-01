import type { BossModifier, BlindConfig, GameState } from './types'

export const MAX_ANTES = 8

const BOSS_MODIFIERS: BossModifier[] = [
  { type: 'sandpaper', name: 'The Sandpaper', description: 'Run Bonus is disabled this round.' },
  { type: 'lead_weight', name: 'The Lead Weight', description: 'Each hand loses 5 from its base score.' },
  { type: 'frozen_bone', name: 'The Frozen Bone', description: 'Double tiles contribute 0 pips and 0 bonus.' },
]

export function getBossModifier(ante: number): BossModifier {
  return BOSS_MODIFIERS[(ante - 1) % BOSS_MODIFIERS.length]
}

/**
 * Score targets with 1.5x growth rate:
 * Base Target: 600
 * Formula: Target = 600 * (1.5 ^ (ante - 1)) * BlindModifier
 * Blind Modifiers: Small Blind (x1.0), Big Blind (x1.5), Boss Blind (x2.0)
 * Target for Ante 1 Boss should be 1,200
 */
export function getBlindConfig(ante: number, blindIndex: number): BlindConfig {
  const isBoss = blindIndex === 2
  const baseTarget = 600
  const anteMultiplier = Math.pow(1.5, ante - 1)
  const blindMultipliers = [1.0, 1.5, 2.0]
  const targetScore = Math.round(baseTarget * anteMultiplier * blindMultipliers[blindIndex])

  return {
    ante,
    blindIndex,
    targetScore,
    isBoss,
    ...(isBoss ? { bossModifier: getBossModifier(ante) } : {}),
  }
}

export function nextBlind(state: GameState): Partial<GameState> {
  const isLeavingBoss = state.blindIndex === 2
  const newAnte = isLeavingBoss ? state.ante + 1 : state.ante
  const newBlindIndex = isLeavingBoss ? 0 : state.blindIndex + 1
  const config = getBlindConfig(newAnte, newBlindIndex)

  return {
    ante: newAnte,
    blindIndex: newBlindIndex,
    targetScore: config.targetScore,
    bossModifier: config.bossModifier,
  }
}

export const MATCH_LABELS = ['Small Match', 'Big Match', 'Boss Match']
