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
    // Determine which end of the tile matches the anchor
    const canConnectLeft = tile.left === anchorTile.left || tile.left === anchorTile.right
    const canConnectRight = tile.right === anchorTile.left || tile.right === anchorTile.right

    if (canConnectRight) {
      // Right end connects to anchor, left end is open
      placed = { tile, flipped: false, brokenLink: false }
      openEnd = tile.left
    } else if (canConnectLeft) {
      // Left end connects to anchor, right end is open
      placed = { tile, flipped: true, brokenLink: false }
      openEnd = tile.right
    } else {
      // Broken link with anchor
      placed = { tile, flipped: false, brokenLink: true }
      openEnd = tile.right
    }
  } else {
    // No anchor, just place the tile normally
    placed = { tile, flipped: false, brokenLink: false }
    openEnd = tile.right
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
    
    // Get the actual open ends of the first tile (considering orientation)
    const firstTileLeftEnd = firstTileFlipped ? firstTile.right : firstTile.left
    const firstTileRightEnd = firstTileFlipped ? firstTile.left : firstTile.right
    
    // Check which end of the second tile can connect
    const canConnectToLeft = tile.left === firstTileLeftEnd || tile.right === firstTileLeftEnd
    const canConnectToRight = tile.left === firstTileRightEnd || tile.right === firstTileRightEnd
    
    let flipped = false
    let newOpenEnd: number
    let brokenLink = false
    let newFirstTileFlipped = firstTileFlipped
    
    if (canConnectToRight) {
      // Connect to right end of first tile (preferred)
      flipped = tile.right === firstTileRightEnd
      newOpenEnd = flipped ? tile.left : tile.right
      newFirstTileFlipped = false  // First tile right end is connected
    } else if (canConnectToLeft) {
      // Connect to left end of first tile
      flipped = tile.right === firstTileLeftEnd
      newOpenEnd = flipped ? tile.left : tile.right
      newFirstTileFlipped = true  // First tile left end is connected
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
      // Orient so matching pip connects
      flipped = tile.right === openEnd
      newOpenEnd = flipped ? tile.left : tile.right
    } else {
      // Broken link — place left-to-right, openEnd = tile.right
      brokenLink = true
      flipped = false
      newOpenEnd = tile.right
    }

    const placed: PlacedTile = { tile, flipped, brokenLink }
    return { tiles: [...chain.tiles, placed], openEnd: newOpenEnd }
  }
}
