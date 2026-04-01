import type { Tile, Chain } from './types'

/**
 * Check if the first tile of a new hand matches the anchor tile
 * The first tile must match one of the pips on the anchor
 */
export function checkAnchorMatch(anchorTile: Tile | null, firstTile: Tile): boolean {
  if (!anchorTile) {
    // No anchor tile (first hand of the match)
    return true
  }
  
  // Check if first tile matches either end of the anchor tile
  return (
    firstTile.left === anchorTile.left ||
    firstTile.left === anchorTile.right ||
    firstTile.right === anchorTile.left ||
    firstTile.right === anchorTile.right
  )
}

/**
 * Get the starting bone for the first hand of a match
 * Returns [0|0] as the starting bone
 */
export function getStartingBone(): Tile {
  return { left: 0, right: 0, id: '0-0' }
}

/**
 * Calculate hand penalty: sum of pips of tiles remaining in hand
 */
export function calculateHandPenalty(hand: Tile[]): number {
  return hand.reduce((sum, tile) => sum + tile.left + tile.right, 0)
}