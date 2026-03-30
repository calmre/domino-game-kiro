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
 * Score targets:
 * Small Blind (index 0): 300 * 2.5^(ante-1), rounded to nearest 50
 * Big Blind   (index 1): Small * 1.5
 * Boss Match  (index 2): Small * 2.0
 */
export function getBlindConfig(ante: number, blindIndex: number): BlindConfig {
  const isBoss = blindIndex === 2
  const smallBlind = Math.round((300 * Math.pow(2.5, ante - 1)) / 50) * 50
  const multipliers = [1, 1.5, 2.0]
  const targetScore = Math.round(smallBlind * multipliers[blindIndex])

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
