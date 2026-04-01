import type { Chain, MultiplierBreakdown, BossModifier, ShopItem } from './types'
import { findLongestChain } from './chainFinder'

/**
 * Base score: sum of all pip values.
 * Each 0 pip counts as 7 points.
 * Tiles with broken links do NOT contribute to base score.
 * frozen_bone: doubles contribute 0 pips.
 */
export function calculateBaseScore(chain: Chain, bossModifier?: BossModifier, items: ShopItem[] = [], anchorTile?: Tile | null): number {
  // Start with anchor tile if present
  let base = 0
  
  console.log('calculateBaseScore - anchorTile:', anchorTile)
  
  if (anchorTile) {
    // Add anchor tile pips to base score
    let anchorLeft = anchorTile.left
    let anchorRight = anchorTile.right
    
    console.log('Anchor pips:', anchorLeft, anchorRight)
    
    // Check for Zero Gravity upgrade
    const hasZeroGravity = items.some(item => item.effect.type === 'zero_gravity')
    if (hasZeroGravity) {
      anchorLeft = anchorLeft === 0 ? 10 : anchorLeft
      anchorRight = anchorRight === 0 ? 10 : anchorRight
    } else {
      anchorLeft = anchorLeft === 0 ? 7 : anchorLeft
      anchorRight = anchorRight === 0 ? 7 : anchorRight
    }
    
    // Check for Heavy Lead upgrade
    const hasHeavyLead = items.some(item => item.effect.type === 'heavy_lead')
    if (hasHeavyLead) {
      if (anchorTile.left === 6) anchorLeft += 5
      if (anchorTile.right === 6) anchorRight += 5
    }
    
    base += anchorLeft + anchorRight
    console.log('Base score from anchor:', base)
  }
  
  // No tiles = just anchor score
  if (chain.tiles.length === 0) return base
  
  base += chain.tiles.reduce((sum, pt) => {
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
      if (pt.tile.left === 6) leftPip += 5
      if (pt.tile.right === 6) rightPip += 5
    }
    
    return sum + leftPip + rightPip
  }, 0)
  
  // Apply boss modifier penalties
  // (none currently)
  
  // Apply score_bonus upgrades
  let scoreBonusAdd = 0
  for (const item of items) {
    const effect = item.effect
    if (effect.type === 'score_bonus') {
      scoreBonusAdd += effect.flat
    }
  }
  
  // Remove Lead Weight upgrade logic (already handled by including anchor in base)
  
  return base + scoreBonusAdd
}

/**
 * Check if all played tiles form a sequential +1 order (Run bonus)
 * This checks if the pips form a consecutive sequence in order on the board
 * Note: 0 counts as both 0 AND 7 for run detection
 * Runs can be ascending (0,1,2,3) or descending (6,5,4,3)
 */
function checkSequentialRun(chain: Chain, anchorTile?: Tile | null): boolean {
  if (chain.tiles.length < 2 && !anchorTile) return false
  
  // Extract pips in the order they appear in the chain
  const pipsInOrder: number[] = []
  
  // Add anchor pips first if present
  if (anchorTile) {
    pipsInOrder.push(anchorTile.left)
    pipsInOrder.push(anchorTile.right)
  }
  
  for (const pt of chain.tiles) {
    // Get the displayed left and right values
    const displayLeft = pt.flipped ? pt.tile.right : pt.tile.left
    const displayRight = pt.flipped ? pt.tile.left : pt.tile.right
    
    // Add both pips from each tile
    pipsInOrder.push(displayLeft)
    pipsInOrder.push(displayRight)
  }
  
  // Need at least 2 pips to form a run
  if (pipsInOrder.length < 2) return false
  
  // Check if pips form a sequential run (each pip differs by 1 from the previous)
  // Allow for 0 counting as both 0 and 7
  // Also allow same pip (difference of 0) for doubles
  let isSequential = true
  for (let i = 1; i < pipsInOrder.length; i++) {
    const prev = pipsInOrder[i - 1]
    const curr = pipsInOrder[i]
    const diff = curr - prev
    
    // Check if difference is +1, -1, 0 (same), or wrapping (0→7 or 7→0)
    const isValidDiff = diff === 0 || diff === 1 || diff === -1 || 
                        (prev === 0 && curr === 7) || 
                        (prev === 7 && curr === 0)
    
    if (!isValidDiff) {
      isSequential = false
      break
    }
  }
  
  return isSequential
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
  handSize: number = 0,
  anchorTile?: Tile | null
): MultiplierBreakdown {
  const tiles = chain.tiles
  
  // Special case: anchor only, no tiles placed yet
  if (tiles.length === 0 && anchorTile) {
    // Anchor gives ×1 chain bonus
    let doubleMultiplier = 1.0
    if (anchorTile.left === anchorTile.right && bossModifier?.type !== 'frozen_bone') {
      doubleMultiplier = 1.25  // Anchor is a double
    }
    
    return {
      chainLength: 1,
      chainBonus: 1.0,
      doubleMultiplier,
      runMultiplier: 1.0,
      brokenLinks: 0,
      dominoBonus: false,
      total: 1.0 * doubleMultiplier
    }
  }
  
  if (tiles.length === 0 && !anchorTile) {
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
  // Include anchor in chain calculation
  const { maxChainLength, chainMult, chainCount } = findLongestChain(tiles)
  
  // If anchor exists, it provides a base ×1 multiplier, and each tile adds +1
  // So: anchor alone = ×1, anchor + 1 tile = ×2, anchor + 2 tiles = ×3, etc.
  let finalChainLength = maxChainLength
  let finalChainMult = chainMult
  
  if (anchorTile) {
    // Anchor gives free ×1, each matching tile adds +1
    finalChainLength = maxChainLength + 1
    finalChainMult = Math.min(finalChainLength, 6)  // Cap at ×6
  }
  
  // Count broken links (for display only - doesn't affect run bonus anymore)
  const brokenLinks = tiles.filter(tile => tile.brokenLink).length
  
  // 2. RUN: Check if total pips form sequential +1 order
  // Include anchor in run detection
  let runMultiplier = 1.0
  if (bossModifier?.type !== 'sandpaper') {
    if (checkSequentialRun(chain, anchorTile)) {
      runMultiplier = 1.5  // ×1.5 for sequential run
    }
  }
  
  // 3. DOUBLES: Count double tiles and calculate multiplier
  // Include anchor if it's a double
  let doubleCount = 0
  if (anchorTile && anchorTile.left === anchorTile.right && bossModifier?.type !== 'frozen_bone') {
    doubleCount++
  }
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
  let adjustedChainMult = finalChainMult
  if (hasLongLink) {
    // Long Link increases chain bonus per tile
    adjustedChainMult = 1 + (finalChainLength * (1 + longLinkAmount))
  } else {
    adjustedChainMult = finalChainMult + chainBonusAdd
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
  let total = adjustedChainMult  // Start with chain bonus as direct multiplier
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
    chainLength: finalChainLength, 
    chainBonus: adjustedChainMult, 
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
  const multiplier = calculateMultiplier(chain, bossModifier, handEmpty, items, handSize, anchorTile)
  return Math.floor(baseScore * multiplier.total)
}