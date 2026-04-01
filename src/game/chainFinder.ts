import type { PlacedTile, Tile } from './types'

/**
 * Find the longest consecutive chain of matching domino tiles
 * Tiles match if the connecting pips are equal (valid domino connection)
 * Chain multiplier = chain length (1 tile = ×1, 2 tiles = ×2, 3 tiles = ×3, etc.)
 */
export function findLongestChain(playedTiles: PlacedTile[]): {
  maxChainLength: number
  isPureRun: boolean
  chainMult: number
  chainCount: number
} {
  if (playedTiles.length === 0) {
    return { maxChainLength: 0, isPureRun: false, chainMult: 0, chainCount: 0 }
  }
  
  let maxChainLength = 1
  let currentChainLength = 1
  let chainCount = 1  // Count number of separate chains
  
  // Iterate through tiles starting from the second one
  for (let i = 1; i < playedTiles.length; i++) {
    const prevTile = playedTiles[i - 1]
    const currentTile = playedTiles[i]
    
    // Get the open end of the previous tile (the end that's not connected)
    const prevEnd = prevTile.flipped ? prevTile.tile.left : prevTile.tile.right
    
    // Get the connecting end of the current tile (the end that should match prevEnd)
    // If the current tile is flipped, it connects at the right end
    // If not flipped, it connects at the left end
    const currentConnectingEnd = currentTile.flipped ? currentTile.tile.right : currentTile.tile.left
    
    if (prevEnd === currentConnectingEnd && !prevTile.brokenLink && !currentTile.brokenLink) {
      // Tiles match and no broken links, continue the chain
      currentChainLength++
    } else {
      // Tiles don't match or broken link, reset chain
      maxChainLength = Math.max(maxChainLength, currentChainLength)
      currentChainLength = 1
      chainCount++  // New chain started
    }
  }
  
  // Check final chain
  maxChainLength = Math.max(maxChainLength, currentChainLength)
  
  // Determine if it's a pure run (all tiles are in the longest chain)
  const isPureRun = maxChainLength === playedTiles.length
  
  // Chain multiplier = longest chain length, capped at 6 for 6+ tiles
  const chainMult = Math.min(maxChainLength, 6)
  
  return { maxChainLength, isPureRun, chainMult, chainCount }
}

/**
 * Alternative: Simple version that just counts consecutive tiles
 * Chain multiplier = chain length (1 tile = ×1, 2 tiles = ×2, 3 tiles = ×3, etc.)
 */
export function findLongestSimpleChain(playedTiles: PlacedTile[]): {
  maxChainLength: number
  isPureRun: boolean
  chainMult: number
  chainCount: number
} {
  if (playedTiles.length === 0) {
    return { maxChainLength: 0, isPureRun: false, chainMult: 0, chainCount: 0 }
  }
  
  let maxChainLength = 1
  let currentChainLength = 1
  let chainCount = 1
  
  // Simple version: just count consecutive tiles
  // (Assumes tiles are already placed in valid order)
  for (let i = 1; i < playedTiles.length; i++) {
    // Increment chain counter for each consecutive tile
    currentChainLength++
    
    // Check if we need to reset (based on broken link)
    if (playedTiles[i].brokenLink) {
      maxChainLength = Math.max(maxChainLength, currentChainLength - 1) // Don't count broken tile
      currentChainLength = 1
      chainCount++
    }
  }
  
  // Check final chain
  maxChainLength = Math.max(maxChainLength, currentChainLength)
  
  // Determine if it's a pure run (all tiles in one chain)
  const isPureRun = maxChainLength === playedTiles.length
  
  // Chain multiplier = longest chain length, capped at 6 for 6+ tiles
  const chainMult = Math.min(maxChainLength, 6)
  
  return { maxChainLength, isPureRun, chainMult, chainCount }
}