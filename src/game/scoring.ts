import type { Chain, MultiplierBreakdown, BossModifier } from './types'

/**
 * Base score: sum of all pip values.
 * frozen_bone: doubles contribute 0 pips.
 * lead_weight: subtract 5 from total (floor 0).
 */
export function calculateBaseScore(chain: Chain, bossModifier?: BossModifier): number {
  let base = chain.tiles.reduce((sum, pt) => {
    if (bossModifier?.type === 'frozen_bone' && pt.tile.left === pt.tile.right) return sum
    return sum + pt.tile.left + pt.tile.right
  }, 0)
  if (bossModifier?.type === 'lead_weight') base = Math.max(0, base - 5)
  return base
}

function segmentMultiplier(len: number): number {
  if (len >= 5) return 3
  if (len === 4) return 2
  return 1
}

interface SegmentResult {
  len: number
  doubleBonus: number
  runBonus: number
}

function scoreSegment(
  tiles: Chain['tiles'],
  start: number,
  end: number,
  bossModifier?: BossModifier
): SegmentResult {
  const segLen = end - start
  let doubleBonus = 0
  let runBonus = 0

  for (let i = start; i < end; i++) {
    const t = tiles[i].tile
    // frozen_bone: doubles give no bonus
    if (t.left === t.right && bossModifier?.type !== 'frozen_bone') doubleBonus += 0.5
  }

  // sandpaper: no run bonus
  if (segLen >= 2 && bossModifier?.type !== 'sandpaper') {
    const sharedPips: number[] = []
    for (let i = start; i < end - 1; i++) {
      const pt = tiles[i]
      sharedPips.push(pt.flipped ? pt.tile.left : pt.tile.right)
    }
    for (let i = 1; i < sharedPips.length; i++) {
      if (sharedPips[i] === sharedPips[i - 1] + 1) runBonus += 1
    }
  }

  return { len: segLen, doubleBonus, runBonus }
}

export function calculateMultiplier(chain: Chain, bossModifier?: BossModifier): MultiplierBreakdown {
  const tiles = chain.tiles
  if (tiles.length === 0) {
    return { chainLength: 1, doubleBonus: 0, runBonus: 0, brokenLinks: 0, total: 1 }
  }

  const segments: SegmentResult[] = []
  let brokenLinks = 0
  let segStart = 0

  for (let i = 1; i <= tiles.length; i++) {
    const isBroken = i < tiles.length && tiles[i].brokenLink
    const isEnd = i === tiles.length
    if (isBroken || isEnd) {
      segments.push(scoreSegment(tiles, segStart, i, bossModifier))
      if (isBroken) { brokenLinks++; segStart = i }
    }
  }

  const best = segments.reduce((a, b) => (a.len >= b.len ? a : b))
  const chainLength = segmentMultiplier(best.len)
  const doubleBonus = best.doubleBonus
  const runBonus = best.runBonus
  const total = Math.max(1, chainLength + doubleBonus + runBonus)

  return { chainLength, doubleBonus, runBonus, brokenLinks, total }
}

export function calculateFinalScore(chain: Chain, bossModifier?: BossModifier): number {
  return calculateBaseScore(chain, bossModifier) * calculateMultiplier(chain, bossModifier).total
}
