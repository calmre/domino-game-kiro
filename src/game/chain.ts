import type { Chain, Tile, PlacedTile, BossModifier } from './types'

/**
 * Creates a chain with one starting tile.
 * For the first tile, both ends are open for the next tile to connect to.
 * If there's an anchor, the first tile should connect to the anchor's open end.
 */
export function initChain(tile: Tile, anchorTile?: Tile): Chain {
  let placed: PlacedTile
  let openEnd: number

  if (anchorTile) {
    // First tile must connect to anchor's open end
    // Anchor's open end is always on the right side visually
    // Determine which end of the tile matches the anchor
    const canConnectLeft = tile.left === anchorTile.left || tile.left === anchorTile.right
    const canConnectRight = tile.right === anchorTile.left || tile.right === anchorTile.right

    if (canConnectLeft) {
      // Left end connects to anchor, so don't flip (left connects, right is open)
      placed = { tile, flipped: false, brokenLink: false }
      openEnd = tile.right
    } else if (canConnectRight) {
      // Right end connects to anchor, so flip (right connects, left is open)
      placed = { tile, flipped: true, brokenLink: false }
      openEnd = tile.left
    } else {
      // Broken link with anchor
      placed = { tile, flipped: false, brokenLink: true }
      openEnd = tile.right
    }
  } else {
    // No anchor, just place the tile normally
    // Both ends are open until second tile is placed
    placed = { tile, flipped: false, brokenLink: false }
    openEnd = -1  // Special value: both ends open
  }

  return { tiles: [placed], openEnd }
}

/**
 * Any tile can be placed. Returns false only for boss modifier violations.
 */
export function validatePlacement(
  _chain: Chain,
  tile: Tile,
  bossModifier?: BossModifier
): boolean {
  if (bossModifier?.type === 'no_doubles' && tile.left === tile.right) return false
  return true
}

/**
 * Appends a tile to the chain. Detects broken links when pips don't match.
 * Special handling for second tile: it can connect on either end of the first tile.
 */
export function placeTile(chain: Chain, tile: Tile): Chain {
  const isSecondTile = chain.tiles.length === 1
  
  if (isSecondTile) {
    // Second tile: can connect to either end of the first tile
    const firstTile = chain.tiles[0].tile
    const firstTileFlipped = chain.tiles[0].flipped
    
    // Check which end of the second tile can connect to which end of the first tile
    const secondTileMatchesFirstLeft = tile.left === firstTile.left || tile.right === firstTile.left
    const secondTileMatchesFirstRight = tile.left === firstTile.right || tile.right === firstTile.right
    
    let flipped = false
    let newOpenEnd: number
    let brokenLink = false
    let newFirstTileFlipped = false
    
    // Prefer connecting to the right end of the first tile
    if (secondTileMatchesFirstRight) {
      // Second tile connects to first tile's right end
      // First tile stays not flipped (right end connects, left end is open)
      newFirstTileFlipped = false
      
      if (tile.left === firstTile.right) {
        // tile.left connects, so tile is not flipped
        flipped = false
        newOpenEnd = tile.right
      } else {
        // tile.right connects, so tile is flipped
        flipped = true
        newOpenEnd = tile.left
      }
    } else if (secondTileMatchesFirstLeft) {
      // Second tile connects to first tile's left end
      // First tile gets flipped (left end connects, right end is open)
      newFirstTileFlipped = true
      
      if (tile.left === firstTile.left) {
        // tile.left connects, so tile is not flipped
        flipped = false
        newOpenEnd = tile.right
      } else {
        // tile.right connects, so tile is flipped
        flipped = true
        newOpenEnd = tile.left
      }
    } else {
      // Broken link
      brokenLink = true
      flipped = false
      newOpenEnd = tile.right
    }
    
    const placed: PlacedTile = { tile, flipped, brokenLink }
    let updatedTiles = [...chain.tiles]
    updatedTiles[0] = { ...updatedTiles[0], flipped: newFirstTileFlipped }
    
    return { tiles: [...updatedTiles, placed], openEnd: newOpenEnd }
  } else {
    // Subsequent tiles (3rd+): connect to the current openEnd
    const openEnd = chain.openEnd
    const matches = tile.left === openEnd || tile.right === openEnd

    let flipped = false
    let newOpenEnd: number
    let brokenLink = false

    if (matches) {
      // Determine which end of the tile matches and how to orient it
      if (tile.left === openEnd) {
        // Left end matches, so tile is not flipped (left connects, right is open)
        flipped = false
        newOpenEnd = tile.right
      } else {
        // Right end matches, so tile is flipped (right connects, left is open)
        flipped = true
        newOpenEnd = tile.left
      }
    } else {
      // Broken link — place not flipped
      brokenLink = true
      flipped = false
      newOpenEnd = tile.right
    }

    const placed: PlacedTile = { tile, flipped, brokenLink }
    return { tiles: [...chain.tiles, placed], openEnd: newOpenEnd }
  }
}
