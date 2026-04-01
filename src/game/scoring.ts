import type { Chain, MultiplierBreakdown, BossModifier, ShopItem } from './types'
import { findLongestChain } from './chainFinder'

/**
 * Base score: sum of all pip values.
 * Each 0 pip counts as 7 points.
 * Tiles with broken links do NOT contribute to base score.
 * frozen_bone: doubles contribute 0 pips.
 * lead_weight: subtract 5 from total (floor 0).
 */
export function calculateBaseScore(chain: Chain, bossModifier?: BossModifier, items: ShopItem[] = [], anchorTile?: Tile | null): number {
  // No tiles = no score
  if (chain.tiles.length === 0) return 0
  
  let base = chain.tiles.reduce((sum, pt) => {
    // Skip tiles with broken links - they don't contribute to base score
    if (pt.brokenLink) return sum
    
    if (bossModifier?.type === 'frozen_bone' && pt.tile.left === pt.tile.right) return sum
    
    // Each 0 pip counts as 7 (or 10 with Zero Gravity upgrade)
    let leftPip = pt.tile.left
    let rightPip = pt.tile.right
    
    // Check for Zero Gravity upgrade
    const hasZeroGravity = items.some(item => item.effect.type === 'zero_gravity')
    if (hasZeroGravity) {
      leftPip = leftPip === 0 ? 10 : leftPip
      rightPip = rightPip === 0 ? 10 : rightPip
    } else {
      leftPip = leftPip === 0 ? 7 : leftPip
      rightPip = rightPip === 0 ? 7 : rightPip
    }
    
    // Check for Heavy Lead upgrade
    const hasHeavyLead = items.some(item => item.effect.type === 'heavy_lead')
    if (hasHeavyLead) {
      if (pt.tile.left === 6 || pt.tile.right === 6) {
        leftPip += 5
        rightPip += 5
      }
    }
    
    return sum + leftPip + rightPip
  }, 0)
  
  // Apply boss modifier penalties
  if (bossModifier?.type === 'lead_weight') base = Math.max(0, base - 5)
  
  // Apply score_bonus upgrades
  let scoreBonusAdd = 0
  for (const item of items) {
    const effect = item.effect
    if (effect.type === 'score_bonus') {
      scoreBonusAdd += effect.flat
    }
  }
  
  // Apply Lead Weight upgrade (anchor tile adds its pip value)
  const hasLeadWeight = items.some(item => item.effect.type === 'lead_weight')
  if (hasLeadWeight && anchorTile) {
    let anchorPipValue = 0
    if (anchorTile.left === 0) {
      anchorPipValue += items.some(item => item.effect.type === 'zero_gravity') ? 10 : 7
    } else {
      anchorPipValue += anchorTile.left
    }
    if (anchorTile.right === 0) {
      anchorPipValue += items.some(item => item.effect.type === 'zero_gravity') ? 10 : 7
    } else {
      anchorPipValue += anchorTile.right
    }
    base += anchorPipValue
  }
  
  return base + scoreBonusAdd
}

/**
 * Check if all played tiles form a sequential +1 order (Run bonus)
 * This checks if the pips form a consecutive sequence in order on the board
 * Note: 0 counts as both 0 AND 7 for run detection
 * Runs can be ascending (0,1,2,3) or descending (6,5,4,3)
 */
function checkSequentialRun(chain: Chain): boolean {
  if (chain.tiles.length < 2) return false
  
  // Extract pips in order from the chain
  const pipsInOrder: number[] = []
  
  // Add the left pip of the first tile
  pipsInOrder.push(chain.tiles[0].tile.left)
  
  // Add all right pips (which are the open ends as we go through the chain)
  for (const pt of chain.tiles) {
    pipsInOrder.push(pt.tile.right)
  }
  
  // Get unique pips
  const uniquePips = new Set<number>()
  for (const pip of pipsInOrder) {
    uniquePips.add(pip)
  }
  
  // Convert to sorted array
  let sortedPips = [...uniquePips].sort((a, b) => a - b)
  
  // Check if sorted pips form a consecutive sequence (ascending)
  let isAscending = true
  for (let i = 1; i < sortedPips.length; i++) {
    const diff = sortedPips[i] - sortedPips[i - 1]
    // Allow diff of 1, or diff of 6 if we're wrapping from 0 to 7
    if (diff !== 1 && !(sortedPips[i - 1] === 0 && sortedPips[i] === 7)) {
      isAscending = false
      break
    }
  }
  
  if (isAscending) return true
  
  // Check if sorted pips form a consecutive sequence (descending)
  let isDescending = true
  for (let i = 1; i < sortedPips.length; i++) {
    const diff = sortedPips[i - 1] - sortedPips[i]
    // Allow diff of 1, or diff of 6 if we're wrapping from 7 to 0
    if (diff !== 1 && !(sortedPips[i - 1] === 7 && sortedPips[i] === 0)) {
      isDescending = false
      break
    }
  }
  
  return isDescending
}

/**
 * Calculate multiplier according to finalized Domino Soul rules:
 * 1. Chain: longest continuous sequence of matching ends (+2, +3, +4 to base 1.0x)
 * 2. Run: if total pips form sequential +1 order (×1.25)
 * 3. Doubles: each double tile (×1.15)
 * 4. Domino Bonus: if hand empty (×1.75)
 * 5. Order: (ChainBonus) * (RunMult) * (DoubleMults) * (DominoMult)
 * Multiple chains penalty: -1 to chain bonus for each chain beyond the first
 */
