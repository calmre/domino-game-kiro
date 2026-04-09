import type { Chain, MultiplierBreakdown, BossModifier, ShopItem, Tile } from './types'
import { findLongestChain } from './chainFinder'

/**
 * Base score: sum of all pip values.
 * Each 0 pip counts as 7 points.
 * Tiles with broken links do NOT contribute to base score.
 * frozen_bone: doubles contribute 0 pips.
 */
export function calculateBaseScore(chain: Chain, bossModifier?: BossModifier, items: ShopItem[] = [], anchorTile?: Tile | null, currency: number = 0, handSize: number = -1, hand: Tile[] = [], phenomenalEvilBonus: number = 0): number {
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
    
    return sum + leftPip + rightPip
  }, 0)
  
  // Apply pip_bonus upgrades: +5 per tile side matching the pip
  for (const item of items) {
    if (item.effect.type === 'pip_bonus') {
      const pip = item.effect.pip
      for (const pt of chain.tiles) {
        if (pt.brokenLink) continue
        if (bossModifier?.type === 'frozen_bone' && pt.tile.left === pt.tile.right) continue
        if (pt.tile.left === pip) base += 5
        if (pt.tile.right === pip) base += 5
      }
    }
  }

  // seventh_son: +30 per 3 zero-pips (stacks), but if 6+ zeroes: +100 flat instead
  if (items.some(i => i.effect.type === 'seventh_son')) {
    let zeroPipCount = 0
    for (const pt of chain.tiles) {
      if (pt.brokenLink) continue
      if (pt.tile.left === 0) zeroPipCount++
      if (pt.tile.right === 0) zeroPipCount++
    }
    if (zeroPipCount >= 6) {
      base += 100
    } else {
      base += Math.floor(zeroPipCount / 3) * 30
    }
  }

  // lean_machine: +70 if board has 1-3 tiles (chain tiles + anchor), negated if more than 3
  if (items.some(i => i.effect.type === 'lean_machine')) {
    const boardCount = chain.tiles.length + (anchorTile ? 1 : 0)
    if (boardCount >= 1 && boardCount <= 3) base += 70
  }

  // last_tile_standing: +100 base if exactly 1 tile was played
  if (items.some(i => i.effect.type === 'last_tile_standing') && chain.tiles.length === 1) {
    base += 100
  }

  // held_power: +10 base per unplayed tile
  if (items.some(i => i.effect.type === 'held_power') && handSize > 0) {
    base += handSize * 10
  }

  // phenomenal_evil: permanent bonus accumulated over the game
  if (phenomenalEvilBonus > 0) {
    base += phenomenalEvilBonus
  }

  // weakest_link: find unplayed tile with smallest pip value, double its pip contribution to base
  if (items.some(i => i.effect.type === 'weakest_link') && hand.length > 0) {
    let minPip = Infinity
    for (const t of hand) {
      const pip = Math.min(t.left === 0 ? 7 : t.left, t.right === 0 ? 7 : t.right)
      if (pip < minPip) minPip = pip
    }
    if (minPip !== Infinity) base += minPip * 2
  }
  
  // Apply score_bonus upgrades
  let scoreBonusAdd = 0
  for (const item of items) {
    const effect = item.effect
    if (effect.type === 'score_bonus') scoreBonusAdd += effect.flat
    if (effect.type === 'gold_to_score') scoreBonusAdd += currency
  }
  
  return base + scoreBonusAdd
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
  _handSize: number = 0,
  anchorTile?: Tile | null,
  currency: number = 0,
  hand: Tile[] = []
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
      brokenLinks: 0,
      dominoBonus: false,
      perfectLoopBonus: false,
      binaryCodeBonus: false,
      compoundInterestBonus: 0,
      total: 1.0 * doubleMultiplier
    }
  }
  
  if (tiles.length === 0 && !anchorTile) {
    return { 
      chainLength: 0, 
      chainBonus: 0, 
      doubleMultiplier: 1.0, 
      brokenLinks: 0, 
      dominoBonus: false, 
      perfectLoopBonus: false,
      binaryCodeBonus: false,
      compoundInterestBonus: 0,
      total: 1.0 
    }
  }

  // 1. CHAIN: Find longest continuous sequence of matching ends
  // Include anchor in chain calculation
  const { maxChainLength, chainMult } = findLongestChain(tiles)
  
  // If anchor exists, it provides a base ×1 multiplier, and each tile adds +1
  // So: anchor alone = ×1, anchor + 1 tile = ×2, anchor + 2 tiles = ×3, etc.
  let finalChainLength = maxChainLength
  let finalChainMult = chainMult
  
  if (anchorTile) {
    // Anchor gives free ×1, each matching tile adds +1
    finalChainLength = maxChainLength + 1
    finalChainMult = Math.min(finalChainLength, 6)  // Cap at ×6
  }
  
  // Count broken links (for display only)
  const brokenLinks = tiles.filter(tile => tile.brokenLink).length
  
  // 2. DOUBLES: Count double tiles and calculate multiplier
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
  
  // 5. APPLY UPGRADE EFFECTS
  let chainBonusAdd = 0
  let doubleBoostAdd = 0
  let multiplierBonusAdd = 0
  let hasPerfectLoop = false
  let hasLongLink = false
  let longLinkAmount = 0
  let hasGoldToMultiplier = false
  let hasBinaryCode = false
  let hasDoubleOrNothing = false
  let hasBenchwarmer = false
  let hasAllIn = false
  
  for (const item of items) {
    const effect = item.effect
    switch (effect.type) {
      case 'chain_bonus': chainBonusAdd += effect.amount; break
      case 'double_boost': doubleBoostAdd += effect.amount; break
      case 'multiplier_bonus': multiplierBonusAdd += effect.amount; break
      case 'perfect_loop': hasPerfectLoop = true; break
      case 'long_link': hasLongLink = true; longLinkAmount = effect.amount; break
      case 'gold_to_multiplier': hasGoldToMultiplier = true; break
      case 'lean_machine': break
      case 'binary_code': hasBinaryCode = true; break
      case 'double_or_nothing': hasDoubleOrNothing = true; break
      case 'benchwarmer': hasBenchwarmer = true; break
      case 'all_in': hasAllIn = true; break
    }
  }
  
  // DOMINO BONUS: all_in upgrades it to ×3.0
  const dominoBonus = handEmpty && brokenLinks === 0
  const dominoMultiplier = dominoBonus ? (hasAllIn ? 3.0 : 1.75) : 1.0

  // Apply chain bonus upgrade (Long Link: +1.5 per tile instead of +1)
  let adjustedChainMult = finalChainMult
  if (hasLongLink) {
    // Long Link increases chain bonus per tile
    adjustedChainMult = 1 + (finalChainLength * (1 + longLinkAmount))
  } else {
    adjustedChainMult = finalChainMult + chainBonusAdd
  }
  
  // Apply double boost upgrade — or Double or Nothing (×2.0 per double)
  const baseDoubleMultiplier = hasDoubleOrNothing ? 2.0 : (1.25 + doubleBoostAdd)
  doubleMultiplier = Math.pow(baseDoubleMultiplier, doubleCount)
  
  // Apply Perfect Loop upgrade: chain's open end matches the first tile's entry pip
  let perfectLoopMultiplier = 1.0
  if (hasPerfectLoop && tiles.length >= 2) {
    const firstTile = tiles[0]
    const firstEntryPip = firstTile.flipped ? firstTile.tile.right : firstTile.tile.left
    if (chain.openEnd === firstEntryPip) {
      perfectLoopMultiplier = 2.0
    }
  }
  
  
  // 6. CALCULATE TOTAL MULTIPLIER:
  let total = adjustedChainMult
  total *= doubleMultiplier
  total *= dominoMultiplier
  total *= perfectLoopMultiplier

  // gold_to_multiplier: per 5 gold, +1.25x
  let compoundInterestBonus = 0
  if (hasGoldToMultiplier && currency > 0) {
    compoundInterestBonus = 1 + Math.floor(currency / 5) * 0.25
    total *= compoundInterestBonus
  }

  // lean_machine: +70 base pips if hand size <= 3 (applied as score bonus in base, but
  // we handle it here as a flat base addition reflected in total via a ratio isn't clean —
  // lean_machine is handled in calculateBaseScore via extraBase param passed from round.ts)

  // binary_code: ×1.5 if all played tiles are only 0s and 1s
  let binaryCodeTriggered = false
  if (hasBinaryCode && tiles.length > 0) {
    const allBinary = tiles.every(pt => !pt.brokenLink &&
      (pt.tile.left === 0 || pt.tile.left === 1) &&
      (pt.tile.right === 0 || pt.tile.right === 1))
    if (allBinary) { total *= 1.5; binaryCodeTriggered = true }
  }

  // double_or_nothing: halve score if no Domino! bonus
  if (hasDoubleOrNothing && !dominoBonus) {
    total *= 0.5
  }

  // benchwarmer: ×1.25 per unplayed tile, negated if Domino!
  if (hasBenchwarmer && !dominoBonus && hand.length > 0) {
    total *= Math.pow(1.25, hand.length)
  }

  // Apply multiplier bonus upgrade
  total += multiplierBonusAdd

  total = Math.max(1.0, total)

  return {
    chainLength: finalChainLength,
    chainBonus: adjustedChainMult,
    doubleMultiplier,
    brokenLinks,
    dominoBonus,
    perfectLoopBonus: perfectLoopMultiplier > 1.0,
    binaryCodeBonus: binaryCodeTriggered,
    compoundInterestBonus,
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
  handSize: number = 0,
  currency: number = 0,
  hand: Tile[] = [],
  phenomenalEvilBonus: number = 0
): number {
  const baseScore = calculateBaseScore(chain, bossModifier, items, anchorTile, currency, handSize, hand, phenomenalEvilBonus)
  const multiplier = calculateMultiplier(chain, bossModifier, handEmpty, items, handSize, anchorTile, currency, hand)
  return Math.floor(baseScore * multiplier.total)
}