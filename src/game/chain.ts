import type { Chain, Tile, PlacedTile, BossModifier } from './types'

/**
 * Creates a chain with one starting tile.
 */
export function initChain(tile: Tile): Chain {
  const placed: PlacedTile = { tile, flipped: false, brokenLink: false }
  return { tiles: [placed], openEnd: tile.right }
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
 * If it's a broken link, the tile is placed as-is (not flipped), openEnd = tile.right.
 * If it matches, orient so the matching end connects.
 */
export function placeTile(chain: Chain, tile: Tile): Chain {
  const openEnd = chain.openEnd
  const matches = tile.left === openEnd || tile.right === openEnd

  let flipped = false
  let newOpenEnd: number

  if (matches) {
    // Orient so matching pip connects
    flipped = tile.right === openEnd
    newOpenEnd = flipped ? tile.left : tile.right
  } else {
    // Broken link — place left-to-right, openEnd = tile.right
    flipped = false
    newOpenEnd = tile.right
  }

  const placed: PlacedTile = { tile, flipped, brokenLink: !matches }
  return { tiles: [...chain.tiles, placed], openEnd: newOpenEnd }
}