export function calculateMultiplier(
  chain: Chain, 
  bossModifier?: BossModifier,
  handEmpty: boolean = false,
  items: ShopItem[] = [],
  handSize: number = 0
): MultiplierBreakdown {
  const tiles = chain.tiles
  if (tiles.length === 0) {
    return { 
      chainLength: 0, 
      chainBonus: 0, 
      doubleMultiplier: 1.0, 
      runMultiplier: 1.0, 
      brokenLinks: 0, 
      dominoBonus: false, 
      total: 1.0 
    }
  }

  // 1. CHAIN: Find longest continuous sequence of matching ends
  const { maxChainLength, chainMult, chainCount } = findLongestChain(tiles)
  
  // Count broken links (for display only - doesn't affect run bonus anymore)
  const brokenLinks = tiles.filter(tile => tile.brokenLink).length
  
  // 2. RUN: Check if total pips form sequential +1 order
  let runMultiplier = 1.0
  // Safety Check: Broken chain doesn't necessarily break a run (separate logic)
  if (bossModifier?.type !== 'sandpaper') {
    if (checkSequentialRun(chain)) {
      runMultiplier = 1.5  // ×1.5 for sequential run
    }
  }
  
  // 3. DOUBLES: Count double tiles and calculate multiplier
  let doubleCount = 0
  for (const pt of tiles) {
    if (pt.tile.left === pt.tile.right && bossModifier?.type !== 'frozen_bone') {
      doubleCount++
    }
  }
  let doubleMultiplier = Math.pow(1.25, doubleCount)  // ×1.25 per double
  
  // 4. DOMINO BONUS: If hand is empty AND no broken chain
  // Domino multiplier shouldn't apply if there's ANY broken chain
  const dominoBonus = handEmpty && brokenLinks === 0
  const dominoMultiplier = dominoBonus ? 1.75 : 1.0  // ×1.75 for empty hand only if chain is unbroken
  
  // 5. APPLY UPGRADE EFFECTS
  let chainBonusAdd = 0
  let doubleBoostAdd = 0
  let multiplierBonusAdd = 0
  let hasSequentialSpark = false
  let hasPerfectLoop = false
  let hasSlimFit = false
  let hasLongLink = false
  let longLinkAmount = 0
  
  for (const item of items) {
    const effect = item.effect
    switch (effect.type) {
      case 'chain_bonus':
        chainBonusAdd += effect.amount
        break
      case 'double_boost':
        doubleBoostAdd += effect.amount
        break
      case 'multiplier_bonus':
        multiplierBonusAdd += effect.amount
        break
      case 'sequential_spark':
        hasSequentialSpark = true
        break
      case 'perfect_loop':
        hasPerfectLoop = true
        break
      case 'slim_fit':
        hasSlimFit = true
        break
      case 'long_link':
        hasLongLink = true
        longLinkAmount = effect.amount
        break
    }
  }
  
  // Apply chain bonus upgrade (Long Link: +1.5 per tile instead of +1)
  let finalChainMult = chainMult
  if (hasLongLink) {
    // Long Link increases chain bonus per tile
    finalChainMult = 1 + (maxChainLength * (1 + longLinkAmount))
  } else {
    finalChainMult = chainMult + chainBonusAdd
  }
  
  // Apply double boost upgrade (increase base double multiplier)
  const baseDoubleMultiplier = 1.25 + doubleBoostAdd
  doubleMultiplier = Math.pow(baseDoubleMultiplier, doubleCount)
  
  // Apply Sequential Spark upgrade (Run multiplier is ×2.0 instead of ×1.5)
  if (hasSequentialSpark && runMultiplier > 1.0) {
    runMultiplier = 2.0
  }
  
  // Apply Perfect Loop upgrade (If first tile matches last tile, gain ×1.5 multiplier)
  let perfectLoopMultiplier = 1.0
  if (hasPerfectLoop && tiles.length >= 2) {
    const firstTile = tiles[0].tile
    const lastTile = tiles[tiles.length - 1].tile
    // Check if first tile matches last tile (considering orientation)
    if ((firstTile.left === lastTile.left && firstTile.right === lastTile.right) ||
        (firstTile.left === lastTile.right && firstTile.right === lastTile.left)) {
      perfectLoopMultiplier = 1.5
    }
  }
  
  // Apply Slim Fit upgrade (+1.2x multiplier per empty hand slot below 5)
  let slimFitMultiplier = 1.0
  if (hasSlimFit && handSize > 0) {
    const emptySlots = Math.max(0, 5 - handSize) // 5 is the base hand size
    slimFitMultiplier = Math.pow(1.2, emptySlots)
  }
  
  // 6. CALCULATE TOTAL MULTIPLIER according to order:
  // (ChainBonus) * (RunMult) * (DoubleMults) * (DominoMult) * (PerfectLoop) * (SlimFit)
  let total = finalChainMult  // Start with chain bonus as direct multiplier
  total *= runMultiplier
  total *= doubleMultiplier
  total *= dominoMultiplier
  total *= perfectLoopMultiplier
  total *= slimFitMultiplier
  
  // Apply multiplier bonus upgrade
  total += multiplierBonusAdd
  
  // Ensure minimum multiplier of 1.0
  total = Math.max(1.0, total)
  
  return { 
    chainLength: maxChainLength, 
    chainBonus: finalChainMult, 
    doubleMultiplier, 
    runMultiplier, 
    brokenLinks, 
    dominoBonus,
    total 
  }
}

/**
 * Calculate final score with Domino Soul rules
 */
export function calculateFinalScore(
  chain: Chain, 
  bossModifier?: BossModifier,
  handEmpty: boolean = false,
  items: ShopItem[] = [],
  anchorTile?: Tile | null,
  handSize: number = 0
): number {
  const baseScore = calculateBaseScore(chain, bossModifier, items, anchorTile)
  const multiplier = calculateMultiplier(chain, bossModifier, handEmpty, items, handSize)
  return Math.floor(baseScore * multiplier.total)
}